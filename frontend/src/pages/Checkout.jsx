import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { createOrder, getAddresses } from '../services/api'

export default function Checkout() {
  const { cart, getTotal, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Check if this is a direct purchase (Buy Now) without cart
  const directPurchase = location.state?.directPurchase || false
  const directPurchaseProduct = location.state?.product || null
  
  const [addresses, setAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [useCustomAddress, setUseCustomAddress] = useState(false)
  
  const [formData, setFormData] = useState({
    deliveryName: user?.name || '',
    deliveryEmail: user?.email || '',
    deliveryMobile: user?.mobile || '',
    deliveryAddress: '',
    deliveryPincode: '',
    deliveryCity: '',
    deliveryState: '',
    paymentMode: 'CASH_ON_DELIVERY'
  })
  
  const [loading, setLoading] = useState(false)
  const [loadingAddresses, setLoadingAddresses] = useState(true)

  // Load addresses on component mount
  useEffect(() => {
    loadAddresses()
  }, [])

  // Redirect if no items in cart and not a direct purchase
  useEffect(() => {
    if (!directPurchase && (!cart || cart.length === 0)) {
      navigate('/')
    }
  }, [cart, directPurchase, navigate])

  // Set default address when addresses are loaded
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId && !useCustomAddress) {
      const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0]
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id)
        applyAddressToForm(defaultAddress)
      }
    }
  }, [addresses, selectedAddressId, useCustomAddress])

  const loadAddresses = async () => {
    try {
      setLoadingAddresses(true)
      const response = await getAddresses()
      setAddresses(response.data || [])
    } catch (error) {
      console.error('Error loading addresses:', error)
    } finally {
      setLoadingAddresses(false)
    }
  }

  const applyAddressToForm = (address) => {
    setFormData(prev => ({
      ...prev,
      deliveryAddress: `${address.address}, ${address.city}, ${address.state} - ${address.pincode}`,
      deliveryPincode: address.pincode,
      deliveryCity: address.city,
      deliveryState: address.state
    }))
  }

  const handleAddressSelect = (addressId) => {
    setSelectedAddressId(addressId)
    setUseCustomAddress(false)
    const address = addresses.find(addr => addr.id === addressId)
    if (address) {
      applyAddressToForm(address)
    }
  }

  const handleUseCustomAddress = () => {
    setUseCustomAddress(true)
    setSelectedAddressId(null)
    setFormData(prev => ({
      ...prev,
      deliveryAddress: '',
      deliveryPincode: '',
      deliveryCity: '',
      deliveryState: ''
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // If using saved address, ensure all fields are populated
      let finalFormData = { ...formData }
      
      if (selectedAddressId && !useCustomAddress) {
        const selectedAddress = addresses.find(addr => addr.id === selectedAddressId)
        if (selectedAddress) {
          finalFormData = {
            ...finalFormData,
            deliveryAddress: `${selectedAddress.address}, ${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.pincode}`,
            deliveryPincode: selectedAddress.pincode
          }
        }
      }

      // Validate required fields
      if (!finalFormData.deliveryAddress || !finalFormData.deliveryPincode) {
        alert('Please select or enter a delivery address')
        setLoading(false)
        return
      }

      // Only send fields that are in OrderRequest DTO
      const orderData = {
        items: directPurchase && directPurchaseProduct
          ? [{
              productId: directPurchaseProduct.id,
              quantity: directPurchaseProduct.quantity
            }]
          : cart.map(item => ({
              productId: item.id,
              quantity: item.quantity
            })),
        deliveryName: finalFormData.deliveryName,
        deliveryEmail: finalFormData.deliveryEmail,
        deliveryMobile: finalFormData.deliveryMobile,
        deliveryAddress: finalFormData.deliveryAddress,
        deliveryPincode: finalFormData.deliveryPincode,
        paymentMode: finalFormData.paymentMode
      }
      
      console.log('📤 Sending order data:', orderData)

      const response = await createOrder(orderData)
      
      // Only clear cart if it was a cart-based order (not direct purchase)
      if (!directPurchase) {
        clearCart()
      }
      
      navigate(`/track/${response.data.id}`)
    } catch (error) {
      console.error('Order creation error:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Failed to place order. Please try again.'
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      alert(`Error: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Checkout
        </h1>
        <p className="text-gray-600">Complete your order details</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="card space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Delivery Information</h2>
              </div>
              <Link
                to="/profile?tab=addresses"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Manage Addresses
              </Link>
            </div>

            {/* Loading Addresses */}
            {loadingAddresses && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-center py-4">
                  <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="ml-2 text-gray-600">Loading saved addresses...</span>
                </div>
              </div>
            )}

            {/* Saved Addresses Selection */}
            {!loadingAddresses && addresses.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Select Delivery Address
                </label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      onClick={() => handleAddressSelect(address.id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedAddressId === address.id && !useCustomAddress
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">{address.label || 'Address'}</span>
                            {address.isDefault && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700">{address.address}</p>
                          <p className="text-sm text-gray-600">{address.city}, {address.state} - {address.pincode}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedAddressId === address.id && !useCustomAddress
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedAddressId === address.id && !useCustomAddress && (
                            <div className="w-3 h-3 rounded-full bg-white"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleUseCustomAddress}
                  className={`mt-3 w-full p-3 rounded-lg border-2 text-left transition-all ${
                    useCustomAddress
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">Use a different address</span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      useCustomAddress ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                    }`}>
                      {useCustomAddress && (
                        <div className="w-3 h-3 rounded-full bg-white"></div>
                      )}
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* Custom Address Form - Show only if useCustomAddress is true or no saved addresses */}
            {(useCustomAddress || addresses.length === 0) && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Enter Delivery Address</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="deliveryName"
                  value={formData.deliveryName}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="Enter your full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="deliveryEmail"
                  value={formData.deliveryEmail}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="your@email.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  name="deliveryMobile"
                  value={formData.deliveryMobile}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="10-digit mobile number"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pincode
                </label>
                <input
                  type="text"
                  name="deliveryPincode"
                  value={formData.deliveryPincode}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="6-digit pincode"
                />
              </div>
            </div>
            
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Delivery Address
                  </label>
                  <textarea
                    name="deliveryAddress"
                    value={formData.deliveryAddress}
                    onChange={handleChange}
                    required={useCustomAddress || addresses.length === 0}
                    rows="4"
                    className="input-field"
                    placeholder="Enter your complete delivery address"
                  />
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Payment Mode
              </label>
              <select
                name="paymentMode"
                value={formData.paymentMode}
                onChange={handleChange}
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
              >
                <option value="CASH_ON_DELIVERY" style={{ background: '#ffffff', color: '#1f2937' }}>Cash on Delivery</option>
                <option value="ONLINE" style={{ background: '#ffffff', color: '#1f2937' }}>Online Payment</option>
                <option value="UPI" style={{ background: '#ffffff', color: '#1f2937' }}>UPI</option>
                <option value="CARD" style={{ background: '#ffffff', color: '#1f2937' }}>Card</option>
              </select>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Placing Order...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Place Order
                </span>
              )}
            </button>
          </form>
        </div>
        
        <div className="lg:col-span-1">
          <div className="card sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Order Summary
            </h2>
            <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
              {directPurchase && directPurchaseProduct ? (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{directPurchaseProduct.name}</p>
                    <p className="text-xs text-gray-600">Qty: {directPurchaseProduct.quantity} × ₹{directPurchaseProduct.price}</p>
                  </div>
                  <span className="font-bold text-gray-900">₹{(directPurchaseProduct.price * directPurchaseProduct.quantity).toFixed(2)}</span>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                      <p className="text-xs text-gray-600">Qty: {item.quantity} × ₹{item.price}</p>
                    </div>
                    <span className="font-bold text-gray-900">₹{item.price * item.quantity}</span>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-gray-900">Total:</span>
                <span className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  ₹{directPurchase && directPurchaseProduct 
                    ? (directPurchaseProduct.price * directPurchaseProduct.quantity).toFixed(2)
                    : getTotal().toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

