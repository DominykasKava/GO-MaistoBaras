import client from './client'

export const login = (email, password) =>
  client.post('/auth/login', { email, password }).then((r) => r.data)

export const register = (name, email, password, role, gimimo_data) =>
  client.post('/auth/register', { name, email, password, role, gimimo_data }).then((r) => r.data)

export const logout = () =>
  client.post('/auth/logout').catch(() => {})
