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
