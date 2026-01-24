import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getOrderByOrderNumber, getOrderByTrackingId } from '../services/api'

export default function TrackOrderSearch() {
  const [searchValue, setSearchValue] = useState('')
  const [searchType, setSearchType] = useState('orderId') // 'orderId', 'orderNumber', 'trackingId'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSearch = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!searchValue.trim()) {
      setError(`Please enter an ${searchType === 'orderId' ? 'Order ID' : searchType === 'orderNumber' ? 'Order Number' : 'Tracking ID'}`)
      return
    }

    setLoading(true)

    try {
      if (searchType === 'orderId') {
        // Navigate directly to track page with order ID
        navigate(`/track/${searchValue.trim()}`)
      } else if (searchType === 'orderNumber') {
        // Search by order number first, then navigate
        const response = await getOrderByOrderNumber(searchValue.trim())
        if (response.data && response.data.id) {
          navigate(`/track/${response.data.id}`)
        } else {
          setError('Order not found with this order number')
        }
      } else if (searchType === 'trackingId') {
        // Search by tracking ID first, then navigate
        const response = await getOrderByTrackingId(searchValue.trim())
        if (response.data && response.data.id) {
          navigate(`/track/${response.data.id}`)
        } else {
          setError('Order not found with this tracking ID')
        }
      }
    } catch (error) {
      console.error('Error searching for order:', error)
      setError(error.response?.data?.error || `Order not found. Please check your ${searchType === 'orderId' ? 'Order ID' : searchType === 'orderNumber' ? 'Order Number' : 'Tracking ID'}.`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="card">
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Track Your Order
          </h1>
          <p className="text-gray-600">Enter your order ID, order number, or tracking ID to track your order</p>
        </div>

        <form onSubmit={handleSearch} className="space-y-6">
          {/* Search Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Search By
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => {
                  setSearchType('orderId')
                  setSearchValue('')
                  setError('')
                }}
                className={`px-4 py-3 rounded-lg font-medium transition-all ${
                  searchType === 'orderId'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Order ID
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchType('orderNumber')
                  setSearchValue('')
                  setError('')
                }}
                className={`px-4 py-3 rounded-lg font-medium transition-all ${
                  searchType === 'orderNumber'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Order Number
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchType('trackingId')
                  setSearchValue('')
                  setError('')
                }}
                className={`px-4 py-3 rounded-lg font-medium transition-all ${
                  searchType === 'trackingId'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tracking ID
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {searchType === 'orderId' ? 'Order ID' : searchType === 'orderNumber' ? 'Order Number' : 'Tracking ID'}
            </label>
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={
                searchType === 'orderId' 
                  ? 'Enter Order ID (e.g., 123)' 
                  : searchType === 'orderNumber' 
                  ? 'Enter Order Number' 
                  : 'Enter Tracking ID'
              }
              className="w-full px-4 py-3 rounded-lg focus:outline-none transition-all duration-200"
              style={{ 
                background: '#ffffff',
                border: '2px solid rgba(6, 182, 212, 0.3)',
                color: '#1f2937'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#06b6d4'
                e.target.style.boxShadow = '0 0 0 3px rgba(6, 182, 212, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(6, 182, 212, 0.3)'
                e.target.style.boxShadow = 'none'
              }}
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !searchValue.trim()}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Searching...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Track Order
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

