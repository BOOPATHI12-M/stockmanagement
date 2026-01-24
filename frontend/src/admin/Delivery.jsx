import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { 
  getMyDeliveryOrders, 
  getAvailableOrders, 
  acceptOrder, 
  updateDeliveryOrderStatus,
  updateDeliveryLocation 
} from '../services/api'
import LocationUpdater from '../components/LocationUpdater'
import DeliveryLocationMap from '../components/DeliveryLocationMap'

export default function Delivery() {
  const { user, isDeliveryMan } = useAuth()
  const [assignedOrders, setAssignedOrders] = useState([])
  const [availableOrders, setAvailableOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('assigned') // 'assigned' or 'available'

  useEffect(() => {
    if (isDeliveryMan && isDeliveryMan()) {
      loadOrders()
    }
  }, [])

  const loadOrders = async () => {
    setLoading(true)
    setError('')
    try {
      const [assignedResponse, availableResponse] = await Promise.all([
        getMyDeliveryOrders(),
        getAvailableOrders()
      ])
      setAssignedOrders(assignedResponse.data || [])
      setAvailableOrders(availableResponse.data || [])
    } catch (error) {
      console.error('Error loading orders:', error)
      setError(error.response?.data?.error || 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptOrder = async (orderId) => {
    try {
      await acceptOrder(orderId)
      await loadOrders() // Reload orders
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to accept order')
    }
  }

  const handleUpdateStatus = async (orderId, newStatus) => {
    if (!window.confirm(`Update order status to ${newStatus.replace(/_/g, ' ')}?`)) {
      return
    }

    try {
      await updateDeliveryOrderStatus(orderId, newStatus)
      await loadOrders() // Reload orders
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update order status')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACCEPTED':
        return 'bg-blue-700 bg-opacity-30 text-blue-300 border border-blue-500'
      case 'PICKED_UP':
        return 'bg-purple-700 bg-opacity-30 text-purple-300 border border-purple-500'
      case 'OUT_FOR_DELIVERY':
        return 'bg-yellow-700 bg-opacity-30 text-yellow-300 border border-yellow-500'
      case 'DELIVERED':
        return 'bg-green-700 bg-opacity-30 text-green-300 border border-green-500'
      case 'CANCELLED':
        return 'bg-red-700 bg-opacity-30 text-red-300 border border-red-500'
      default:
        return 'bg-gray-700 bg-opacity-30 text-gray-300 border border-gray-500'
    }
  }

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'ACCEPTED':
        return 'PICKED_UP'
      case 'PICKED_UP':
        return 'OUT_FOR_DELIVERY'
      case 'OUT_FOR_DELIVERY':
        return 'DELIVERED'
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen" style={{ background: '#25252b' }}>
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

  if (!isDeliveryMan || !isDeliveryMan()) {
    return (
      <div className="flex justify-center items-center h-screen" style={{ background: '#25252b' }}>
        <div className="text-center card max-w-md" style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
          <h3 className="text-xl font-semibold mb-2" style={{ color: '#fff' }}>Access Denied</h3>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>This page is only accessible to delivery men.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ background: '#25252b', color: '#fff', minHeight: '100vh' }}>

      {error && (
        <div className="mb-6 card bg-red-900 bg-opacity-30 border-l-4 border-red-500" style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-red-300 font-semibold">Error loading orders</p>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
            <button
              onClick={loadOrders}
              className="ml-4 px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-semibold"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex space-x-4 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('assigned')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'assigned'
              ? 'border-b-2 border-cyan-400 text-cyan-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          My Orders ({assignedOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('available')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'available'
              ? 'border-b-2 border-cyan-400 text-cyan-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Available Orders ({availableOrders.length})
        </button>
      </div>

      {/* Orders List */}
      <div className="space-y-6">
        {activeTab === 'assigned' && (
          <>
            {assignedOrders.length === 0 ? (
              <div className="text-center py-16 card" style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-r from-cyan-700 to-blue-700 mb-6">
                  <svg className="h-12 w-12 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No assigned orders</h3>
                <p className="text-gray-300">You don't have any assigned orders yet. Check available orders to accept new deliveries.</p>
              </div>
            ) : (
              assignedOrders.map(order => (
                <div key={order.id} className="card hover:shadow-2xl transition-shadow duration-300" style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
                    <div className="flex-1 mb-4 md:mb-0">
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center mr-3">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">
                            Order #{order.orderNumber}
                          </h3>
                          <p className="text-sm text-gray-300">
                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="ml-13 space-y-1">
                        <p className="text-sm text-gray-200">
                          <span className="font-semibold">Customer:</span> {order.deliveryName}
                        </p>
                        <p className="text-sm text-gray-300">{order.deliveryEmail}</p>
                        <p className="text-sm text-gray-300 font-mono">Tracking: {order.trackingId}</p>
                        <p className="text-sm text-gray-300">
                          <span className="font-semibold">Delivery Address:</span> {order.deliveryAddress}, {order.deliveryPincode}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-3">
                      <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-md ${getStatusColor(order.status)}`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                      <p className="text-2xl font-extrabold" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                        ₹{order.totalAmount}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-gray-700 pt-4 mb-4">
                    <h4 className="font-bold text-white mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                          <div key={item.id || idx} className="flex justify-between items-center p-3 rounded-lg" style={{ background: 'rgba(30, 41, 59, 0.7)' }}>
                            <span className="font-semibold text-white">
                              {productName} × {quantity}
                            </span>
                            <span className="font-bold text-white">
                              ₹{parseFloat(totalPrice).toFixed(2)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Delivery Location Map - Hide after delivery */}
                  {order.deliveryPincode && order.status !== 'DELIVERED' && (
                    <div className="border-t border-gray-700 pt-4 mb-4">
                      <DeliveryLocationMap 
                        pincode={order.deliveryPincode}
                        address={order.deliveryAddress}
                        orderId={order.id}
                      />
                    </div>
                  )}

                  <div className="border-t border-gray-700 pt-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                      <div className="space-y-2">
                        <p className="text-sm text-gray-200">
                          <span className="font-semibold">Payment:</span> {order.paymentMode.replace(/_/g, ' ')}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {getNextStatus(order.status) && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, getNextStatus(order.status))}
                            className="btn-primary"
                          >
                            Mark as {getNextStatus(order.status).replace(/_/g, ' ')}
                          </button>
                        )}
                        {order.status === 'DELIVERED' && (
                          <span className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-semibold">
                            ✓ Delivered
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === 'available' && (
          <>
            {availableOrders.length === 0 ? (
              <div className="text-center py-16 card" style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-r from-cyan-700 to-blue-700 mb-6">
                  <svg className="h-12 w-12 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No available orders</h3>
                <p className="text-gray-300">There are no orders available for delivery at the moment.</p>
              </div>
            ) : (
              availableOrders.map(order => (
                <div key={order.id} className="card hover:shadow-2xl transition-shadow duration-300" style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
                    <div className="flex-1 mb-4 md:mb-0">
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center mr-3">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">
                            Order #{order.orderNumber}
                          </h3>
                          <p className="text-sm text-gray-300">
                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="ml-13 space-y-1">
                        <p className="text-sm text-gray-200">
                          <span className="font-semibold">Customer:</span> {order.deliveryName}
                        </p>
                        <p className="text-sm text-gray-300">{order.deliveryEmail}</p>
                        <p className="text-sm text-gray-300">
                          <span className="font-semibold">Delivery Address:</span> {order.deliveryAddress}, {order.deliveryPincode}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-3">
                      <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-md ${getStatusColor(order.status)}`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                      <p className="text-2xl font-extrabold" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                        ₹{order.totalAmount}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-gray-700 pt-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                      <div className="space-y-2">
                        <p className="text-sm text-gray-200">
                          <span className="font-semibold">Payment:</span> {order.paymentMode.replace(/_/g, ' ')}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleAcceptOrder(order.id)}
                          className="btn-primary"
                        >
                          Accept Order
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  )
}

