import apiClient from './axios'

export const fetchAuthors = async (params = {}) => {
  const { data } = await apiClient.get('/authors', { params })
  return data.authors || []
}

export default fetchAuthors
