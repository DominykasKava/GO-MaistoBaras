import client from './client'

export const searchUsers = (q) =>
  client.get('/users/search', { params: { q } }).then((r) => r.data)

export const getUserProfile = (id) =>
  client.get(`/users/${id}`).then((r) => r.data)
