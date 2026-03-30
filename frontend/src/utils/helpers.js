export function formatCountdown(hours) {
  if (hours <= 0) return 'Expiring soon'
  if (hours < 1) return `${Math.round(hours * 60)}m remaining`
  return `${hours.toFixed(1)}h remaining`
}

export function formatDate(isoString) {
  if (!isoString) return ''
  return new Date(isoString).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getErrorMessage(err) {
  return err?.response?.data?.detail || err?.message || 'Something went wrong.'
}