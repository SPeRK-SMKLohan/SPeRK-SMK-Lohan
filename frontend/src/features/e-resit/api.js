import { apiFetch } from "../../shared/api.js";

/* Panggilan API e-Resit Koperasi (barangan dan resit). */

export const getItems = () => apiFetch("/api/items");

export const createReceipt = (payload) =>
  apiFetch("/api/receipts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const listReceipts = (params) => apiFetch(`/api/receipts?${new URLSearchParams(params)}`);

export const getReceipt = (id) => apiFetch(`/api/receipts/${encodeURIComponent(id)}`);
