import client from './client'

export const getOffers = (lat, lng, radius) =>
  client.get('/offers', { params: { lat, lng, radius } }).then((r) => r.data)

export const getOffer = (id) =>
  client.get(`/offers/${id}`).then((r) => r.data)

export const createOffer = (data) =>
  client.post('/offers', data).then((r) => r.data)

export const getMyOffers = () =>
  client.get('/offers/mine').then((r) => r.data)

export const deleteOffer = (id) =>
  client.delete(`/offers/${id}`).then((r) => r.data)
