import { apiFetch } from "./api.js";

export const getDashboard = () => apiFetch("/api/dashboard");

export const searchStudents = (q, { school = "", limit = 50 } = {}) =>
  apiFetch(`/api/students?${new URLSearchParams({ q, school, limit })}`);

export const getItems = () => apiFetch("/api/items");

export const createReceipt = (payload) =>
  apiFetch("/api/receipts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const listReceipts = (params) => apiFetch(`/api/receipts?${new URLSearchParams(params)}`);

export const getReceipt = (id) => apiFetch(`/api/receipts/${encodeURIComponent(id)}`);

export const importStudents = (rows, dryRun) =>
  apiFetch("/api/students/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dryRun, rows }),
  });