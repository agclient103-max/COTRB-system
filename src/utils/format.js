export function formatNumber(value) {
  return new Intl.NumberFormat('en-UG').format(value)
}

/** Formats a UGX amount as a compact figure, e.g. 10_400_000 -> "UGX 10.4M". */
export function formatUgxCompact(value) {
  if (value >= 1_000_000_000) {
    return `UGX ${(value / 1_000_000_000).toFixed(2)}B`
  }
  if (value >= 1_000_000) {
    return `UGX ${(value / 1_000_000).toFixed(1)}M`
  }
  if (value >= 1_000) {
    return `UGX ${(value / 1_000).toFixed(0)}K`
  }
  return `UGX ${formatNumber(value)}`
}
