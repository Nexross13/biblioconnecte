import apiClient from './axios'

export const reportBook = async (bookId, payload) => {
  const { data } = await apiClient.post(`/books/${bookId}/reports`, payload)
  return data.report
}

export const fetchBookReports = async (params = {}) => {
  const { data } = await apiClient.get('/book-reports', { params })
  return data.reports
}

export const closeBookReport = async (reportId) => {
  const { data } = await apiClient.patch(`/book-reports/${reportId}/close`)
  return data.report
}
