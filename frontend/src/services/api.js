import axios from 'axios'

// Use environment variable for API URL
// Development: uses Vite proxy (/api)
// Production: uses VITE_API_BASE_URL from .env.production
// Fallback: uses deployed backend URL
const API_BASE_URL = import.meta.env.DEV 
  ? '/api' 
  : (import.meta.env.VITE_API_BASE_URL || 'https://stockmanagement-1-ca4p.onrender.com')

// Debug log to verify URL is correct
if (typeof window !== 'undefined') {
  console.log('🔗 API_BASE_URL:', API_BASE_URL)
  console.log('📦 VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL)
  console.log('🔧 DEV mode:', import.meta.env.DEV)
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
    console.log('🔑 Adding token to request:', config.url, 'Token exists:', !!token)
  } else {
    console.log('⚠️ No token found for request:', config.url)
  }
  return config
})

// Handle 401 errors globally - token expired
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('🔒 401 Unauthorized - Token may be expired or invalid')
      // Don't clear token here, let each component handle it
      // But log it for debugging
    }
    return Promise.reject(error)
  }
)

// Product APIs
export const getProducts = () => api.get('/api/products')
export const getProduct = (id) => api.get(`/api/products/${id}`)
export const uploadProductImage = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/api/products/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// Auth APIs
export const googleLogin = (data) => api.post('/api/auth/customer/google', data)
export const customerLogin = (data) => api.post('/api/auth/customer/login', data)
export const setPassword = (data) => api.post('/api/auth/customer/set-password', data)
export const sendOtp = (data) => api.post('/api/auth/customer/send-otp', data)
export const verifyOtp = (data) => api.post('/api/auth/customer/verify-otp', data)
export const adminLogin = (data) => api.post('/api/auth/admin/login', data)
export const getProfile = () => api.get('/api/auth/profile')
export const updateProfile = (data) => api.put('/api/auth/profile', data)
export const changePassword = (data) => api.post('/api/auth/change-password', data)

// Address APIs
export const getAddresses = () => api.get('/api/auth/profile/addresses')
export const addAddress = (data) => api.post('/api/auth/profile/addresses', data)
export const updateAddress = (id, data) => api.put(`/api/auth/profile/addresses/${id}`, data)
export const deleteAddress = (id) => api.delete(`/api/auth/profile/addresses/${id}`)
export const setDefaultAddress = (id) => api.post(`/api/auth/profile/addresses/${id}/set-default`)

// Order APIs
export const createOrder = (data) => api.post('/api/orders', data)
export const getOrder = (id) => api.get(`/api/orders/${id}`)
export const getMyOrders = () => api.get('/api/orders/customer/me')
export const getCustomerOrders = (customerId) => api.get(`/api/orders/customer/${customerId}`)
export const getAllOrders = () => api.get('/api/orders/all')
export const updateOrderStatus = (id, status, cancellationReason = null) => {
  const payload = { status }
  if (cancellationReason) {
    payload.cancellationReason = cancellationReason
  }
  return api.patch(`/api/orders/${id}/status`, payload)
}
export const getTracking = (id) => api.get(`/api/orders/${id}/tracking`)
export const getLocationTracking = (id) => api.get(`/api/orders/${id}/location-tracking`)
export const getOrderByOrderNumber = (orderNumber) => api.get(`/api/orders/by-order-number/${orderNumber}`)
export const getOrderByTrackingId = (trackingId) => api.get(`/api/orders/by-tracking-id/${trackingId}`)

// Stock APIs
export const stockIn = (data) => api.post('/api/stock/in', data)
export const stockOut = (data) => api.post('/api/stock/out', data)
export const getStockHistory = (productId) => api.get(`/api/stock/history/${productId}`)

// Supplier APIs
export const getSuppliers = () => api.get('/api/suppliers')
export const createSupplier = (data) => api.post('/api/suppliers', data)
export const updateSupplier = (id, data) => api.put(`/api/suppliers/${id}`, data)
export const deleteSupplier = (id) => api.delete(`/api/suppliers/${id}`)

// Report APIs
export const getSummary = () => api.get('/api/reports/summary')

// Admin APIs
export const createDeliveryMan = (formData) => {
  return api.post('/api/auth/admin/create-delivery-man', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
export const getDeliveryMen = () => api.get('/api/auth/admin/delivery-men')
export const updateDeliveryMan = (id, data) => api.put(`/api/auth/admin/delivery-men/${id}`, data)
export const deleteDeliveryMan = (id) => api.delete(`/api/auth/admin/delivery-men/${id}`)
export const getAllUsers = () => api.get('/api/auth/admin/users')

// Delivery Man APIs
export const getMyDeliveryOrders = () => api.get('/api/delivery/my-orders')
export const getAvailableOrders = () => api.get('/api/delivery/available-orders')
export const acceptOrder = (orderId) => api.post(`/api/delivery/orders/${orderId}/accept`)
export const updateDeliveryOrderStatus = (orderId, status) => api.post(`/api/delivery/orders/${orderId}/update-status`, { status })
export const updateDeliveryLocation = (orderId, locationData) => api.post(`/api/delivery/orders/${orderId}/update-location`, locationData)
export const getDeliveryOrderDetails = (orderId) => api.get(`/api/delivery/orders/${orderId}`)
export const generateFakeLocations = (orderId) => api.post(`/api/delivery/orders/${orderId}/generate-fake-locations`)

// Cart APIs
export const getCart = () => api.get('/api/cart')
export const addToCart = (productId, quantity = 1) => api.post('/api/cart/items', { productId, quantity })
export const updateCartItem = (itemId, quantity) => api.put(`/api/cart/items/${itemId}`, { quantity })
export const removeCartItem = (itemId) => api.delete(`/api/cart/items/${itemId}`)
export const clearCart = () => api.delete('/api/cart')

// Review APIs
export const getProductReviews = (productId) => api.get(`/api/reviews/product/${productId}`)
export const addReview = (productId, data) => api.post(`/api/reviews/product/${productId}`, data)
export const deleteReview = (reviewId) => api.delete(`/api/reviews/${reviewId}`)
export const getMyReviews = () => api.get('/api/reviews/user/me')


export default api

