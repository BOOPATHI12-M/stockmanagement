import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getTracking } from '../services/api'
import LeafletTrackingMap from '../components/LeafletTrackingMap'

export default function TrackOrder() {
  const { orderId } = useParams()
  const [tracking, setTracking] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTracking()
  }, [orderId])

  const loadTracking = async () => {
    try {
      const response = await getTracking(orderId)
      setTracking(response.data)
    } catch (error) {
      console.error('Error loading tracking:', error)
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
          <p className="text-gray-600 text-lg">Loading tracking information...</p>
        </div>
      </div>
    )
  }

  if (!tracking) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center card max-w-md">
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-r from-red-100 to-pink-100 mb-6">
            <svg className="h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Tracking Not Found</h3>
          <p className="text-gray-600">Unable to find tracking information for this order.</p>
        </div>
      </div>
    )
  }

  const events = tracking.events || []
  const currentStatus = tracking.status
  const eventTypes = [
    'LABEL_CREATED',
    'SHIPMENT_PICKED',
    'PACKAGE_RECEIVED_AT_FACILITY',
    'PACKAGE_LEFT_FACILITY',
    'PACKAGE_ARRIVED_AT_LOCAL_FACILITY',
    'OUT_FOR_DELIVERY',
    'DELIVERED'
  ]

  const getEventLabel = (type) => {
    const labels = {
      LABEL_CREATED: 'Label Created',
      SHIPMENT_PICKED: 'Shipment Picked',
      PACKAGE_RECEIVED_AT_FACILITY: 'Package Received at Facility',
      PACKAGE_LEFT_FACILITY: 'Package Left Facility',
      PACKAGE_ARRIVED_AT_LOCAL_FACILITY: 'Package Arrived at Local Facility',
      OUT_FOR_DELIVERY: 'Out for Delivery',
      DELIVERED: 'Delivered'
    }
    return labels[type] || type
  }

  const isEventCompleted = (eventType) => {
    const statusOrder = {
      'CONFIRMED': 0,
      'PROCESSING': 1,
      'SHIPPED': 2,
      'OUT_FOR_DELIVERY': 5,
      'DELIVERED': 6
    }
    const eventOrder = {
      'LABEL_CREATED': 0,
      'SHIPMENT_PICKED': 1,
      'PACKAGE_RECEIVED_AT_FACILITY': 2,
      'PACKAGE_LEFT_FACILITY': 3,
      'PACKAGE_ARRIVED_AT_LOCAL_FACILITY': 4,
      'OUT_FOR_DELIVERY': 5,
      'DELIVERED': 6
    }
    
    const currentOrder = statusOrder[currentStatus] || 0
    const eventOrderValue = eventOrder[eventType] || 0
    
    return eventOrderValue <= currentOrder
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Track Your Order
        </h1>
        <p className="text-gray-600">Real-time order tracking information</p>
      </div>
      
      <div className="card mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
            <p className="text-sm font-semibold text-gray-600 mb-2">Order Number</p>
            <p className="text-xl font-bold text-gray-900">{tracking.orderNumber}</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
            <p className="text-sm font-semibold text-gray-600 mb-2">Tracking ID</p>
            <p className="text-xl font-bold text-gray-900 font-mono">{tracking.trackingId}</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
            <p className="text-sm font-semibold text-gray-600 mb-2">Courier</p>
            <p className="text-xl font-bold text-gray-900">{tracking.courierName}</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
            <p className="text-sm font-semibold text-gray-600 mb-2">Status</p>
            <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
              tracking.status === 'DELIVERED' ? 'bg-green-500 text-white' :
              tracking.status === 'CANCELLED' ? 'bg-red-500 text-white' :
              tracking.status === 'OUT_FOR_DELIVERY' ? 'bg-yellow-500 text-white' :
              'bg-blue-500 text-white'
            }`}>
              {tracking.status.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="md:col-span-2 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
            <p className="text-sm font-semibold text-gray-600 mb-2">Estimated Delivery</p>
            <p className="text-lg font-bold text-gray-900">
              {new Date(tracking.estimatedDeliveryStart).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })} - {new Date(tracking.estimatedDeliveryEnd).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Live Location Tracking Map */}
      {(tracking.status === 'ACCEPTED' || tracking.status === 'PICKED_UP' || 
        tracking.status === 'OUT_FOR_DELIVERY') && (
        <div className="card mb-8">
          <LeafletTrackingMap orderId={orderId} refreshInterval={5000} />
        </div>
      )}

      {/* Enhanced Timeline */}
      <div className="card">
        <div className="flex items-center mb-8">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Tracking Timeline</h2>
        </div>
        
        <div className="relative pl-8">
          {eventTypes.map((eventType, index) => {
            const event = events.find(e => e.eventType === eventType)
            const isCompleted = isEventCompleted(eventType)
            const isLast = index === eventTypes.length - 1
            
            return (
              <div key={eventType} className="relative flex items-start mb-8">
                <div className="absolute left-0 flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full border-4 border-white shadow-lg flex items-center justify-center ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-300'
                  }`}>
                    {isCompleted && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  {!isLast && (
                    <div className={`w-1 h-20 mt-2 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
                <div className="ml-6 flex-1">
                  <div className={`p-4 rounded-xl ${
                    isCompleted 
                      ? 'bg-green-50 border-2 border-green-200' 
                      : 'bg-gray-50 border-2 border-gray-200'
                  }`}>
                    <p className={`text-lg font-bold mb-1 ${
                      isCompleted ? 'text-green-700' : 'text-gray-500'
                    }`}>
                      {getEventLabel(eventType)}
                    </p>
                    {event && (
                      <>
                        <p className="text-sm text-gray-700 mb-1">{event.description}</p>
                        {event.location && (
                          <p className="text-sm text-gray-600 flex items-center mb-2">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {event.location}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {new Date(event.eventTime).toLocaleString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

