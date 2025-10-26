import apiClient from './axios'

export const updateReview = async (reviewId, payload) => {
  const { data } = await apiClient.put(`/reviews/${reviewId}`, payload)
  return data.review
}

export const deleteReview = async (reviewId) => {
  await apiClient.delete(`/reviews/${reviewId}`)
}
