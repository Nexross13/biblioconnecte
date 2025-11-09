import apiClient from './axios'

export const updateReview = async (reviewId, payload) => {
  const { data } = await apiClient.put(`/reviews/${reviewId}`, payload)
  return data.review
}

export const deleteReview = async (reviewId, payload = {}) => {
  await apiClient.delete(`/reviews/${reviewId}`, { data: payload })
}

export const fetchReviewModerationFeed = async ({ limit } = {}) => {
  const params = {}
  if (Number.isFinite(limit)) {
    params.limit = limit
  }
  const { data } = await apiClient.get('/reviews/moderation-feed', { params })
  return data.reviews
}

export const approveReview = async (reviewId) => {
  const { data } = await apiClient.post(`/reviews/${reviewId}/approve`)
  return data.review
}
