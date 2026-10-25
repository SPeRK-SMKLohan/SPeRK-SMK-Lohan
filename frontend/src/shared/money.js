export function formatRM(sen) {
  return `RM${(sen / 100).toFixed(2)}`;
}

// Nilai tanpa "RM", untuk lajur resit yang sudah berlabel "(RM)" pada kepala.
export function formatAmount(sen) {
  return (sen / 100).toFixed(2);
}

export function grandTotal(lines) {
  return lines.reduce((sum, line) => sum + line.quantity * line.unitPriceSen, 0);
}
