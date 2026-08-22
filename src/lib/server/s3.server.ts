/**
 * Minimal S3-compatible PUT/GET/DELETE (Filebase, Storj, R2, AWS).
 * Server-only. No AWS SDK — SigV4 over fetch so Vercel stays lean.
 */
import { createHash, createHmac } from "node:crypto";
import type { S3Config } from "@/lib/social-machine";

function sha256Hex(value: Buffer | string): string {
  return createHash("sha256").update(value).digest("hex");
}

function hmac(key: Buffer | string, value: string): Buffer {
  return createHmac("sha256", key).update(value).digest();
}

function amzDate(now = new Date()): { amz: string; date: string } {
  const iso = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return { amz: iso.slice(0, 16), date: iso.slice(0, 8) };
}

function encodePath(key: string): string {
  return key
    .split("/")
    .map((part) => encodeURIComponent(part).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`))
    .join("/");
}

export function objectUrl(config: S3Config, key: string): string {
  const host = new URL(config.endpoint).host;
  const path = `/${config.bucket}/${encodePath(key)}`;
  return `${config.endpoint.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export function canonicalRequest(input: {
  method: string;
  path: string;
  headers: Record<string, string>;
  payloadHash: string;
}): string {
  const names = Object.keys(input.headers)
    .map((name) => name.toLowerCase())
    .sort();
  const canonicalHeaders = names
    .map((name) => {
      const original = Object.keys(input.headers).find((key) => key.toLowerCase() === name) ?? name;
      return `${name}:${input.headers[original].trim().replace(/\s+/g, " ")}`;
    })
    .join("\n");
  return [
    input.method,
    input.path,
    "",
    `${canonicalHeaders}\n`,
    names.join(";"),
    input.payloadHash,
  ].join("\n");
}

function signingKey(secret: string, date: string, region: string): Buffer {
  const kDate = hmac(`AWS4${secret}`, date);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, "s3");
  return hmac(kService, "aws4_request");
}

async function signedFetch(
  config: S3Config,
  method: "PUT" | "GET" | "DELETE",
  key: string,
  body?: Buffer,
): Promise<Response> {
  const url = new URL(objectUrl(config, key));
  const payloadHash = sha256Hex(body ?? "");
  const { amz, date } = amzDate();
  const headers: Record<string, string> = {
    host: url.host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amz,
  };
  const path = url.pathname;
  const canonical = canonicalRequest({ method, path, headers, payloadHash });
  const scope = `${date}/${config.region}/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amz, scope, sha256Hex(canonical)].join("\n");
  const signature = createHmac("sha256", signingKey(config.secret, date, config.region))
    .update(stringToSign)
    .digest("hex");
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const authorization = `AWS4-HMAC-SHA256 Credential=${config.accessKey}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  return fetch(url.toString(), {
    method,
    headers: {
      Authorization: authorization,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amz,
      ...(body ? { "content-type": "application/octet-stream" } : {}),
    },
    body: body ? new Uint8Array(body) : undefined,
  });
}

export async function s3Put(config: S3Config, key: string, bytes: Buffer): Promise<void> {
  const response = await signedFetch(config, "PUT", key, bytes);
  if (!response.ok) {
    throw new Error(`S3_PUT_${response.status}`);
  }
}

export async function s3Get(config: S3Config, key: string): Promise<Buffer | null> {
  const response = await signedFetch(config, "GET", key);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`S3_GET_${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

export async function s3Delete(config: S3Config, key: string): Promise<void> {
  const response = await signedFetch(config, "DELETE", key);
  if (response.status === 404 || response.ok) return;
  throw new Error(`S3_DELETE_${response.status}`);
}
