import client from './client'

export const getBalance = () =>
  client.get('/points/balance').then((r) => r.data)

export const getLeaderboard = () =>
  client.get('/points/leaderboard').then((r) => r.data)

export const sendPoints = (recipientId, amount) =>
  client.post('/points/send', { recipient_id: recipientId, amount }).then((r) => r.data)
