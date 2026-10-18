export function formatRM(sen) {
  return `RM${(sen / 100).toFixed(2)}`;
}

// Nilai tanpa "RM", untuk lajur resit yang sudah berlabel "(RM)" pada kepala.
export function formatAmount(sen) {
  return (sen / 100).toFixed(2);
}

function lineTotal(quantity, unitPriceSen) {
  return quantity * unitPriceSen;
}

export function grandTotal(lines) {
  return lines.reduce((sum, l) => sum + lineTotal(l.quantity, l.unitPriceSen), 0);
}