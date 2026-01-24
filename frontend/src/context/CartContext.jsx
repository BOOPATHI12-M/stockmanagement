import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { getCart, addToCart as addToCartApi, updateCartItem, removeCartItem, clearCart as clearCartApi } from '../services/api'

const CartContext = createContext()

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}

export const CartProvider = ({ children }) => {
  const { user, token } = useAuth()
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(false)

  // Load cart from backend when user logs in (only for customers)
  useEffect(() => {
    if (user && token && user.role === 'CUSTOMER') {
      loadCart()
    } else {
      // Clear cart when user logs out or is not a customer
      setCart([])
    }
  }, [user, token])

  const loadCart = async () => {
    if (!user || !token || user.role !== 'CUSTOMER') return
    
    try {
      setLoading(true)
      const response = await getCart()
      const cartData = response.data
      // Convert cart items to a simpler format for frontend
      const items = cartData.items?.map(item => ({
        id: item.product.id,
        name: item.product.name,
        description: item.product.description,
        price: parseFloat(item.product.price),
        imageUrl: item.product.imageUrl,
        quantity: item.quantity,
        cartItemId: item.id // Keep track of cart item ID for updates
      })) || []
      setCart(items)
    } catch (error) {
      // Only log error if it's not a 403 (forbidden for non-customers)
      if (error.response?.status !== 403) {
        console.error('Error loading cart:', error)
      }
      setCart([])
    } finally {
      setLoading(false)
    }
  }

  const addToCart = async (product, quantity = null) => {
    if (!user || !token) {
      alert('Please login to add items to cart')
      return
    }

    try {
      setLoading(true)
      // Use quantity from product object if provided, otherwise use quantity parameter, default to 1
      const qty = quantity || product.quantity || 1
      await addToCartApi(product.id, qty)
      await loadCart() // Reload cart from backend
    } catch (error) {
      console.error('Error adding to cart:', error)
      const errorMessage = error.response?.data?.error || 'Failed to add item to cart'
      alert(`Error: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const removeFromCart = async (productId) => {
    if (!user || !token) return

    try {
      setLoading(true)
      // Find the cart item ID
      const cartItem = cart.find(item => item.id === productId)
      if (cartItem && cartItem.cartItemId) {
        await removeCartItem(cartItem.cartItemId)
        await loadCart() // Reload cart from backend
      }
    } catch (error) {
      console.error('Error removing from cart:', error)
      alert('Failed to remove item from cart')
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (productId, quantity) => {
    if (!user || !token) return

    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    try {
      setLoading(true)
      // Find the cart item ID
      const cartItem = cart.find(item => item.id === productId)
      if (cartItem && cartItem.cartItemId) {
        await updateCartItem(cartItem.cartItemId, quantity)
        await loadCart() // Reload cart from backend
      }
    } catch (error) {
      console.error('Error updating quantity:', error)
      alert('Failed to update quantity')
    } finally {
      setLoading(false)
    }
  }

  const clearCart = async () => {
    if (!user || !token) return

    try {
      setLoading(true)
      await clearCartApi()
      setCart([])
    } catch (error) {
      console.error('Error clearing cart:', error)
      alert('Failed to clear cart')
    } finally {
      setLoading(false)
    }
  }

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  const getItemCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotal,
    getItemCount,
    loading
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

