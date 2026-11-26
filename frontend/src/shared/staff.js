/* The name typed at sign-in, remembered per device and reused across screens. */

const KEY = "sperk-device-staff-name";

export function staffName() {
  try {
    return localStorage.getItem(KEY) || "";
  } catch {
    return "";
  }
}
