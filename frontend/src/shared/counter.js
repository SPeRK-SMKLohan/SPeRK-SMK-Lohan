const COUNTER_STORAGE_KEY = "sperk-device-counter-number";
export const COUNTER_NUMBERS = Array.from({ length: 24 }, (_, index) => index + 1);

export function getDeviceCounterNumber() {
  try {
    const value = Number(localStorage.getItem(COUNTER_STORAGE_KEY));
    return Number.isInteger(value) && COUNTER_NUMBERS.includes(value) ? value : null;
  } catch { return null; }
}

export function setDeviceCounterNumber(value) {
  const counterNumber = Number(value);
  if (!Number.isInteger(counterNumber) || !COUNTER_NUMBERS.includes(counterNumber)) return false;
  try {
    localStorage.setItem(COUNTER_STORAGE_KEY, String(counterNumber));
    return true;
  } catch { return false; }
}

export function counterNumberOptions(selected = null) {
  return COUNTER_NUMBERS.map((number) =>
    `<option value="${number}"${number === selected ? " selected" : ""}>Kaunter ${number}</option>`
  ).join("");
}
