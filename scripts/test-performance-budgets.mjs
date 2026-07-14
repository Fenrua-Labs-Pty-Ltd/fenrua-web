import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { relative, resolve, sep } from "node:path";
import { outputDirectory, publicRouteFor, root } from "./public-output-lib.mjs";

const KILOBYTE = 1024;
const ORDINARY_HTML_BUDGET_BYTES = 200 * KILOBYTE;
const ROUTE_JAVASCRIPT_BUDGET_BYTES = 100 * KILOBYTE;

// Exceptions must be intentional, classified, and bounded. This registry page
// server-renders the complete audited toolchain, so it is not an ordinary page.
const NON_ORDINARY_ROUTE_CLASSIFICATIONS = new Map([
  [
    "toolchain/index.html",
    {
      classification: "non-ordinary",
      reason: "Complete server-rendered toolchain registry retained for auditability and no-JavaScript access.",
      htmlBudgetBytes: 512 * KILOBYTE,
    },
  ],
]);

const canonicalOrigin = "https://fenrua.ai";

function compare(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function displayPath(file) {
  return relative(root, file).split(sep).join("/");
}

function walkFiles(directory) {
  return readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => compare(left.name, right.name))
    .flatMap((entry) => {
      const file = resolve(directory, entry.name);
      return entry.isDirectory() ? walkFiles(file) : [file];
    });
}

function attributeValue(tag, name) {
  const expression = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>]+))`, "i");
  const match = tag.match(expression);
  return match ? (match[1] ?? match[2] ?? match[3]) : null;
}

function scriptSources(html) {
  return [...html.matchAll(/<script\b[^>]*>/gi)].flatMap((match) => {
    const source = attributeValue(match[0], "src");
    return source === null
      ? []
      : [{ source, module: attributeValue(match[0], "type")?.trim().toLowerCase() === "module" }];
  });
}

function publicPathForOutputFile(file) {
  return `/${displayPath(file).replace(/^public\//, "")}`;
}

function outputFileForScript(basePath, source) {
  const input = source.trim();
  if (!input) {
    return { kind: "opaque", message: "script src is empty" };
  }

  let url;
  try {
    url = new URL(input, `${canonicalOrigin}${basePath}`);
  } catch {
    return { kind: "opaque", message: `script src is not a valid URL: ${source}` };
  }

  if (url.origin !== canonicalOrigin) {
    return { kind: "opaque", message: `third-party or opaque script source: ${source}` };
  }

  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return { kind: "opaque", message: `script src has an undecodable path: ${source}` };
  }

  const file = resolve(outputDirectory, `.${pathname}`);
  if (file !== outputDirectory && !file.startsWith(`${outputDirectory}${sep}`)) {
    return { kind: "opaque", message: `script src escapes the generated output root: ${source}` };
  }
  if (!existsSync(file)) {
    return { kind: "missing", message: `first-party script input is missing from generated output: ${source}` };
  }
  if (!statSync(file).isFile()) {
    return { kind: "opaque", message: `script src does not resolve to a generated file: ${source}` };
  }

  return { kind: "file", file };
}

