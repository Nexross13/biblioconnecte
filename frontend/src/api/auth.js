import apiClient from './axios'

export const registerUser = async (payload) => {
  const { data } = await apiClient.post('/auth/register', payload)
  return data
}

export const loginUser = async (payload) => {
  const { data } = await apiClient.post('/auth/login', payload)
  return data
}

export const logoutUser = async () => {
  await apiClient.post('/auth/logout')
}

export const fetchCurrentUser = async () => {
  const { data } = await apiClient.get('/auth/me')
  return data.user
}

export const requestPasswordReset = async ({ email }) => {
  const { data } = await apiClient.post('/auth/password/forgot', { email })
  return data
}

export const verifyPasswordResetCode = async ({ email, code }) => {
  const { data } = await apiClient.post('/auth/password/verify', { email, code })
  return data
}

export const resetPasswordWithCode = async ({ email, code, password }) => {
  const { data } = await apiClient.post('/auth/password/reset', { email, code, password })
  return data
}

export const loginWithGoogle = async ({ credential }) => {
  const { data } = await apiClient.post('/auth/google', { credential })
  return data
}
