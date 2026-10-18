import { createRemoteJWKSet, jwtVerify } from "jose";
import { getDashboard } from "./dashboard.js";
import { importStudents } from "./features/e-daftar/import.js";
import {
  createStudent, deleteStudent, deleteStudents, getStudent, listStudents,
  setRegistrationStatus, updateStudent,
} from "./features/e-daftar/students.js";
import { listItems } from "./features/e-resit/items.js";
import { createReceipt, getReceipt, listReceipts } from "./features/e-resit/receipts.js";
import { prefetchAccessToken } from "./firestore.js";
import { HttpError, readJson } from "./util.js";

/* SPeRK (Sistem Pengurusan Pelajar dan Resit Koperasi) SMK Lohan.
   Dua ciri berkongsi satu pangkalan data Firestore:
   - e-Daftar         : senarai murid (/api/students)
   - e-Resit Koperasi : barangan dan resit (/api/items, /api/receipts)
   Papan pemuka (/api/dashboard) menggabungkan statistik kedua-duanya. */

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
    headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS";
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
    const json = (body, status = 200) =>
      Response.json(body, { status, headers: { ...cors, "Cache-Control": "no-store" } });

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    // Awam: tidak memerlukan log masuk.
    if (url.pathname === "/api/health" && request.method === "GET") {
      return json({ status: "ok", time: new Date().toISOString() });
    }

    // Semua laluan /api/ lain dilindungi secara lalai.
    if (url.pathname.startsWith("/api/")) {
      // Ambil token Google lebih awal (selari dengan pengesahan token pengguna).
      prefetchAccessToken(env);

      const auth = await authenticate(request, env);
      if (!auth.ok) return json({ error: auth.error }, auth.status);

      const { pathname } = url;
      const method = request.method;

      try {
        /* ---------- Kongsi (kedua-dua ciri) ---------- */
        if (pathname === "/api/me" && method === "GET") {
          return json({ uid: auth.user.sub, email: auth.user.email });
        }
        if (pathname === "/api/dashboard" && method === "GET") {
          return json(await getDashboard(env));
        }

        /* ---------- e-Daftar (pangkalan data murid) ---------- */
        if (pathname === "/api/students/import" && method === "POST") {
          return json(await importStudents(env, auth.user, request));
        }
        if (pathname === "/api/students" && method === "GET") {
          return json(await listStudents(env, url));
        }
        if (pathname === "/api/students" && method === "POST") {
          return json(await createStudent(env, auth.user, request), 201);
        }
        const student = pathname.match(/^\/api\/students\/([^/]+)$/);
        if (student && method === "GET") {
          return json(await getStudent(env, decodeURIComponent(student[1])));
        }
        if (student && method === "PUT") {
          return json(await updateStudent(env, auth.user, decodeURIComponent(student[1]), request));
        }
        if (student && method === "DELETE") {
          return json(await deleteStudent(env, auth.user, decodeURIComponent(student[1])));
        }
        if (pathname === "/api/students/bulk" && method === "DELETE") {
          const body = await readJson(request);
          if (!body || !Array.isArray(body.ids)) {
            throw new HttpError(400, "Sila pilih sekurang-kurangnya satu murid.");
          }
          return json(await deleteStudents(env, auth.user, body.ids));
        }
        // Tanda kehadiran pantas semasa hari pendaftaran (satu ketukan).
        const studentStatus = pathname.match(/^\/api\/students\/([^/]+)\/status$/);
        if (studentStatus && method === "POST") {
          return json(
            await setRegistrationStatus(env, auth.user, decodeURIComponent(studentStatus[1]), request)
          );
        }

        /* ---------- e-Resit Koperasi ---------- */
        if (pathname === "/api/items" && method === "GET") {
          return json(await listItems(env));
        }
        if (pathname === "/api/receipts" && method === "GET") {
          return json(await listReceipts(env, url));
        }
        if (pathname === "/api/receipts" && method === "POST") {
          const { receipt, duplicate } = await createReceipt(env, auth.user, request);
          return json({ receipt, duplicate }, duplicate ? 200 : 201);
        }
        const one = pathname.match(/^\/api\/receipts\/([^/]+)$/);
        if (one && method === "GET") {
          return json(await getReceipt(env, decodeURIComponent(one[1])));
        }
      } catch (err) {
        if (err instanceof HttpError) return json({ error: err.message }, err.status);
        console.error(err);
        return json({ error: "Ralat pelayan. Sila cuba lagi." }, 500);
      }
    }

    return json({ error: "Not found" }, 404);
  },
};