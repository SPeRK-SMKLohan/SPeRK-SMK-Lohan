import { apiFetch } from "../../shared/api.js";

/* Panggilan API e-Daftar. Senarai murid ini juga digunakan oleh e-Resit
   Koperasi kerana kedua-dua ciri berkongsi satu pangkalan data murid. */

export const searchStudents = (q, { school = "", tingkatan = "", status = "", limit = 50 } = {}) =>
  apiFetch(`/api/students?${new URLSearchParams({ q, school, tingkatan, status, limit })}`);

export const getStudent = (id) => apiFetch(`/api/students/${encodeURIComponent(id)}`);

const studentBody = (payload) => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

export const createStudent = (payload) => apiFetch("/api/students", studentBody(payload));

export const updateStudent = (id, payload) =>
  apiFetch(`/api/students/${encodeURIComponent(id)}`, { ...studentBody(payload), method: "PUT" });

export const importStudents = (rows, dryRun) =>
  apiFetch("/api/students/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dryRun, rows }),
  });
