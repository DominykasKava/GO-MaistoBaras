import client from './client'

export const getOrders = () =>
  client.get('/orders').then((r) => r.data)

export const getOrder = (id) =>
  client.get(`/orders/${id}`).then((r) => r.data)

export const placeOrder = (data) =>
  client.post('/orders', data).then((r) => r.data)

export const confirmOrder = (id) =>
  client.put(`/orders/${id}/confirm`).then((r) => r.data)

export const confirmDelivery = (id) =>
  client.put(`/orders/${id}/confirm-delivery`).then((r) => r.data)

export const confirmReceipt = (id) =>
  client.put(`/orders/${id}/confirm-receipt`).then((r) => r.data)

export const declineOrder = (id) =>
  client.put(`/orders/${id}/decline`).then((r) => r.data)
