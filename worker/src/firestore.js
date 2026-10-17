import { SignJWT, importPKCS8 } from "jose";
import { HttpError } from "./util.js";

let cachedAccount = null; // { raw, value }
let cachedKey = null;
let cachedToken = null; // { value, expiresAt }

function getServiceAccount(env) {
  const raw = env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new HttpError(500, "Pelayan belum dikonfigurasi.");
  if (cachedAccount?.raw !== raw) {
    cachedAccount = { raw, value: JSON.parse(raw) };
    cachedKey = null;
    cachedToken = null;
  }
  return cachedAccount.value;
}

async function getAccessToken(env) {
  const sa = getServiceAccount(env);
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt - 60 > now) return cachedToken.value;

  cachedKey ??= await importPKCS8(sa.private_key, "RS256");
  const assertion = await new SignJWT({ scope: "https://www.googleapis.com/auth/datastore" })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(sa.client_email)
    .setSubject(sa.client_email)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(cachedKey);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Token Google gagal: ${data.error_description || data.error || res.status}`);

  cachedToken = { value: data.access_token, expiresAt: now + (data.expires_in || 3600) };
  return cachedToken.value;
}

/* ---------- Penukaran nilai JS <-> Firestore ---------- */
export function toValue(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "string") return { stringValue: v };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toValue) } };
  return { mapValue: { fields: toFields(v) } };
}

export function toFields(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) fields[k] = toValue(v);
  }
  return fields;
}

function fromValue(v) {
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("timestampValue" in v) return new Date(v.timestampValue).toISOString();
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(fromValue);
  if ("mapValue" in v) return fromFields(v.mapValue.fields || {});
  return null;
}

function fromFields(fields) {
  const out = {};
  for (const [k, v] of Object.entries(fields)) out[k] = fromValue(v);
  return out;
}

function fromDoc(doc) {
  return { id: doc.name.split("/").pop(), ...fromFields(doc.fields || {}) };
}

/* ---------- Permintaan Firestore ---------- */
async function fsRequest(env, path, { method = "POST", body, query } = {}) {
  const sa = getServiceAccount(env);
  const token = await getAccessToken(env);
  const url =
    `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents${path}` +
    (query ? `?${query}` : "");

  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(`Firestore: ${data.error?.message || res.status}`);
    err.httpStatus = res.status;
    err.code = data.error?.status;
    throw err;
  }
  return data;
}

function docPath(env, collection, id) {
  const sa = getServiceAccount(env);
  return `projects/${sa.project_id}/databases/(default)/documents/${collection}/${id}`;
}

export async function getDoc(env, collection, id, transaction) {
  try {
    const doc = await fsRequest(env, `/${collection}/${id}`, {
      method: "GET",
      query: transaction ? `transaction=${encodeURIComponent(transaction)}` : "",
    });
    return fromDoc(doc);
  } catch (err) {
    if (err.httpStatus === 404) return null;
    throw err;
  }
}

export async function runQuery(env, structuredQuery) {
  const results = await fsRequest(env, ":runQuery", { body: { structuredQuery } });
  return results.filter((r) => r.document).map((r) => fromDoc(r.document));
}

// refs: [{ collection, id }] -> Map("collection/id" -> dokumen)
export async function batchGet(env, refs) {
  const documents = refs.map((r) => docPath(env, r.collection, r.id));
  const results = await fsRequest(env, ":batchGet", { body: { documents } });
  const map = new Map();
  for (const r of results) {
    if (r.found) map.set(r.found.name.split("/documents/")[1], fromDoc(r.found));
  }
  return map;
}

export async function beginTransaction(env) {
  const data = await fsRequest(env, ":beginTransaction", { body: { options: { readWrite: {} } } });
  return data.transaction;
}

// writes: [{ collection, id, data, mustNotExist }]
export async function commit(env, writes, transaction) {
  const body = {
    writes: writes.map((w) =>
      w.delete
        ? { delete: docPath(env, w.collection, w.id) }
        : {
            update: { name: docPath(env, w.collection, w.id), fields: toFields(w.data) },
            ...(w.mustNotExist ? { currentDocument: { exists: false } } : {}),
          }
    ),
  };
  if (transaction) body.transaction = transaction;
  return fsRequest(env, ":commit", { body });
}