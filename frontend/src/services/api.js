import axios from 'axios'

// Use environment variable for API URL
// Development: uses Vite proxy (/api)
// Production: uses VITE_API_BASE_URL from .env.production (must include /api path)
const API_BASE_URL = import.meta.env.DEV 
  ? '/api' 
  : import.meta.env.VITE_API_BASE_URL

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
export const getProducts = () => api.get('/products')
export const getProduct = (id) => api.get(`/products/${id}`)
export const uploadProductImage = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/products/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// Auth APIs
export const googleLogin = (data) => api.post('/auth/customer/google', data)
export const customerLogin = (data) => api.post('/auth/customer/login', data)
export const setPassword = (data) => api.post('/auth/customer/set-password', data)
export const sendOtp = (data) => api.post('/auth/customer/send-otp', data)
export const verifyOtp = (data) => api.post('/auth/customer/verify-otp', data)
export const adminLogin = (data) => api.post('/auth/admin/login', data)
export const getProfile = () => api.get('/auth/profile')
export const updateProfile = (data) => api.put('/auth/profile', data)
export const changePassword = (data) => api.post('/auth/change-password', data)

// Address APIs
export const getAddresses = () => api.get('/auth/profile/addresses')
export const addAddress = (data) => api.post('/auth/profile/addresses', data)
export const updateAddress = (id, data) => api.put(`/auth/profile/addresses/${id}`, data)
export const deleteAddress = (id) => api.delete(`/auth/profile/addresses/${id}`)
export const setDefaultAddress = (id) => api.post(`/auth/profile/addresses/${id}/set-default`)

// Order APIs
export const createOrder = (data) => api.post('/orders', data)
export const getOrder = (id) => api.get(`/orders/${id}`)
export const getMyOrders = () => api.get('/orders/customer/me')
export const getCustomerOrders = (customerId) => api.get(`/orders/customer/${customerId}`)
export const getAllOrders = () => api.get('/orders/all')
export const updateOrderStatus = (id, status, cancellationReason = null) => {
  const payload = { status }
  if (cancellationReason) {
    payload.cancellationReason = cancellationReason
  }
  return api.patch(`/orders/${id}/status`, payload)
}
export const getTracking = (id) => api.get(`/orders/${id}/tracking`)
export const getLocationTracking = (id) => api.get(`/orders/${id}/location-tracking`)
export const getOrderByOrderNumber = (orderNumber) => api.get(`/orders/by-order-number/${orderNumber}`)
export const getOrderByTrackingId = (trackingId) => api.get(`/orders/by-tracking-id/${trackingId}`)

// Stock APIs
export const stockIn = (data) => api.post('/stock/in', data)
export const stockOut = (data) => api.post('/stock/out', data)
export const getStockHistory = (productId) => api.get(`/stock/history/${productId}`)

// Supplier APIs
export const getSuppliers = () => api.get('/suppliers')
export const createSupplier = (data) => api.post('/suppliers', data)
export const updateSupplier = (id, data) => api.put(`/suppliers/${id}`, data)
export const deleteSupplier = (id) => api.delete(`/suppliers/${id}`)

// Report APIs
export const getSummary = () => api.get('/reports/summary')

// Admin APIs
export const createDeliveryMan = (formData) => {
  return api.post('/auth/admin/create-delivery-man', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
export const getDeliveryMen = () => api.get('/auth/admin/delivery-men')
export const updateDeliveryMan = (id, data) => api.put(`/auth/admin/delivery-men/${id}`, data)
export const deleteDeliveryMan = (id) => api.delete(`/auth/admin/delivery-men/${id}`)
export const getAllUsers = () => api.get('/auth/admin/users')

// Delivery Man APIs
export const getMyDeliveryOrders = () => api.get('/delivery/my-orders')
export const getAvailableOrders = () => api.get('/delivery/available-orders')
export const acceptOrder = (orderId) => api.post(`/delivery/orders/${orderId}/accept`)
export const updateDeliveryOrderStatus = (orderId, status) => api.post(`/delivery/orders/${orderId}/update-status`, { status })
export const updateDeliveryLocation = (orderId, locationData) => api.post(`/delivery/orders/${orderId}/update-location`, locationData)
export const getDeliveryOrderDetails = (orderId) => api.get(`/delivery/orders/${orderId}`)
export const generateFakeLocations = (orderId) => api.post(`/delivery/orders/${orderId}/generate-fake-locations`)

// Cart APIs
export const getCart = () => api.get('/cart')
export const addToCart = (productId, quantity = 1) => api.post('/cart/items', { productId, quantity })
export const updateCartItem = (itemId, quantity) => api.put(`/cart/items/${itemId}`, { quantity })
export const removeCartItem = (itemId) => api.delete(`/cart/items/${itemId}`)
export const clearCart = () => api.delete('/cart')

// Review APIs
export const getProductReviews = (productId) => api.get(`/reviews/product/${productId}`)
export const addReview = (productId, data) => api.post(`/reviews/product/${productId}`, data)
export const deleteReview = (reviewId) => api.delete(`/reviews/${reviewId}`)
export const getMyReviews = () => api.get('/reviews/user/me')


export default api

