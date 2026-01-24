import { Link, Navigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

export default function Cart() {
  const { user } = useAuth()
  const { cart, removeFromCart, updateQuantity, getTotal, loading } = useCart()

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600 text-lg">Loading cart...</p>
        </div>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center card max-w-md mx-auto">
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 mb-6">
            <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some products to your cart to get started</p>
          <Link to="/" className="btn-primary inline-block">
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Shopping Cart
        </h1>
        <p className="text-gray-600">{cart.length} {cart.length === 1 ? 'item' : 'items'} in your cart</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="card space-y-4">
            {cart.map(item => (
              <div key={item.id} className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100">
                {item.imageUrl ? (
                  <img 
                    src={item.imageUrl} 
                    alt={item.name}
                    className="w-24 h-24 object-cover rounded-xl shadow-md"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
                    <svg className="h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{item.name}</h3>
                  <p className="text-gray-600 font-semibold">₹{item.price} each</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-lg bg-white hover:bg-gray-200 flex items-center justify-center font-bold text-gray-700 shadow-sm transition-colors"
                    >
                      −
                    </button>
                    <span className="w-12 text-center font-bold text-gray-900">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-lg bg-white hover:bg-gray-200 flex items-center justify-center font-bold text-gray-700 shadow-sm transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent w-28 text-right">
                    ₹{item.price * item.quantity}
                  </span>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove item"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="card sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({cart.length} {cart.length === 1 ? 'item' : 'items'})</span>
                <span className="font-semibold">₹{getTotal().toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-gray-900">Total:</span>
                  <span className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    ₹{getTotal().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            <Link
              to="/checkout"
              className="btn-primary w-full text-center block"
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

