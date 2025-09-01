export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export function formatXP(xp: number): string {
  return formatNumber(xp)
}

export function formatTime(hours: number): string {
  if (hours < 1) {
    const minutes = Math.round(hours * 60)
    return `${minutes}m`
  }
  if (hours < 24) {
    return `${Math.round(hours)}h`
  }
  const days = Math.round(hours / 24)
  return `${days}d`
}

export function getChangeIndicator(current: number, previous: number): {
  value: string
  isPositive: boolean
} {
  if (previous === 0) {
    return { value: 'New', isPositive: true }
  }
  
  const change = ((current - previous) / previous) * 100
  const isPositive = change >= 0
  
  if (Math.abs(change) < 1) {
    return { value: 'No change', isPositive: true }
  }
  
  return {
    value: `${isPositive ? '+' : ''}${Math.round(change)}%`,
    isPositive
  }
}
