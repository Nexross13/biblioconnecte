const formatDate = (date) => {
  if (!date) return ''
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(date))
  } catch {
    return date
  }
}

export default formatDate
