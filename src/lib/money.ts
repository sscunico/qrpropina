export const DEFAULT_AMOUNTS = [500, 1000, 1500, 2000];

export function pesosToCents(value: number) {
  return Math.round(value * 100);
}

export function centsToPesos(value: number) {
  return value / 100;
}

export function calculateFeeCents(amountCents: number, commissionPercent: number) {
  return Math.round(amountCents * (commissionPercent / 100));
}

// Calcula el monto bruto a cobrar al pagador para que el creador reciba exactamente targetAmountCents
// después de descontar la comisión de plataforma.
export function calculateGrossUp(targetAmountCents: number, feePercent: number): number {
  if (feePercent <= 0) return targetAmountCents;
  return Math.round(targetAmountCents / (1 - feePercent / 100));
}

export function formatMoney(cents: number, currency = "ARS") {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(centsToPesos(cents));
}
