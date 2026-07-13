import { createServer } from "node:http";
import { readFileSync, statSync } from "node:fs";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const port = Number.parseInt(process.env.PORT || "4173", 10);
const vercel = JSON.parse(readFileSync(resolve(root, "vercel.json"), "utf8"));
const csp = vercel.headers
  .find((entry) => entry.source === "/(.*)")
  ?.headers.find((header) => header.key === "Content-Security-Policy")?.value;

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

function localPath(pathname) {
  const decoded = decodeURIComponent(pathname);
  if (decoded.includes("\0") || decoded.split("/").includes("..")) return null;
  if (decoded.startsWith("/api/")) return null;

  const normalized = decoded === "/" ? "/index.html" : decoded;
  const filePath = extname(normalized) ? normalized : `${normalized.replace(/\/$/, "")}/index.html`;
  const candidate = resolve(root, `.${filePath}`);
  return candidate === root || candidate.startsWith(`${root}${sep}`) ? candidate : null;
}

const server = createServer((request, response) => {
  if (!request.url || !["GET", "HEAD"].includes(request.method || "")) {
    response.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }

  let pathname;
  try {
    pathname = new URL(request.url, "http://127.0.0.1").pathname;
  } catch {
    response.writeHead(400).end();
    return;
  }

  if (pathname === "/__fenrua_browser_test_health") {
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    response.end('{"server":"fenrua-browser-test"}\n');
    return;
  }

  let file;
  try {
    file = localPath(pathname);
  } catch {
    response.writeHead(400).end();
    return;
  }
  if (!file) {
    response.writeHead(404).end();
    return;
  }

  try {
    if (!statSync(file).isFile()) throw new Error("not a file");
    const headers = {
      "Content-Type": mimeTypes[extname(file)] || "application/octet-stream",
      "Cache-Control": "no-store",
      ...(csp ? { "Content-Security-Policy": csp } : {}),
    };
    response.writeHead(200, headers);
    if (request.method === "HEAD") response.end();
    else response.end(readFileSync(file));
  } catch {
    response.writeHead(404).end();
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Browser static test server listening on http://127.0.0.1:${port}`);
});
