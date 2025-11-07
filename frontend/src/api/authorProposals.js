import apiClient from './axios'

export const createAuthorProposal = async (payload) => {
  const { data } = await apiClient.post('/author-proposals', payload)
  return data.proposal
}

export const fetchAuthorProposals = async (params = {}) => {
  const { data } = await apiClient.get('/author-proposals', { params })
  return data
}

export const fetchAuthorProposalById = async (id) => {
  const { data } = await apiClient.get(`/author-proposals/${id}`)
  return data.proposal
}

export const approveAuthorProposal = async (id) => {
  const { data } = await apiClient.post(`/author-proposals/${id}/approve`)
  return data
}

export const rejectAuthorProposal = async (id, payload = {}) => {
  const { data } = await apiClient.post(`/author-proposals/${id}/reject`, payload)
  return data
}
