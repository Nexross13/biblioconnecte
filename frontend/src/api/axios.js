import axios from 'axios'

const DEFAULT_API_BASE_URL = 'http://localhost:3000/api/v1'

const normalizeApiBaseUrl = (rawValue) => {
  if (!rawValue || typeof rawValue !== 'string') {
    return DEFAULT_API_BASE_URL
  }

  let candidate = rawValue.trim()

  if (!candidate.length) {
    return DEFAULT_API_BASE_URL
  }

  if (/^https\/\//i.test(candidate)) {
    candidate = `https://${candidate.slice(7)}`
  } else if (/^http\/\//i.test(candidate)) {
    candidate = `http://${candidate.slice(6)}`
  }

  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate.replace(/^\/+/, '')}`
  }

  try {
    const url = new URL(candidate)
    url.pathname = url.pathname.replace(/\/+$/, '')
    return url.toString()
  } catch {
    return DEFAULT_API_BASE_URL
  }
}

const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL)
const API_ROOT = API_BASE_URL.replace(/\/?api\/v1\/?$/, '')
const ASSETS_BOOKS_BASE_URL = `${API_ROOT}/assets/books`
const ASSETS_PROFILE_BASE_URL = `${API_ROOT}/assets/profile`
const ASSETS_COMPONENTS_BASE_URL = `${API_ROOT}/assets/components`

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('API request returned 401 (unauthorized).')
    }
    return Promise.reject(error)
  },
)

export default apiClient
export {
  API_BASE_URL,
  API_ROOT,
  ASSETS_BOOKS_BASE_URL,
  ASSETS_PROFILE_BASE_URL,
  ASSETS_COMPONENTS_BASE_URL,
}
