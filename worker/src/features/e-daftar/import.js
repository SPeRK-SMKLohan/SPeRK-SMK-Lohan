import { commit, runQuery } from "../../firestore.js";
import { clearStudentsCache } from "../../shared/students.js";
import { HttpError } from "../../util.js";
import { readStudentFields } from "./students.js";

/* ---------- e-Daftar: import murid daripada fail Excel ---------- */
const MAX_IMPORT_ROWS = 2000;
const COMMIT_CHUNK = 400; // had Firestore: 500 penulisan setiap commit

// Pengesahan satu baris import (medan penuh e-Daftar; medan baharu pilihan).
function checkStudentRow(r) {
  return readStudentFields({
    name: r.name,
    icNumber: r.icNumber,
    school: r.school,
    tingkatan: r.tingkatan,
    oku: r.oku,
    registrationStatus: r.registrationStatus,
    transferSchool: r.transferSchool,
    transferReason: r.transferReason,
    transferNotes: r.transferNotes,
  });
}

async function classifyStudentRows(env, rows) {
  // Semua murid (termasuk tidak aktif), hanya medan IC, untuk mengesan pendua.
  const existingDocs = await runQuery(env, {
    from: [{ collectionId: "students" }],
    select: { fields: [{ fieldPath: "icNumber" }] },
  });
  const existingIC = new Set(existingDocs.map((d) => String(d.icNumber ?? "").replace(/\D/g, "")));

  const seen = new Map(); // digit IC -> nombor baris pertama
  const valid = [];
  const problems = [];
  const counts = { invalid: 0, duplicateInFile: 0, duplicateExisting: 0 };

  for (const r of rows) {
    const res = checkStudentRow(r);
    if (res.reason) {
      counts.invalid++;
      problems.push({ row: r.row, status: "invalid", reason: res.reason });
      continue;
    }
    if (seen.has(res.digits)) {
      counts.duplicateInFile++;
      problems.push({
        row: r.row,
        status: "duplicate_in_file",
        reason: `No. IC sama dengan baris ${seen.get(res.digits)}.`,
      });
      continue;
    }
    seen.set(res.digits, r.row);
    if (existingIC.has(res.digits)) {
      counts.duplicateExisting++;
      problems.push({ row: r.row, status: "duplicate_existing", reason: "Murid dengan IC ini sudah wujud." });
      continue;
    }
    valid.push(res.student);
  }
  return { valid, problems, counts };
}

export async function importStudents(env, user, request) {
  const text = await request.text();
  if (text.length > 1_000_000) throw new HttpError(413, "Permintaan terlalu besar.");
  let body;
  try { body = JSON.parse(text); } catch { throw new HttpError(400, "Permintaan tidak sah."); }
  if (!body || typeof body.dryRun !== "boolean" || !Array.isArray(body.rows)) {
    throw new HttpError(400, "Permintaan tidak sah.");
  }
  if (body.rows.length === 0) throw new HttpError(400, "Tiada data untuk diimport.");
  if (body.rows.length > MAX_IMPORT_ROWS) {
    throw new HttpError(400, `Maksimum ${MAX_IMPORT_ROWS} baris setiap import.`);
  }

  const rows = body.rows.map((r, i) => ({
    row: Number.isInteger(r?.row) ? r.row : i + 2,
    name: r?.name,
    icNumber: typeof r?.icNumber === "number" ? String(r.icNumber) : r?.icNumber,
    school: r?.school,
    tingkatan: r?.tingkatan,
    oku: r?.oku,
    registrationStatus: r?.registrationStatus,
    transferSchool: r?.transferSchool,
    transferReason: r?.transferReason,
    transferNotes: r?.transferNotes,
  }));

  // Pelayan mengesahkan semula setiap baris, walaupun sudah dipratonton.
  const { valid, problems, counts } = await classifyStudentRows(env, rows);
  const summary = { total: rows.length, valid: valid.length, ...counts };
  const shownProblems = problems.slice(0, 200);

  if (body.dryRun || valid.length === 0) {
    return { dryRun: body.dryRun, summary, problems: shownProblems, imported: 0 };
  }

  const now = new Date();
  const writes = valid.map((s) => ({
    collection: "students",
    id: crypto.randomUUID(), // ID rawak: nombor IC tidak muncul dalam ID atau URL
    data: {
      ...s, // medan e-Daftar yang telah dibersihkan dan disahkan
      active: true,
      createdAt: now,
      updatedAt: now,
    },
  }));

  let imported = 0;
  try {
    for (let i = 0; i < writes.length; i += COMMIT_CHUNK) {
      const chunk = writes.slice(i, i + COMMIT_CHUNK);
      await commit(env, chunk);
      imported += chunk.length;
    }
  } catch (err) {
    console.error(err);
    clearStudentsCache();
    throw new HttpError(
      500,
      imported
        ? `Import terhenti selepas ${imported} murid. Import fail yang sama semula; murid yang sudah masuk akan dikesan sebagai pendua.`
        : "Import gagal. Tiada rekod disimpan. Sila cuba lagi."
    );
  }

  clearStudentsCache();

  // Rekod ringkas import (tidak menghentikan import jika gagal).
  try {
    await commit(env, [{
      collection: "imports",
      id: crypto.randomUUID(),
      data: { createdAt: now, createdByAccountId: user.sub, imported, skipped: problems.length },
    }]);
  } catch (err) {
    console.error("Rekod import gagal disimpan", err);
  }

  return { dryRun: false, summary, problems: shownProblems, imported };
}
