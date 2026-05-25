import React, { createContext, useContext, useReducer, useEffect } from 'react'
import client from '../api/client'
import { login as apiLogin, logout as apiLogout } from '../api/auth'

const AuthContext = createContext(null)

const initialState = { user: null, token: null, loading: true }

function reducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, user: action.user, token: action.token, loading: false }
    case 'LOGOUT':
      return { user: null, token: null, loading: false }
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.user } }
    case 'LOADED':
      return { ...state, loading: false }
    default:
      return state
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      dispatch({ type: 'LOADED' })
      return
    }
    client
      .get('/users/me')
      .then((r) => dispatch({ type: 'LOGIN', user: r.data, token }))
      .catch(() => {
        localStorage.removeItem('token')
        dispatch({ type: 'LOADED' })
      })
  }, [])

  const login = async (email, password) => {
    const data = await apiLogin(email, password)
    localStorage.setItem('token', data.token)
    dispatch({ type: 'LOGIN', user: data.user, token: data.token })
    return data
  }

  const logout = async () => {
    await apiLogout()
    localStorage.removeItem('token')
    dispatch({ type: 'LOGOUT' })
  }

  const updateUser = (user) => dispatch({ type: 'UPDATE_USER', user })

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
