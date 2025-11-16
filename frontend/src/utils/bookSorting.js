const parseTimestamp = (value) => {
  if (!value) {
    return 0
  }
  const date = new Date(value)
  const timestamp = date.getTime()
  return Number.isFinite(timestamp) ? timestamp : 0
}

const SERIES_LOCALE = 'fr'
const SERIES_COMPARE_OPTIONS = { sensitivity: 'base' }

const normalizeSeriesTitle = (book) => {
  if (!book) {
    return ''
  }
  return (book.title || '').toString().trim().toLowerCase()
}

const extractVolumeNumber = (book) => {
  if (!book) {
    return Number.MAX_SAFE_INTEGER
  }
  const rawVolume = book.volume ?? book.volumeNumber ?? book.volumeIndex
  const parsed = Number.parseInt(rawVolume, 10)
  if (Number.isFinite(parsed)) {
    return parsed
  }
  return Number.MAX_SAFE_INTEGER
}

export const getBookAddedTimestamp = (book) => {
  if (!book) {
    return 0
  }
  const candidate =
    book.addedAt ||
    book.libraryAddedAt ||
    book.wishlistAddedAt ||
    book.createdAt ||
    book.updatedAt
  return parseTimestamp(candidate)
}

export const compareBooksBySeriesAndVolume = (bookA, bookB) => {
  const titleA = normalizeSeriesTitle(bookA)
  const titleB = normalizeSeriesTitle(bookB)
  const titleComparison = titleA.localeCompare(titleB, SERIES_LOCALE, SERIES_COMPARE_OPTIONS)
  if (titleComparison !== 0) {
    return titleComparison
  }
  return extractVolumeNumber(bookA) - extractVolumeNumber(bookB)
}

const INITIAL_FALLBACK = '#'
const VALID_LETTER_REGEX = /^[a-z]$/i

const stripDiacritics = (value) => {
  if (!value) {
    return ''
  }
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export const getSeriesInitialLetter = (book) => {
  const normalized = normalizeSeriesTitle(book)
  if (!normalized) {
    return INITIAL_FALLBACK
  }
  const [firstChar] = Array.from(normalized)
  if (!firstChar) {
    return INITIAL_FALLBACK
  }
  const uppercaseChar = firstChar.toLocaleUpperCase('fr-FR')
  const baseChar = stripDiacritics(uppercaseChar)
  if (VALID_LETTER_REGEX.test(baseChar)) {
    return baseChar
  }
  if (VALID_LETTER_REGEX.test(uppercaseChar)) {
    return uppercaseChar
  }
  return INITIAL_FALLBACK
}
