import apiClient from './axios'

export const fetchHighlights = async () => {
  const { data } = await apiClient.get('/stats/highlights')
  return data
}
