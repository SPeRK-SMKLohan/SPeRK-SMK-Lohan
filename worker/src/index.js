import { createRemoteJWKSet, jwtVerify } from "jose";

// Kunci awam Google untuk mengesahkan token Firebase.
const JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

function splitList(value) {
  return (value || "").split(",").map((s) => s.trim()).filter(Boolean);
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin");
  const headers = { Vary: "Origin" };
  if (origin && splitList(env.ALLOWED_ORIGINS).includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type";
    headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
    headers["Access-Control-Max-Age"] = "86400";
  }
  return headers;
}

// Mengembalikan { ok: true, user } atau { ok: false, status, error }.
async function authenticate(request, env) {
  if (!env.FIREBASE_PROJECT_ID) {
    return { ok: false, status: 500, error: "Pelayan belum dikonfigurasi." };
  }

  const match = (request.headers.get("Authorization") || "").match(/^Bearer (.+)$/);
  if (!match) return { ok: false, status: 401, error: "Sila log masuk." };

  let payload;
  try {
    ({ payload } = await jwtVerify(match[1], JWKS, {
      issuer: `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`,
      audience: env.FIREBASE_PROJECT_ID,
      algorithms: ["RS256"],
    }));
  } catch {
    return { ok: false, status: 401, error: "Sesi tidak sah atau tamat. Sila log masuk semula." };
  }

  // Senarai e-mel yang dibenarkan. Jika kosong, semua ditolak.
  const allowed = splitList(env.ALLOWED_EMAILS).map((e) => e.toLowerCase());
  const email = String(payload.email || "").toLowerCase();
  if (!payload.sub || !email || !allowed.includes(email)) {
    return { ok: false, status: 403, error: "Akaun tidak dibenarkan." };
  }

  return { ok: true, user: payload };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);
    const json = (body, status = 200) => Response.json(body, { status, headers: cors });

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    // Awam: tidak memerlukan log masuk.
    if (url.pathname === "/api/health" && request.method === "GET") {
      return json({ status: "ok", time: new Date().toISOString() });
    }

    // Semua laluan /api/ lain dilindungi secara lalai.
    if (url.pathname.startsWith("/api/")) {
      const auth = await authenticate(request, env);
      if (!auth.ok) return json({ error: auth.error }, auth.status);

      if (url.pathname === "/api/me" && request.method === "GET") {
        return json({ uid: auth.user.sub, email: auth.user.email });
      }
    }

    return json({ error: "Not found" }, 404);
  },
};