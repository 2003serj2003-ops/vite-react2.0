/**
 * Генератор TypeScript файлов:
 *  - src/integrations/uzum/generated/endpoints.ts  (все endpoints + краткое описание)
 *  - src/integrations/uzum/generated/schemas.ts    (components.schemas как const)
 *
 * Usage:
 *   OPENAPI_URL="https://api-seller.uzum.uz/api/seller-openapi/swagger/api-docs" node scripts/generate-uzum-ts.mjs
 *
 * Node 18+ required.
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const OPENAPI_URL = process.env.OPENAPI_URL;
if (!OPENAPI_URL) {
  console.error("ERROR: Укажи OPENAPI_URL");
  process.exit(1);
}

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "src", "integrations", "uzum", "generated");
const OUT_ENDPOINTS = path.join(OUT_DIR, "endpoints.ts");
const OUT_SCHEMAS = path.join(OUT_DIR, "schemas.ts");

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function clean(s) { return (s ?? "").toString().trim(); }

function resolveRef(doc, ref) {
  if (!ref || typeof ref !== "string") return null;
  if (!ref.startsWith("#/")) return null;
  const parts = ref.slice(2).split("/").map(decodeURIComponent);
  let cur = doc;
  for (const p of parts) {
    if (cur && Object.prototype.hasOwnProperty.call(cur, p)) cur = cur[p];
    else return null;
  }
  return cur;
}

function deref(doc, obj, depth = 0) {
  if (!obj || typeof obj !== "object") return obj;
  if (depth > 20) return obj;
  if (obj.$ref) return deref(doc, resolveRef(doc, obj.$ref) || obj, depth + 1);
  return obj;
}

function extractSchemaRefOrInline(doc, schema) {
  if (!schema) return null;
  if (schema.$ref) return { ref: schema.$ref };
  const s = deref(doc, schema);
  // Упрощенно: пытаемся определить "shape"
  if (s.type) return { inlineType: s.type };
  if (s.oneOf) return { inlineType: "oneOf" };
  if (s.anyOf) return { inlineType: "anyOf" };
  if (s.allOf) return { inlineType: "allOf" };
  if (s.properties) return { inlineType: "object" };
  return { inlineType: "unknown" };
}

function collectEndpoints(doc) {
  const paths = doc.paths || {};
  const out = [];
  for (const [p, methods] of Object.entries(paths)) {
    const pathLevelParams = Array.isArray(methods.parameters) ? methods.parameters : [];
    for (const [m, op0] of Object.entries(methods)) {
      const method = m.toUpperCase();
      if (!["GET","POST","PUT","PATCH","DELETE","HEAD","OPTIONS"].includes(method)) continue;

      const op = deref(doc, op0);
      const tags = (op.tags?.length ? op.tags : ["(no-tag)"]).map(String);
      const operationId = clean(op.operationId);
      const summary = clean(op.summary);
      const description = clean(op.description);
      const deprecated = !!op.deprecated;

      const params = [...pathLevelParams, ...(Array.isArray(op.parameters) ? op.parameters : [])].map(x => deref(doc, x)).filter(Boolean).map(p => ({
        name: p.name,
        in: p.in,
        required: !!p.required,
        description: clean(p.description || p.schema?.description),
        schema: extractSchemaRefOrInline(doc, p.schema),
      }));

      let requestBody = null;
      if (op.requestBody) {
        const rb = deref(doc, op.requestBody);
        const content = rb?.content || {};
        requestBody = {
          required: !!rb?.required,
          description: clean(rb?.description),
          content: Object.fromEntries(
            Object.entries(content).map(([ct, v]) => [ct, extractSchemaRefOrInline(doc, v?.schema)])
          ),
        };
      }

      const responses = {};
      if (op.responses) {
        for (const [code, r0] of Object.entries(op.responses)) {
          const r = deref(doc, r0);
          const content = r?.content || {};
          responses[code] = {
            description: clean(r?.description),
            content: Object.fromEntries(
              Object.entries(content).map(([ct, v]) => [ct, extractSchemaRefOrInline(doc, v?.schema)])
            ),
          };
        }
      }

      out.push({
        tag: tags[0],
        tags,
        method,
        path: p,
        operationId: operationId || null,
        summary: summary || null,
        description: description || null,
        deprecated,
        parameters: params,
        requestBody,
        responses,
      });
    }
  }
  out.sort((a, b) => (a.tag + a.path + a.method).localeCompare(b.tag + b.path + b.method));
  return out;
}

function tsStringLiteral(s) {
  return JSON.stringify(s);
}

function renderEndpointsTS(doc, endpoints) {
  const header = `/* AUTO-GENERATED. DO NOT EDIT.
 * Source: ${OPENAPI_URL}
 */\n\n`;

  const body = [
    header,
    `export const UZUM_BASE_URL = ${tsStringLiteral((doc.servers?.[0]?.url) || "https://api-seller.uzum.uz/api/seller-openapi/") } as const;\n`,
    `export type UzumHttpMethod = "GET"|"POST"|"PUT"|"PATCH"|"DELETE"|"HEAD"|"OPTIONS";\n`,
    `export type UzumParamIn = "path"|"query"|"header"|"cookie";\n`,
    `export type UzumSchemaRef = { ref: string } | { inlineType: string } | null;\n`,
    `export type UzumEndpoint = {\n`,
    `  tag: string;\n`,
    `  tags: string[];\n`,
    `  method: UzumHttpMethod;\n`,
    `  path: string;\n`,
    `  operationId: string | null;\n`,
    `  summary: string | null;\n`,
    `  description: string | null;\n`,
    `  deprecated: boolean;\n`,
    `  parameters: Array<{ name: string; in: UzumParamIn; required: boolean; description: string; schema: UzumSchemaRef }>;\n`,
    `  requestBody: null | { required: boolean; description: string; content: Record<string, UzumSchemaRef> };\n`,
    `  responses: Record<string, { description: string; content: Record<string, UzumSchemaRef> }>;\n`,
    `};\n\n`,
    `export const UZUM_ENDPOINTS: UzumEndpoint[] = ${JSON.stringify(endpoints, null, 2)} as const;\n\n`,
    `export const UZUM_ENDPOINTS_BY_TAG = UZUM_ENDPOINTS.reduce((acc, e) => {\n`,
    `  (acc[e.tag] ||= []).push(e);\n`,
    `  return acc;\n`,
    `}, {} as Record<string, UzumEndpoint[]>);\n`,
  ].join("");

  return body;
}

function renderSchemasTS(doc) {
  const header = `/* AUTO-GENERATED. DO NOT EDIT.
 * Source: ${OPENAPI_URL}
 */\n\n`;
  const schemas = doc?.components?.schemas || {};
  // Чтобы не раздувать типизацию, кладем как const unknown.
  return header +
    `export const UZUM_SCHEMAS = ${JSON.stringify(schemas, null, 2)} as const;\n` +
    `export type UzumSchemaName = keyof typeof UZUM_SCHEMAS;\n`;
}

async function main() {
  const res = await fetch(OPENAPI_URL, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`OpenAPI download failed: ${res.status} ${res.statusText}`);
  const doc = await res.json();

  const endpoints = collectEndpoints(doc);

  ensureDir(OUT_DIR);
  fs.writeFileSync(OUT_ENDPOINTS, renderEndpointsTS(doc, endpoints), "utf8");
  fs.writeFileSync(OUT_SCHEMAS, renderSchemasTS(doc), "utf8");

  console.log("OK:");
  console.log(" -", OUT_ENDPOINTS);
  console.log(" -", OUT_SCHEMAS);
  console.log("Endpoints:", endpoints.length);
  console.log("Schemas:", Object.keys(doc?.components?.schemas || {}).length);
}

main().catch((e) => {
  console.error("ERROR:", e?.message || e);
  process.exit(1);
});
