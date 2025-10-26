import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
const API_ROOT = API_BASE_URL.replace(/\/?api\/v1\/?$/, '')
const ASSETS_BOOKS_BASE_URL = `${API_ROOT}/assets/books`
const ASSETS_PROFILE_BASE_URL = `${API_ROOT}/assets/profile`

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('biblio_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('biblio_token')
    }
    return Promise.reject(error)
  },
)

export default apiClient
export { API_BASE_URL, API_ROOT, ASSETS_BOOKS_BASE_URL, ASSETS_PROFILE_BASE_URL }
