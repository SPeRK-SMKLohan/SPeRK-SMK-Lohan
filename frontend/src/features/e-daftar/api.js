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

// Tanda kehadiran pantas (satu ketukan) semasa hari pendaftaran.
export const setStudentStatus = (id, registrationStatus) =>
  apiFetch(`/api/students/${encodeURIComponent(id)}/status`, studentBody({ registrationStatus }));

// Padam kekal murid (memerlukan kata laluan disahkan sebelum panggilan).
export const deleteStudent = (id) =>
  apiFetch(`/api/students/${encodeURIComponent(id)}`, { method: "DELETE" });

export const importStudents = (rows, dryRun) =>
  apiFetch("/api/students/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dryRun, rows }),
  });
