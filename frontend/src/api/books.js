import apiClient from './axios'

export const fetchBooks = async (params = {}) => {
  const { data } = await apiClient.get('/books', { params })
  return data
}

export const fetchBookById = async (id) => {
  const { data } = await apiClient.get(`/books/${id}`)
  return data.book
}

export const fetchBookAuthors = async (id) => {
  const { data } = await apiClient.get(`/books/${id}/authors`)
  return data.authors
}

export const fetchBookGenres = async (id) => {
  const { data } = await apiClient.get(`/books/${id}/genres`)
  return data.genres
}

export const fetchBookReviews = async (bookId) => {
  const { data } = await apiClient.get(`/books/${bookId}/reviews`)
  return data.reviews
}

export const createBookReview = async (bookId, payload) => {
  const { data } = await apiClient.post(`/books/${bookId}/reviews`, payload)
  return data.review
}
