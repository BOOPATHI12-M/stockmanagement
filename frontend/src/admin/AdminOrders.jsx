import { useEffect, useState } from 'react'
import { getAllOrders, updateOrderStatus } from '../services/api'

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelModal, setCancelModal] = useState({ show: false, orderId: null, orderNumber: '' })
  const [cancelReason, setCancelReason] = useState('')

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      setError('')
      setLoading(true)
      console.log('Loading orders...')
      const response = await getAllOrders()
      console.log('Orders loaded:', response.data)
      setOrders(response.data || [])
    } catch (error) {
      console.error('Error loading orders:', error)
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      })
      let errorMessage = 'Failed to load orders. '
      if (error.response?.status === 401) {
        errorMessage += 'Please login again.'
      } else if (error.response?.status === 403) {
        errorMessage += 'You do not have permission to view orders.'
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.message) {
        errorMessage += error.message
      } else {
        errorMessage += 'Please check your connection and try again.'
      }
      setError(errorMessage)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  // Get valid next statuses for an order
  const getValidNextStatuses = (currentStatus) => {
    if (currentStatus === 'CANCELLED' || currentStatus === 'DELIVERED') {
      return [] // Final states, no transitions allowed
    }
    
    const statusMap = {
      'PENDING': ['CONFIRMED', 'CANCELLED'],
      'CONFIRMED': ['PROCESSING', 'CANCELLED'],
      'PROCESSING': ['SHIPPED', 'ACCEPTED', 'CANCELLED'],
      'SHIPPED': ['OUT_FOR_DELIVERY', 'CANCELLED'],
      'ACCEPTED': ['PICKED_UP', 'CANCELLED'],
      'PICKED_UP': ['OUT_FOR_DELIVERY', 'CANCELLED'],
      'OUT_FOR_DELIVERY': ['DELIVERED']
    }
    
    return statusMap[currentStatus] || []
  }

  const handleStatusChange = (orderId, newStatus) => {
    if (newStatus === 'CANCELLED') {
      // Show cancellation modal
      const order = orders.find(o => o.id === orderId)
      setCancelModal({ show: true, orderId, orderNumber: order?.orderNumber || `#${orderId}` })
      setCancelReason('')
    } else {
      // Direct status update
      handleStatusUpdate(orderId, newStatus)
    }
  }

  const handleCancelConfirm = async () => {
    if (!cancelReason.trim()) {
      alert('Please provide a cancellation reason')
      return
    }
    
    try {
      await updateOrderStatus(cancelModal.orderId, 'CANCELLED', cancelReason.trim())
      setCancelModal({ show: false, orderId: null, orderNumber: '' })
      setCancelReason('')
      loadOrders()
    } catch (error) {
      console.error('Error canceling order:', error)
      alert(error.response?.data?.error || 'Failed to cancel order')
    }
  }

  const handleStatusUpdate = async (orderId, newStatus, cancellationReason = null) => {
    try {
      await updateOrderStatus(orderId, newStatus, cancellationReason)
      loadOrders()
    } catch (error) {
      console.error('Error updating order status:', error)
      const errorMsg = error.response?.data?.error || 'Failed to update order status'
      alert(errorMsg)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ color: '#06b6d4' }}>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold mb-2" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          Orders Management
        </h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>View and manage all customer orders</p>
      </div>

      {error && (
        <div className="mb-6 card" style={{ background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444' }}>
          <div className="flex items-center">
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#ef4444' }}>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="font-semibold" style={{ color: '#fca5a5' }}>Error loading orders</p>
              <p className="text-sm" style={{ color: '#fca5a5' }}>{error}</p>
            </div>
            <button
              onClick={loadOrders}
              className="ml-4 px-4 py-2 rounded-lg transition-colors text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}
            >
              Retry
            </button>
          </div>
        </div>
      )}
      
      {!error && orders.length === 0 ? (
        <div className="text-center py-16 card max-w-md mx-auto">
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full mb-6" style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(8, 145, 178, 0.2) 100%)' }}>
            <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'rgba(6, 182, 212, 0.5)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: '#fff' }}>No orders yet</h3>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Orders will appear here when customers place them</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order.id} className="card hover:shadow-2xl transition-shadow duration-300">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
                <div className="flex-1 mb-4 md:mb-0">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' }}>
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold" style={{ color: '#fff' }}>
                        Order #{order.orderNumber}
                      </h3>
                      <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {new Date(order.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="ml-13 space-y-1">
                    <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      <span className="font-semibold">Customer:</span> {order.deliveryName}
                    </p>
                    <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{order.deliveryEmail}</p>
                    <p className="text-sm font-mono" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Tracking: {order.trackingId}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-3">
                  <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-md ${
                    order.status === 'DELIVERED' ? 'bg-green-500 text-white' :
                    order.status === 'CANCELLED' ? 'bg-red-500 text-white' :
                    order.status === 'OUT_FOR_DELIVERY' ? 'bg-yellow-500 text-white' :
                    'bg-blue-500 text-white'
                  }`}>
                    {order.status.replace(/_/g, ' ')}
                  </span>
                  <p className="text-2xl font-extrabold" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    ₹{order.totalAmount}
                  </p>
                </div>
              </div>
              
              <div className="pt-4 mb-4" style={{ borderTop: '1px solid rgba(6, 182, 212, 0.3)' }}>
                <h4 className="font-bold mb-3 flex items-center" style={{ color: '#fff' }}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#06b6d4' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  Order Items
                </h4>
                <div className="space-y-2">
                  {order.items?.map((item, idx) => {
                    const productName = item.product?.name || 'Unknown Product'
                    const quantity = item.quantity || 1
                    const totalPrice = item.totalPrice || 0
                    return (
                      <div key={item.id || idx} className="flex justify-between items-center p-3 rounded-lg" style={{ background: 'rgba(6, 182, 212, 0.05)' }}>
                        <span className="font-semibold" style={{ color: '#fff' }}>
                          {productName} × {quantity}
                        </span>
                        <span className="font-bold" style={{ color: '#fff' }}>
                          ₹{parseFloat(totalPrice).toFixed(2)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="pt-4" style={{ borderTop: '1px solid rgba(6, 182, 212, 0.3)' }}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                  <div className="space-y-2">
                    <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      <span className="font-semibold">Delivery:</span> {order.deliveryAddress}, {order.deliveryPincode}
                    </p>
                    <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      <span className="font-semibold">Payment:</span> {order.paymentMode.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className="px-4 py-2 rounded-lg text-sm font-semibold focus:outline-none shadow-sm hover:shadow-md transition-all"
                      style={{ border: '2px solid rgba(6, 182, 212, 0.3)', background: 'rgba(30, 41, 59, 0.8)', color: '#fff' }}
                      onFocus={(e) => { e.target.style.borderColor = '#06b6d4'; e.target.style.boxShadow = '0 0 0 3px rgba(6, 182, 212, 0.1)'; }}
                      onBlur={(e) => { e.target.style.borderColor = 'rgba(6, 182, 212, 0.3)'; e.target.style.boxShadow = 'none'; }}
                      disabled={order.status === 'CANCELLED' || order.status === 'DELIVERED'}
                    >
                      <option value={order.status} style={{ background: '#1e293b', color: '#fff' }}>
                        {order.status.replace(/_/g, ' ')} (Current)
                      </option>
                      {getValidNextStatuses(order.status).map(status => (
                        <option key={status} value={status} style={{ background: '#1e293b', color: '#fff' }}>
                          {status.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancellation Modal */}
      {cancelModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-2xl font-bold mb-4" style={{ color: '#1e293b' }}>
                Cancel Order {cancelModal.orderNumber}
              </h3>
              <p className="text-sm mb-4" style={{ color: '#64748b' }}>
                Please provide a valid reason for canceling this order. This reason will be recorded and cannot be changed.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2" style={{ color: '#1e293b' }}>
                  Cancellation Reason *
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Enter the reason for cancellation..."
                  rows="4"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setCancelModal({ show: false, orderId: null, orderNumber: '' })
                    setCancelReason('')
                  }}
                  className="flex-1 px-4 py-2 rounded-lg font-semibold transition-all"
                  style={{ background: '#e2e8f0', color: '#1e293b' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCancelConfirm}
                  disabled={!cancelReason.trim()}
                  className="flex-1 px-4 py-2 rounded-lg font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}
                >
                  Confirm Cancellation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

