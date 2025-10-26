import apiClient from './axios'

export const fetchWishlist = async () => {
  const { data } = await apiClient.get('/wishlist')
  return data.books
}

export const addBookToWishlist = async (bookId) => {
  const { data } = await apiClient.post(`/wishlist/${bookId}`)
  return data.entry
}

export const removeBookFromWishlist = async (bookId) => {
  await apiClient.delete(`/wishlist/${bookId}`)
}
