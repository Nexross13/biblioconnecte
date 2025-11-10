const formatBookAuthors = (book) => {
  if (!book) {
    return ''
  }

  const authorEntries = Array.isArray(book.authors)
    ? book.authors
        .map((author) => [author.firstName, author.lastName].filter(Boolean).join(' ').trim())
        .filter(Boolean)
    : Array.isArray(book.authorNames)
    ? book.authorNames.filter(Boolean)
    : []

  return authorEntries.join(', ')
}

export default formatBookAuthors
