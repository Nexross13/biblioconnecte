import apiClient from './axios'

export const fetchLibrary = async () => {
  const { data } = await apiClient.get('/library')
  return data.books
}

export const addBookToLibrary = async (bookId) => {
  const { data } = await apiClient.post(`/library/${bookId}`)
  return data.entry
}

export const removeBookFromLibrary = async (bookId) => {
  await apiClient.delete(`/library/${bookId}`)
}
