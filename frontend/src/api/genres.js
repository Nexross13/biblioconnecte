import apiClient from './axios'

export const fetchGenres = async () => {
  const { data } = await apiClient.get('/genres')
  return data.genres || []
}

export default fetchGenres
