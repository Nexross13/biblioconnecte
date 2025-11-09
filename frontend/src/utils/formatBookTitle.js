const formatBookTitle = (book) => {
  if (!book) {
    return ''
  }
  const base = typeof book.title === 'string' ? book.title.trim() : ''
  const volumeTitle = typeof book.volumeTitle === 'string' ? book.volumeTitle.trim() : ''
  if (base && volumeTitle) {
    return `${base} - ${volumeTitle}`
  }
  return base || volumeTitle || ''
}

export default formatBookTitle
