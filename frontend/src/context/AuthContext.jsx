import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

// Provide default value to prevent errors during initial render
const defaultAuthValue = {
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  isAdmin: () => false,
  isDeliveryMan: () => false,
  loading: true
}

const AuthContext = createContext(defaultAuthValue)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  // Initialize user from localStorage if available
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user')
      return storedUser ? JSON.parse(storedUser) : null
    } catch (error) {
      return null
    }
  })
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete axios.defaults.headers.common['Authorization']
    }
    setLoading(false)
  }, [token])

  const login = async (token, userData) => {
    setToken(token)
    setUser(userData)
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete axios.defaults.headers.common['Authorization']
  }

  const isAdmin = () => {
    return user?.role === 'ADMIN' || user?.role === 'DELIVERY_MAN'
  }

  const isDeliveryMan = () => {
    return user?.role === 'DELIVERY_MAN'
  }

  const value = {
    user,
    token,
    login,
    logout,
    isAdmin,
    isDeliveryMan,
    loading
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

