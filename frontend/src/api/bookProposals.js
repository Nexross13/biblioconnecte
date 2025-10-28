import apiClient from './axios'

export const fetchBookProposals = async (params = {}) => {
  const { data } = await apiClient.get('/book-proposals', { params })
  return data
}

export const fetchBookProposalById = async (id) => {
  const { data } = await apiClient.get(`/book-proposals/${id}`)
  return data.proposal
}

export const approveBookProposal = async (id) => {
  const { data } = await apiClient.post(`/book-proposals/${id}/approve`)
  return data
}

export const rejectBookProposal = async (id, payload = {}) => {
  const { data } = await apiClient.post(`/book-proposals/${id}/reject`, payload)
  return data
}
