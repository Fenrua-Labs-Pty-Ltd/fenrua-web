import { createHash } from "node:crypto";

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

// The manifest only uses JSON primitives. Sorting object keys gives a stable
// UTF-8 representation for integrity checks without claiming a signature or
// runtime attestation.
export function canonicalJson(value) {
  if (value === null || typeof value === "boolean" || typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("Release manifest cannot contain a non-finite number.");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  if (typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  throw new TypeError(`Unsupported release manifest value: ${typeof value}`);
}

export function verifyReleaseManifest(manifest) {
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) throw new TypeError("Manifest must be an object.");
  if (!manifest.record || !manifest.integrity) throw new TypeError("Manifest must contain record and integrity objects.");
  if (manifest.record.schema !== "fenrua.web.release-evidence.v1") throw new TypeError("Unsupported release manifest schema.");
  if (manifest.integrity.algorithm !== "sha256") throw new TypeError("Unsupported release manifest integrity algorithm.");
  const expected = sha256(canonicalJson(manifest.record));
  if (manifest.integrity.recordSha256 !== expected) throw new TypeError("Release manifest record hash does not match.");
  return expected;
}
