import apiClient from './axios'

export const fetchAuthors = async (params = {}) => {
  const { data } = await apiClient.get('/authors', { params })
  return data.authors || []
}

export const fetchAuthorById = async (id) => {
  const { data } = await apiClient.get(`/authors/${id}`)
  return data.author
}

export const fetchAuthorBooks = async (id) => {
  const { data } = await apiClient.get(`/authors/${id}/books`)
  return data.books || []
}

export default fetchAuthors
