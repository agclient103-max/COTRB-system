export function formatNumber(value) {
  return new Intl.NumberFormat('en-UG').format(value)
}

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
