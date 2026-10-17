// Kaedah pembayaran resit koperasi.
export const paymentMethods = [
  { value: "BANK_TRANSFER", label: "Pindahan Bank" },
  { value: "CASH", label: "Tunai" },
];

export function paymentLabel(value) {
  return paymentMethods.find((p) => p.value === value)?.label ?? value;
}
