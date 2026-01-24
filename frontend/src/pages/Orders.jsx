import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function Orders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      loadOrders()
    }
  }, [user])

  const loadOrders = async () => {
    try {
      // Use the /customer/me endpoint to get current user's orders
      const response = await api.get('/orders/customer/me')
      setOrders(response.data)
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600 text-lg">Loading your orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          My Orders
        </h1>
        <p className="text-gray-600">View and track your order history</p>
      </div>
      
      {orders.length === 0 ? (
        <div className="text-center py-16 card max-w-md mx-auto">
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 mb-6">
            <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h3>
          <p className="text-gray-600 mb-6">Start shopping to see your orders here</p>
          <Link to="/" className="btn-primary inline-block">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order.id} className="card hover:shadow-2xl transition-shadow duration-300">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <div className="flex-1 mb-4 md:mb-0">
                  <div className="flex items-center mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Order #{order.orderNumber}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col md:items-end space-y-2">
                  <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-md ${
                    order.status === 'DELIVERED' ? 'bg-green-500 text-white' :
                    order.status === 'CANCELLED' ? 'bg-red-500 text-white' :
                    order.status === 'OUT_FOR_DELIVERY' ? 'bg-yellow-500 text-white' :
                    'bg-blue-500 text-white'
                  }`}>
                    {order.status.replace(/_/g, ' ')}
                  </span>
                  <p className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    ₹{order.totalAmount}
                  </p>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      {order.items?.length} {order.items?.length === 1 ? 'item' : 'items'}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      {order.trackingId}
                    </div>
                  </div>
                  <Link
                    to={`/track/${order.id}`}
                    className="btn-secondary inline-flex items-center justify-center"
                  >
                    Track Order
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

