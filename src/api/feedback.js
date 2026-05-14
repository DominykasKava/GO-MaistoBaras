import client from './client'

export const submitFeedback = (data) =>
  client.post('/feedback', data).then((r) => r.data)

export const getUserFeedback = (userId) =>
  client.get(`/feedback/${userId}`).then((r) => r.data)
