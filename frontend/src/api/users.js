import apiClient from './axios'

export const fetchUsers = async () => {
  const { data } = await apiClient.get('/users')
  return data.users
}

export const fetchUserById = async (id) => {
  const { data } = await apiClient.get(`/users/${id}`)
  return data.user
}

export const fetchFriends = async (userId) => {
  const { data } = await apiClient.get(`/users/${userId}/friends`)
  return data.friends
}

export const requestFriend = async (userId) => {
  const { data } = await apiClient.post(`/users/${userId}/friends`)
  return data.friendship
}

export const acceptFriend = async ({ userId, friendId }) => {
  const { data } = await apiClient.put(`/users/${userId}/friends/${friendId}/accept`)
  return data.friendship
}

export const deleteFriend = async ({ userId, friendId }) => {
  await apiClient.delete(`/users/${userId}/friends/${friendId}`)
}

export const updateProfile = async (userId, payload) => {
  let dataToSend = payload

  if (!(payload instanceof FormData)) {
    dataToSend = new FormData()
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        dataToSend.append(key, value)
      }
    })
  }

  const { data } = await apiClient.put(`/users/${userId}`, dataToSend, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.user
}