function moduleImportSources(file) {
  const source = readFileSync(file, "utf8");
  const imports = new Set();
  const staticImportPattern = /\b(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?(["'])([^"']+)\1/g;
  const dynamicImportPattern = /\bimport\s*\(\s*(["'])([^"']+)\1\s*\)/g;
  const dynamicImportCount = [...source.matchAll(/\bimport\s*\(/g)].length;

  for (const match of source.matchAll(staticImportPattern)) imports.add(match[2]);
  for (const match of source.matchAll(dynamicImportPattern)) imports.add(match[2]);

  return {
    imports: [...imports].sort(compare),
    opaqueDynamicImport: dynamicImportCount !== [...source.matchAll(dynamicImportPattern)].length,
  };
}

function isBareModuleSpecifier(source) {
  return !source.startsWith("/") && !source.startsWith("./") && !source.startsWith("../") && !/^[a-z][a-z\d+.-]*:/i.test(source);
}

function bytes(value) {
  return Buffer.byteLength(value);
}

const violations = [];

if (!existsSync(outputDirectory)) {
  violations.push({
    type: "missing-output",
    message: `Generated public output is missing: ${displayPath(outputDirectory)}. Run npm run stage:public-output before this gate.`,
  });
} else if (!statSync(outputDirectory).isDirectory()) {
  violations.push({
    type: "opaque-output",
    message: `Generated public output is not a directory: ${displayPath(outputDirectory)}.`,
  });
}

const routeFiles = violations.length
  ? []
  : walkFiles(outputDirectory)
      .filter((file) => file === resolve(outputDirectory, "index.html") || file.endsWith(`${sep}index.html`))
      .sort((left, right) => compare(displayPath(left), displayPath(right)));

if (!violations.length && routeFiles.length === 0) {
  violations.push({
    type: "missing-routes",
    message: `Generated public output contains no route HTML files: ${displayPath(outputDirectory)}.`,
  });
}

const routeResults = [];
const exceptions = [];
const classifiedRoutes = new Set();

for (const routeFile of routeFiles) {
  const routePath = displayPath(routeFile).replace(/^public\//, "");
  const route = publicRouteFor(routePath);
  const classification = NON_ORDINARY_ROUTE_CLASSIFICATIONS.get(routePath) ?? {
    classification: "ordinary",
    htmlBudgetBytes: ORDINARY_HTML_BUDGET_BYTES,
  };

  if (classification.classification !== "ordinary" && classification.classification !== "non-ordinary") {
    violations.push({
      type: "invalid-classification",
      route,
      message: `Route classification must be ordinary or non-ordinary: ${routePath}.`,
    });
    continue;
  }
  if (!Number.isInteger(classification.htmlBudgetBytes) || classification.htmlBudgetBytes <= 0) {
    violations.push({
      type: "invalid-exception-budget",
      route,
      message: `Route classification must declare a positive HTML budget: ${routePath}.`,
    });
    continue;
  }
  if (classification.classification === "ordinary" && classification.htmlBudgetBytes !== ORDINARY_HTML_BUDGET_BYTES) {
    violations.push({
      type: "unapproved-exception",
      route,
      message: `Only a deliberate non-ordinary classification may exceed the ordinary HTML budget: ${routePath}.`,
    });
    continue;
  }
  if (classification.classification === "non-ordinary") {
    classifiedRoutes.add(routePath);
    if (!classification.reason) {
      violations.push({
        type: "undocumented-exception",
        route,
        message: `Non-ordinary route classification needs a visible reason: ${routePath}.`,
      });
      continue;
    }
  }

  const html = readFileSync(routeFile, "utf8");
  const htmlBytes = bytes(html);
  const scriptFiles = new Map();

  const visitedModules = new Set();
  const addScriptInput = (basePath, source, moduleParent = null) => {
    if (moduleParent && isBareModuleSpecifier(source)) {
      violations.push({
        type: "opaque-script-input",
        route,
        input: source,
        message: `Bare module specifier cannot be budgeted from generated output: ${source}.`,
      });
      return;
    }

    const resolved = outputFileForScript(basePath, source);
    if (resolved.kind !== "file") {
      violations.push({
        type: resolved.kind === "missing" ? "missing-script-input" : "opaque-script-input",
        route,
        input: source,
        message: resolved.message,
      });
      return;
    }
    scriptFiles.set(displayPath(resolved.file), resolved.file);
    if (!moduleParent || visitedModules.has(resolved.file)) return;

    visitedModules.add(resolved.file);
    const dependencies = moduleImportSources(resolved.file);
    if (dependencies.opaqueDynamicImport) {
      violations.push({
        type: "opaque-script-input",
        route,
        input: displayPath(resolved.file),
        message: `Dynamic module import must use a literal local source: ${displayPath(resolved.file)}.`,
      });
    }
    for (const dependency of dependencies.imports) {
      addScriptInput(publicPathForOutputFile(resolved.file), dependency, resolved.file);
    }
  };

  for (const { source, module } of scriptSources(html)) {
    addScriptInput(publicRouteFor(routePath), source, module ? routeFile : null);
  }

  const javascriptBytes = [...scriptFiles.values()].reduce((total, file) => total + statSync(file).size, 0);
  const result = {
    route,
    htmlBytes,
    htmlBudgetBytes: classification.htmlBudgetBytes,
    javascriptBytes,
    javascriptBudgetBytes: ROUTE_JAVASCRIPT_BUDGET_BYTES,
    firstPartyScripts: [...scriptFiles.keys()].sort(compare),
    classification: classification.classification,
  };
  routeResults.push(result);

  if (classification.classification === "non-ordinary") {
    exceptions.push({
      route,
      classification: classification.classification,
      source: "NON_ORDINARY_ROUTE_CLASSIFICATIONS",
      reason: classification.reason,
      htmlBytes,
      htmlBudgetBytes: classification.htmlBudgetBytes,
    });
  }
  if (htmlBytes > classification.htmlBudgetBytes) {
    violations.push({
      type: "html-budget",
      route,
      bytes: htmlBytes,
      budgetBytes: classification.htmlBudgetBytes,
      message: `Generated HTML exceeds its route budget: ${route}.`,
    });
  }
  if (javascriptBytes > ROUTE_JAVASCRIPT_BUDGET_BYTES) {
    violations.push({
      type: "javascript-budget",
      route,
      bytes: javascriptBytes,
      budgetBytes: ROUTE_JAVASCRIPT_BUDGET_BYTES,
      message: `First-party JavaScript exceeds the route budget: ${route}.`,
    });
  }
}

if (routeFiles.length > 0) {
  for (const routePath of NON_ORDINARY_ROUTE_CLASSIFICATIONS.keys()) {
    if (classifiedRoutes.has(routePath)) continue;
    violations.push({
      type: "stale-exception",
      routePath,
      message: `Non-ordinary route classification has no generated route: ${routePath}.`,
    });
  }
}

const result = {
  status: violations.length ? "failed" : "ok",
  scope: "static-performance-budgets",
  outputDirectory: displayPath(outputDirectory),
  budgets: {
    ordinaryHtmlBytes: ORDINARY_HTML_BUDGET_BYTES,
    firstPartyJavaScriptPerRouteBytes: ROUTE_JAVASCRIPT_BUDGET_BYTES,
  },
  routes: routeResults.length,
  ordinaryRoutes: routeResults.filter(({ classification }) => classification === "ordinary").length,
  exceptions,
  largest: routeResults
    .slice()
    .sort((left, right) => right.htmlBytes - left.htmlBytes || compare(left.route, right.route))
    .slice(0, 3)
    .map(({ route, htmlBytes, javascriptBytes }) => ({ route, htmlBytes, javascriptBytes })),
  violations,
};

console.log(JSON.stringify(result));
if (violations.length) process.exitCode = 1;
