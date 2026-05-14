import client from './client'

export const getDrinkCatalog = () =>
  client.get('/drinks/catalog').then((r) => r.data)

export const placeDrinkOrder = (data) =>
  client.post('/drinks/order', data).then((r) => r.data)

export const confirmDrinkPickup = (orderId, code) =>
  client.post(`/drinks/order/${orderId}/pickup`, { code }).then((r) => r.data)

export const getDrinkOrders = () =>
  client.get('/drinks/orders/incoming').then((r) => r.data)
