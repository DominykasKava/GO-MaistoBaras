import client from './client'

export const getGerimoPasiulymai = () =>
  client.get('/gerimo-pasiulymai').then((r) => r.data)

export const getMyGerimoPasiulymai = () =>
  client.get('/gerimo-pasiulymai/mine').then((r) => r.data)

export const createGerimoPasiulymas = (data) =>
  client.post('/gerimo-pasiulymai', data).then((r) => r.data)

export const deleteGerimoPasiulymas = (id) =>
  client.delete(`/gerimo-pasiulymai/${id}`).then((r) => r.data)

export const getGerimoUzsakymai = () =>
  client.get('/gerimo-uzsakymai').then((r) => r.data)

export const getGerimoUzsakymas = (id) =>
  client.get(`/gerimo-uzsakymai/${id}`).then((r) => r.data)

export const placeGerimoUzsakymas = (data) =>
  client.post('/gerimo-uzsakymai', data).then((r) => r.data)

export const confirmGerimoUzsakymas = (id) =>
  client.put(`/gerimo-uzsakymai/${id}/confirm`).then((r) => r.data)

export const pickupGerimoUzsakymas = (id) =>
  client.put(`/gerimo-uzsakymai/${id}/pickup`).then((r) => r.data)

export const declineGerimoUzsakymas = (id) =>
  client.put(`/gerimo-uzsakymai/${id}/decline`).then((r) => r.data)
