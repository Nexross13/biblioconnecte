const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '')

const getVolumeLabel = (book) => {
  const candidate = book?.volume ?? book?.volumeNumber ?? book?.volumeIndex
  if (typeof candidate === 'number' && Number.isFinite(candidate)) {
    return candidate.toString()
  }
  if (typeof candidate === 'string') {
    return candidate.trim()
  }
  return ''
}

const formatBookTitle = (book) => {
  if (!book) {
    return ''
  }
  const baseTitle = normalizeText(book.title)
  const volume = getVolumeLabel(book)
  const volumeTitle = normalizeText(book.volumeTitle)

  if (!volumeTitle) {
    return baseTitle || volume || ''
  }
  if (baseTitle && volume && volumeTitle) {
    return `${baseTitle} - ${volume} : ${volumeTitle}`
  }
  if (baseTitle && volumeTitle) {
    return `${baseTitle} - ${volumeTitle}`
  }
  if (volume && volumeTitle) {
    return `${volume} : ${volumeTitle}`
  }
  return baseTitle || volumeTitle || volume || ''
}

export default formatBookTitle
