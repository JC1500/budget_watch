const inr = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCroreExact(amount: number) {
  const sign = amount < 0 ? "−" : "";
  return `${sign}₹${inr.format(Math.abs(amount))} Cr`;
}

export function formatCroreCompact(amount: number) {
  const sign = amount < 0 ? "−" : "";
  const absoluteAmount = Math.abs(amount);
  if (absoluteAmount >= 100_000) {
    return `${sign}₹${(absoluteAmount / 100_000).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}L Cr`;
  }

  return `${sign}₹${absoluteAmount.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })} Cr`;
}

export function calculateYoY(current: number, previous?: number | null) {
  if (
    previous == null ||
    previous === 0 ||
    !Number.isFinite(current) ||
    !Number.isFinite(previous)
  ) {
    return null;
  }
  return ((current - previous) / previous) * 100;
}

export function calculateAbsoluteChange(
  current: number,
  previous?: number | null,
) {
  if (previous == null || !Number.isFinite(current) || !Number.isFinite(previous)) {
    return null;
  }
  return current - previous;
}

export function calculateShare(amount: number, total: number) {
  if (!Number.isFinite(amount) || !Number.isFinite(total) || total <= 0) {
    return null;
  }
  return (amount / total) * 100;
}

export function calculateRank(amount: number, amounts: number[]) {
  if (!Number.isFinite(amount)) return null;
  return 1 + amounts.filter((candidate) => candidate > amount).length;
}

export function calculateMedian(values: number[]) {
  const validValues = values.filter(Number.isFinite);
  if (validValues.length === 0) return null;
  const sorted = [...validValues].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

export function calculateCAGR(
  beginning: number,
  ending: number,
  periods: number,
) {
  if (
    beginning <= 0 ||
    ending < 0 ||
    periods <= 0 ||
    !Number.isFinite(beginning) ||
    !Number.isFinite(ending) ||
    !Number.isFinite(periods)
  ) {
    return null;
  }
  return ((ending / beginning) ** (1 / periods) - 1) * 100;
}

export function calculateVolatility(yearlyChanges: number[]) {
  if (
    yearlyChanges.length < 2 ||
    yearlyChanges.some((change) => !Number.isFinite(change))
  ) {
    return null;
  }
  const mean =
    yearlyChanges.reduce((sum, change) => sum + change, 0) /
    yearlyChanges.length;
  const variance =
    yearlyChanges.reduce((sum, change) => sum + (change - mean) ** 2, 0) /
    yearlyChanges.length;
  return Math.sqrt(variance);
}

export function formatPercent(value: number | null) {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function formatShare(value: number | null) {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toFixed(2)}%`;
}
