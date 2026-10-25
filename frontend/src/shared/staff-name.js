const STAFF_NAME_STORAGE_KEY = "sperk-device-staff-name";

export function normalizeStaffName(value) {
  return String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().toUpperCase();
}

export function getDeviceStaffName() {
  try { return normalizeStaffName(localStorage.getItem(STAFF_NAME_STORAGE_KEY)); }
  catch { return ""; }
}

export function setDeviceStaffName(value) {
  const name = normalizeStaffName(value);
  if (name.length < 2 || name.length > 80) return false;
  try {
    localStorage.setItem(STAFF_NAME_STORAGE_KEY, name);
    return true;
  } catch { return false; }
}
