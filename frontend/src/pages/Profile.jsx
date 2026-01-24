import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { getMyOrders, getOrder, getProfile, updateProfile, changePassword, getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress, getMyReviews, deleteReview } from '../services/api'
import { Link } from 'react-router-dom'

export default function Profile() {
  const { user, login } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [addresses, setAddresses] = useState([])
  const [editingField, setEditingField] = useState(null)
  const [editValues, setEditValues] = useState({})
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)
  const [addressForm, setAddressForm] = useState({
    label: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false
  })
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showNameModal, setShowNameModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [nameData, setNameData] = useState({ name: '' })
  const [emailData, setEmailData] = useState({ email: '' })
  const [profilePhoto, setProfilePhoto] = useState(null)
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(user?.photoUrl || null)
  const [photoError, setPhotoError] = useState(false)
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loadingReviews, setLoadingReviews] = useState(false)
  const fileInputRef = useRef(null)

  const loadProfile = async () => {
    try {
      const response = await getProfile()
      if (response.data) {
        // Profile data is available, but user context should handle it
        // For now, we'll use the user from context
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      setMessage({ type: 'error', text: 'Failed to load profile. Please try again.' })
    }
  }

  const loadAddresses = async () => {
    try {
      const response = await getAddresses()
      setAddresses(response.data || [])
    } catch (error) {
      console.error('Error loading addresses:', error)
      // Don't show error message for addresses, just log it
    }
  }

  useEffect(() => {
    loadProfile()
    loadAddresses()
    // Only load orders for regular customers, not admin or delivery men
    if (user && user.role !== 'ADMIN' && user.role !== 'DELIVERY_MAN') {
      loadOrders() // Load orders on initial page load to show count
    } else if (user && (user.role === 'ADMIN' || user.role === 'DELIVERY_MAN')) {
      // Clear any order-related error messages for admin/delivery users
      setOrders([])
      if (message.text && message.text.includes('orders')) {
        setMessage({ type: '', text: '' })
      }
    }
  }, [user])

  useEffect(() => {
    if (activeTab === 'orders') {
      // Only reload orders for regular customers
      if (user && user.role !== 'ADMIN' && user.role !== 'DELIVERY_MAN') {
        loadOrders()
      }
    } else if (activeTab === 'reviews') {
      loadReviews()
    }
  }, [activeTab, user])

  const loadReviews = async () => {
    // Skip loading reviews for admin and delivery men
    if (user && (user.role === 'ADMIN' || user.role === 'DELIVERY_MAN')) {
      setReviews([])
      setLoadingReviews(false)
      return
    }

    setLoadingReviews(true)
    try {
      const response = await getMyReviews()
      console.log('⭐ Reviews loaded:', response.data)
      setReviews(response.data || [])
    } catch (error) {
      console.error('Error loading reviews:', error)
      setReviews([])
    } finally {
      setLoadingReviews(false)
    }
  }

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return
    }

    try {
      await deleteReview(reviewId)
      setMessage({ type: 'success', text: 'Review deleted successfully' })
      loadReviews() // Reload reviews
    } catch (error) {
      console.error('Error deleting review:', error)
      setMessage({ type: 'error', text: 'Failed to delete review. Please try again.' })
    }
  }

  const loadOrders = async () => {
    // Skip loading orders for admin and delivery men
    if (user && (user.role === 'ADMIN' || user.role === 'DELIVERY_MAN')) {
      setOrders([])
      setLoadingOrders(false)
      // Clear any previous error messages
      if (message.text && message.text.includes('Failed to load orders')) {
        setMessage({ type: '', text: '' })
      }
      return
    }

    setLoadingOrders(true)
    try {
      const response = await getMyOrders()
      console.log('📦 Orders loaded:', response.data)
      setOrders(response.data || [])
    } catch (error) {
      console.error('Error loading orders:', error)
      // Only show error message for regular customers
      if (user && user.role !== 'ADMIN' && user.role !== 'DELIVERY_MAN') {
        setMessage({ type: 'error', text: 'Failed to load orders. Please try again.' })
      }
    } finally {
      setLoadingOrders(false)
    }
  }

  const handleEdit = (field, currentValue) => {
    setEditingField(field)
    setEditValues({ [field]: currentValue || '' })
  }

  const handleSave = async (field) => {
    setSaving(true)
    setMessage({ type: '', text: '' })
    
    try {
      const updateData = { [field]: editValues[field] }
      console.log('📤 Sending update:', updateData)
      const response = await updateProfile(updateData)
      console.log('📥 Received response:', response.data)
      
      setMessage({ type: 'success', text: `${field === 'name' ? 'Name' : 'Phone number'} updated successfully!` })
      setEditingField(null)
      
      // Update local user data in auth context
      if (response.data?.user) {
        const updatedUser = response.data.user
        const token = localStorage.getItem('token')
        login(token, updatedUser)
        console.log('✅ Auth context updated with:', updatedUser)
      } else {
        console.warn('⚠️ No user data in response, reloading page')
        setTimeout(() => window.location.reload(), 1000)
      }
    } catch (error) {
      console.error('❌ Error updating profile:', error)
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || `Failed to update ${field}` 
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }
    
    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }
    
    setSaving(true)
    setMessage({ type: '', text: '' })
    
    try {
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })
      
      setMessage({ type: 'success', text: 'Password changed successfully!' })
      setShowPasswordModal(false)
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to change password' 
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChangeName = async () => {
    if (!nameData.name || nameData.name.trim().length === 0) {
      setMessage({ type: 'error', text: 'Name cannot be empty' })
      return
    }
    
    setSaving(true)
    setMessage({ type: '', text: '' })
    
    try {
      const response = await updateProfile({ name: nameData.name.trim() })
      console.log('📥 Name update response:', response.data)
      
      setMessage({ type: 'success', text: 'Name updated successfully!' })
      
      // Update local user data in auth context
      if (response.data?.user) {
        const updatedUser = response.data.user
        const token = localStorage.getItem('token')
        login(token, updatedUser)
        console.log('✅ Auth context updated with:', updatedUser)
      } else {
        // Reload profile to get updated data
        await loadProfile()
        setTimeout(() => window.location.reload(), 1000)
      }
      
      setShowNameModal(false)
      setNameData({ name: '' })
    } catch (error) {
      console.error('❌ Error updating name:', error)
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to update name' 
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChangeEmail = async () => {
    if (!emailData.email || emailData.email.trim().length === 0) {
      setMessage({ type: 'error', text: 'Email cannot be empty' })
      return
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailData.email.trim())) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' })
      return
    }
    
    setSaving(true)
    setMessage({ type: '', text: '' })
    
    try {
      const response = await updateProfile({ email: emailData.email.trim().toLowerCase() })
      console.log('📥 Email update response:', response.data)
      
      setMessage({ type: 'success', text: 'Email updated successfully! Please login again with your new email.' })
      
      // Update local user data in auth context
      if (response.data?.user) {
        const updatedUser = response.data.user
        const token = localStorage.getItem('token')
        login(token, updatedUser)
        console.log('✅ Auth context updated with:', updatedUser)
      } else {
        // Reload profile to get updated data
        await loadProfile()
        setTimeout(() => window.location.reload(), 1000)
      }
      
      setShowEmailModal(false)
      setEmailData({ email: '' })
    } catch (error) {
      console.error('❌ Error updating email:', error)
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to update email' 
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditingField(null)
    setEditValues({})
  }

  const handleAddAddress = () => {
    setEditingAddress(null)
    setAddressForm({
      label: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      isDefault: addresses.length === 0
    })
    setShowAddressModal(true)
  }

  const handleEditAddress = (address, index) => {
    setEditingAddress(index)
    setAddressForm({ 
      label: address.label || '',
      address: address.address || '',
      city: address.city || '',
      state: address.state || '',
      pincode: address.pincode || '',
      isDefault: address.isDefault || false
    })
    setShowAddressModal(true)
  }

  const handleSaveAddress = async () => {
    if (!addressForm.address || !addressForm.city || !addressForm.state || !addressForm.pincode) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' })
      return
    }

    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      if (editingAddress !== null) {
        // Update existing address
        const addressId = addresses[editingAddress].id
        const response = await updateAddress(addressId, addressForm)
        await loadAddresses() // Reload addresses from backend
        setMessage({ type: 'success', text: 'Address updated successfully!' })
      } else {
        // Add new address
        const response = await addAddress(addressForm)
        await loadAddresses() // Reload addresses from backend
        setMessage({ type: 'success', text: 'Address added successfully!' })
      }
      
      setShowAddressModal(false)
      setAddressForm({
        label: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        isDefault: false
      })
      setEditingAddress(null)
    } catch (error) {
      console.error('Error saving address:', error)
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to save address. Please try again.' 
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAddress = async (index) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        const addressId = addresses[index].id
        await deleteAddress(addressId)
        await loadAddresses() // Reload addresses from backend
        setMessage({ type: 'success', text: 'Address deleted successfully!' })
      } catch (error) {
        console.error('Error deleting address:', error)
        setMessage({ 
          type: 'error', 
          text: error.response?.data?.error || 'Failed to delete address. Please try again.' 
        })
      }
    }
  }

  const handleSetDefaultAddress = async (index) => {
    try {
      const addressId = addresses[index].id
      await setDefaultAddress(addressId)
      await loadAddresses() // Reload addresses from backend
      setMessage({ type: 'success', text: 'Default address updated!' })
    } catch (error) {
      console.error('Error setting default address:', error)
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to set default address. Please try again.' 
      })
    }
  }

  const handleViewDetails = (order) => {
    setSelectedOrder(order)
    setShowOrderDetails(true)
  }

  const handleDownloadInvoice = (order) => {
    // Generate invoice HTML
    const invoiceHTML = generateInvoiceHTML(order)
    
    // Create a blob and download
    const blob = new Blob([invoiceHTML], { type: 'text/html' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Invoice_${order.orderNumber || order.id || 'Order'}_${new Date().getTime()}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    // Also open in new window for printing
    const printWindow = window.open('', '_blank')
    printWindow.document.write(invoiceHTML)
    printWindow.document.close()
  }

  const generateInvoiceHTML = (order) => {
    const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : 'N/A'
    
    const items = order.items || order.orderItems || []
    
    // Calculate subtotal from line items
    const calculatedSubtotal = items.reduce((sum, item) => {
      const unitPrice = item.unitPrice || item.price || item.unit_price || 0
      const totalPrice = item.totalPrice || item.total || item.total_price || (unitPrice * (item.quantity || 1))
      return sum + parseFloat(totalPrice)
    }, 0)
    
    // Use order total if available, otherwise use calculated subtotal
    const totalAmount = order.totalAmount || order.total || calculatedSubtotal
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice - Order #${order.orderNumber || order.id}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    .header {
      border-bottom: 3px solid #4F46E5;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #4F46E5;
      margin: 0;
      font-size: 32px;
    }
    .company-info {
      margin-top: 20px;
      color: #666;
      font-size: 14px;
    }
    .invoice-details {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    .invoice-details div {
      flex: 1;
    }
    .invoice-details h3 {
      margin-top: 0;
      color: #333;
      font-size: 18px;
    }
    .invoice-details p {
      margin: 5px 0;
      color: #666;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    th {
      background: #4F46E5;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #eee;
    }
    tr:hover {
      background: #f9f9f9;
    }
    .total-section {
      text-align: right;
      margin-top: 20px;
    }
    .total-row {
      display: flex;
      justify-content: flex-end;
      padding: 10px 0;
    }
    .total-label {
      font-weight: 600;
      width: 150px;
      text-align: right;
      padding-right: 20px;
    }
    .total-amount {
      font-weight: 700;
      font-size: 20px;
      color: #4F46E5;
      width: 150px;
      text-align: right;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #eee;
      text-align: center;
      color: #999;
      font-size: 12px;
    }
    @media print {
      body {
        background: white;
      }
      .invoice-container {
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <h1>INVOICE</h1>
      <div class="company-info">
        <p><strong>Sudharshini Stock Management</strong></p>
        <p>Email: stockmanagement@sudharshini.in</p>
      </div>
    </div>
    
    <div class="invoice-details">
      <div>
        <h3>Bill To:</h3>
        <p><strong>${user?.name || 'Customer'}</strong></p>
        <p>${user?.email || ''}</p>
        <p>${user?.mobile || ''}</p>
        ${order.deliveryAddress ? `<p>${order.deliveryAddress}</p>` : ''}
      </div>
      <div>
        <h3>Invoice Details:</h3>
        <p><strong>Order Number:</strong> #${order.orderNumber || order.id || 'N/A'}</p>
        <p><strong>Order Date:</strong> ${orderDate}</p>
        <p><strong>Status:</strong> ${order.status ? order.status.replace(/_/g, ' ') : 'PENDING'}</p>
      </div>
    </div>
    
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>Quantity</th>
          <th>Unit Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => {
          // Try multiple field names for price (unitPrice, price, unit_price)
          const unitPrice = item.unitPrice || item.price || item.unit_price || 0
          const totalPrice = item.totalPrice || item.total || item.total_price || (unitPrice * (item.quantity || 1))
          const quantity = item.quantity || 1
          const itemName = item.productName || item.name || (item.product && item.product.name) || 'Product'
          
          return `
          <tr>
            <td>${itemName}</td>
            <td>${quantity}</td>
            <td>₹${parseFloat(unitPrice).toFixed(2)}</td>
            <td>₹${parseFloat(totalPrice).toFixed(2)}</td>
          </tr>
          `
        }).join('')}
      </tbody>
    </table>
    
    <div class="total-section">
      <div class="total-row">
        <div class="total-label">Subtotal:</div>
        <div class="total-amount">₹${parseFloat(totalAmount).toFixed(2)}</div>
      </div>
      <div class="total-row">
        <div class="total-label">Total:</div>
        <div class="total-amount">₹${parseFloat(totalAmount).toFixed(2)}</div>
      </div>
    </div>
    
    <div class="footer">
      <p>Thank you for your business!</p>
      <p>This is a computer-generated invoice and does not require a signature.</p>
    </div>
  </div>
</body>
</html>
    `
  }

  const handlePhotoClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) {
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          setMessage({ type: 'error', text: 'Image size should be less than 5MB' })
          return
        }
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          setMessage({ type: 'error', text: 'Please select a valid image file' })
          return
        }
        
        // Create preview URL
        const reader = new FileReader()
        reader.onload = (e) => {
          setProfilePhotoUrl(e.target.result)
          setPhotoError(false) // Reset error when new photo is selected
        }
        reader.readAsDataURL(file)
        
        setProfilePhoto(file)
        handlePhotoUpload(file)
      }
    }
    input.click()
  }

  const handlePhotoUpload = async (file) => {
    setSaving(true)
    setMessage({ type: '', text: '' })
    
    try {
      const formData = new FormData()
      formData.append('photo', file)
      
      // Upload photo using axios
      const token = localStorage.getItem('token')
      const response = await fetch('/api/auth/profile/photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to upload photo' }))
        throw new Error(errorData.error || 'Failed to upload photo')
      }
      
      const data = await response.json()
      
      // Update user context with new photo URL
      if (data.user) {
        login(token, data.user)
        setProfilePhotoUrl(data.user.photoUrl)
        setPhotoError(false) // Reset error on successful upload
      }
      
      setMessage({ type: 'success', text: 'Profile photo updated successfully!' })
    } catch (error) {
      console.error('Error uploading photo:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to upload photo. Please try again.' })
      // Reset preview on error
      setProfilePhotoUrl(user?.photoUrl || null)
      setProfilePhoto(null)
    } finally {
      setSaving(false)
    }
  }
  
  useEffect(() => {
    if (user?.photoUrl) {
      setProfilePhotoUrl(user.photoUrl)
      setPhotoError(false) // Reset error when user data loads
    }
  }, [user])

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤', color: 'from-blue-500 to-cyan-500' },
    { id: 'orders', label: 'Orders', icon: '📦', color: 'from-purple-500 to-pink-500' },
    { id: 'addresses', label: 'Addresses', icon: '📍', color: 'from-green-500 to-emerald-500' },
    { id: 'security', label: 'Security', icon: '🔒', color: 'from-orange-500 to-red-500' },
    { id: 'reviews', label: 'Reviews', icon: '⭐', color: 'from-yellow-500 to-amber-500' },
    { id: 'support', label: 'Support', icon: '💬', color: 'from-teal-500 to-cyan-500' }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'DELIVERED': return 'bg-green-100 text-green-800 border-green-200'
      case 'OUT_FOR_DELIVERY': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'SHIPPED': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'ACCEPTED': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'PICKED_UP': return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Profile Summary */}
        <div className="mb-8">
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Profile Avatar */}
              <div className="relative">
                {(profilePhotoUrl || user?.photoUrl) && !photoError ? (
                  <div className="w-32 h-32 rounded-full overflow-hidden shadow-2xl ring-4 ring-white">
                    <img 
                      src={profilePhotoUrl || user?.photoUrl || ''} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                      onError={() => setPhotoError(true)}
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-5xl font-bold shadow-2xl ring-4 ring-white">
                    {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                <button 
                  onClick={handlePhotoClick}
                  disabled={saving}
                  className="absolute bottom-0 right-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-600 transition-all transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Change profile photo"
                >
                  {saving ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* User Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  {user?.name || 'User'}
                </h1>
                <p className="text-gray-600 text-lg mb-4">{user?.email}</p>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{user?.mobile || 'Not set'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="capitalize">{user?.role?.toLowerCase().replace('_', ' ') || 'Customer'}</span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <button 
                  onClick={() => setActiveTab('orders')}
                  className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 text-center border border-blue-200 hover:from-blue-100 hover:to-blue-200 transition-all cursor-pointer"
                >
                  <div className="text-2xl font-bold text-blue-600">{orders.length}</div>
                  <div className="text-sm text-blue-700 font-medium">Orders</div>
                </button>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 text-center border border-green-200 col-span-2 md:col-span-1">
                  <div className="text-2xl font-bold text-green-600">{addresses.length}</div>
                  <div className="text-sm text-green-700 font-medium">Addresses</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-slate-800 via-purple-900 to-indigo-900 rounded-2xl shadow-xl p-2 border border-purple-500/30 sticky top-4">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center group ${
                      activeTab === tab.id
                        ? `bg-gradient-to-r ${tab.color} text-white shadow-lg transform scale-105`
                        : 'text-gray-200 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="mr-3 text-xl">{tab.icon}</span>
                    <span className="font-medium">{tab.label}</span>
                    {activeTab === tab.id && (
                      <svg className="w-5 h-5 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100">
              {/* Message Alert */}
              {message.text && (
                <div className={`mb-6 p-4 rounded-lg ${
                  message.type === 'success' 
                    ? 'bg-green-500 border-2 border-green-600 text-white font-semibold shadow-lg' 
                    : message.type === 'info'
                    ? 'bg-blue-500 border-2 border-blue-600 text-white font-semibold shadow-lg'
                    : 'bg-red-500 border-2 border-red-600 text-white font-semibold shadow-lg'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {message.type === 'success' && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      {message.text}
                    </span>
                    <button onClick={() => setMessage({ type: '', text: '' })} className="text-white hover:text-gray-200 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Profile Information */}
              {activeTab === 'profile' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-3xl font-bold text-gray-900">Profile Information</h2>
                  </div>
                  
                  <div className="space-y-6">
                    {/* User Name */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
                      <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">User Name</label>
                      {editingField === 'name' ? (
                        <div className="flex items-center gap-3">
                          <input
                            type="text"
                            value={editValues.name || user?.name || ''}
                            onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                            className="flex-1 px-4 py-3 bg-white/80 border-2 border-purple-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSave('name')}
                            disabled={saving}
                            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold shadow-md transition-all disabled:opacity-50"
                          >
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={handleCancel}
                            className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <p className="text-xl text-gray-900 font-medium">{user?.name || 'Not set'}</p>
                          <button
                            onClick={() => handleEdit('name', user?.name)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium shadow-md transition-all flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Email ID */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                      <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Email ID</label>
                      <div className="flex items-center justify-between">
                        <p className="text-xl text-gray-900 font-medium">{user?.email || 'Not set'}</p>
                        <span className="px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-xs font-semibold">Verified</span>
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                      <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Phone Number</label>
                      {editingField === 'mobile' ? (
                        <div className="flex items-center gap-3">
                          <input
                            type="tel"
                            value={editValues.mobile || user?.mobile || ''}
                            onChange={(e) => setEditValues({ ...editValues, mobile: e.target.value })}
                            className="flex-1 px-4 py-3 bg-white/80 border-2 border-purple-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSave('mobile')}
                            disabled={saving}
                            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold shadow-md transition-all disabled:opacity-50"
                          >
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={handleCancel}
                            className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <p className="text-xl text-gray-900 font-medium">{user?.mobile || 'Not set'}</p>
                          <button
                            onClick={() => handleEdit('mobile', user?.mobile)}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium shadow-md transition-all flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Default Delivery Address */}
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-100">
                      <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Default Delivery Address</label>
                      {(() => {
                        const defaultAddress = addresses.find(addr => addr.isDefault)
                        return defaultAddress ? (
                          <div>
                            <div className="mb-3">
                              <p className="text-lg font-semibold text-gray-900">{defaultAddress.label || 'Default Address'}</p>
                              <p className="text-gray-700">{defaultAddress.address}</p>
                              <p className="text-gray-600 text-sm">{defaultAddress.city}, {defaultAddress.state} - {defaultAddress.pincode}</p>
                            </div>
                            <button
                              onClick={() => setActiveTab('addresses')}
                              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium shadow-md transition-all flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Manage Addresses
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <p className="text-lg text-gray-700">No default address set</p>
                            <button
                              onClick={handleAddAddress}
                              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium shadow-md transition-all flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              Add Address
                            </button>
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Your Orders */}
              {activeTab === 'orders' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-3xl font-bold text-gray-900">Your Orders</h2>
                    <div className="text-sm text-gray-500">Total: {orders.length} orders</div>
                  </div>
                  {loadingOrders ? (
                    <div className="text-center py-16">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                      <p className="text-gray-600 mt-4">Loading orders...</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                      {user && (user.role === 'ADMIN' || user.role === 'DELIVERY_MAN') ? (
                        <>
                          <p className="text-gray-600 text-lg mb-2">
                            {user.role === 'ADMIN' 
                              ? 'Orders are managed in the Admin Dashboard' 
                              : 'Orders are managed in the Delivery Dashboard'}
                          </p>
                          <Link 
                            to={user.role === 'ADMIN' ? '/admin/dashboard' : '/delivery'} 
                            className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold shadow-md transition-all"
                          >
                            Go to Dashboard
                          </Link>
                        </>
                      ) : (
                        <>
                          <p className="text-gray-600 text-lg mb-2">No orders yet</p>
                          <Link to="/" className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold shadow-md transition-all">
                            Start Shopping
                          </Link>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id || order.orderId} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 mb-1">
                                Order #{order.orderNumber || order.id || order.orderId || 'N/A'}
                              </h3>
                              <p className="text-sm text-gray-600">
                                Placed on {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                }) : 'N/A'}
                              </p>
                            </div>
                            <span className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${getStatusColor(order.status)}`}>
                              {order.status ? order.status.replace(/_/g, ' ') : 'PENDING'}
                            </span>
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                              <p className="text-2xl font-bold text-gray-900">
                                ₹{order.totalAmount ? parseFloat(order.totalAmount).toFixed(2) : (order.total ? parseFloat(order.total).toFixed(2) : '0.00')}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Items</p>
                              <p className="text-lg font-semibold text-gray-900">
                                {order.items ? (Array.isArray(order.items) ? order.items.length : 0) : (order.orderItems ? (Array.isArray(order.orderItems) ? order.orderItems.length : 0) : 0)} item(s)
                              </p>
                            </div>
                          </div>
                          
                          {/* Order Items List */}
                          {order.items && Array.isArray(order.items) && order.items.length > 0 && (
                            <div className="mb-4 pt-4 border-t border-gray-200">
                              <p className="text-sm font-semibold text-gray-700 mb-2">Order Items:</p>
                              <div className="space-y-2">
                                {order.items.map((item, idx) => {
                                  const unitPrice = item.unitPrice || item.price || item.unit_price || 0
                                  const totalPrice = item.totalPrice || item.total || item.total_price || (unitPrice * (item.quantity || 1))
                                  const itemName = item.productName || item.name || (item.product && item.product.name) || 'Product'
                                  return (
                                    <div key={idx} className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-100">
                                      <div className="flex-1">
                                        <p className="font-medium text-gray-900">{itemName}</p>
                                        <p className="text-sm text-gray-600">Quantity: {item.quantity || 1} × ₹{parseFloat(unitPrice).toFixed(2)}</p>
                                      </div>
                                      <p className="font-semibold text-gray-900">₹{parseFloat(totalPrice).toFixed(2)}</p>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                          
                          {order.orderItems && Array.isArray(order.orderItems) && order.orderItems.length > 0 && (
                            <div className="mb-4 pt-4 border-t border-gray-200">
                              <p className="text-sm font-semibold text-gray-700 mb-2">Order Items:</p>
                              <div className="space-y-2">
                                {order.orderItems.map((item, idx) => {
                                  const unitPrice = item.unitPrice || item.price || item.unit_price || 0
                                  const totalPrice = item.totalPrice || item.total || item.total_price || (unitPrice * (item.quantity || 1))
                                  const itemName = item.productName || item.name || (item.product && item.product.name) || 'Product'
                                  return (
                                    <div key={idx} className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-100">
                                      <div className="flex-1">
                                        <p className="font-medium text-gray-900">{itemName}</p>
                                        <p className="text-sm text-gray-600">Quantity: {item.quantity || 1} × ₹{parseFloat(unitPrice).toFixed(2)}</p>
                                      </div>
                                      <p className="font-semibold text-gray-900">₹{parseFloat(totalPrice).toFixed(2)}</p>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                            <Link
                              to={`/track/${order.id}`}
                              className="px-5 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold shadow-md transition-all flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              Track Order
                            </Link>
                            <button 
                              onClick={() => handleViewDetails(order)}
                              className="px-5 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold shadow-md transition-all flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View Details
                            </button>
                            <button 
                              onClick={() => handleDownloadInvoice(order)}
                              className="px-5 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold shadow-md transition-all flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Invoice
                            </button>
                            {order.status === 'DELIVERED' && (
                              <button className="px-5 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-semibold shadow-md transition-all flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Return
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Your Addresses */}
              {activeTab === 'addresses' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-3xl font-bold text-gray-900">Your Addresses</h2>
                    <button 
                      onClick={handleAddAddress}
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 font-semibold shadow-lg transition-all flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add New Address
                    </button>
                  </div>
                  {addresses.length === 0 ? (
                    <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border-2 border-dashed border-gray-300">
                      <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-600 text-lg mb-2">No addresses saved</p>
                      <p className="text-sm text-gray-500 mb-4">Add an address to get started with faster checkout</p>
                      <button 
                        onClick={handleAddAddress}
                        className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold shadow-md transition-all"
                      >
                        Add Your First Address
                      </button>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {addresses.map((address, index) => (
                        <div key={address.id || index} className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border-2 border-gray-200 hover:border-green-400 transition-all hover:shadow-lg">
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-bold text-gray-900">{address.label || 'Home'}</h3>
                            {address.isDefault && (
                              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Default</span>
                            )}
                          </div>
                          <p className="text-gray-700 mb-2">{address.address}</p>
                          <p className="text-gray-600 text-sm">{address.city}, {address.state} - {address.pincode}</p>
                          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                            <button 
                              onClick={() => handleEditAddress(address, index)}
                              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium text-sm transition-all"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteAddress(index)}
                              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium text-sm transition-all"
                            >
                              Delete
                            </button>
                            {!address.isDefault && (
                              <button 
                                onClick={() => handleSetDefaultAddress(index)}
                                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium text-sm transition-all"
                              >
                                Set Default
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Login & Security */}
              {activeTab === 'security' && (
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Login & Security</h2>
                  
                  <div className="space-y-4">
                    {[
                      { title: 'Change Name', desc: 'Update your display name', icon: '👤', color: 'from-blue-500 to-cyan-500' },
                      { title: 'Change Email', desc: 'Update your email address', icon: '📧', color: 'from-purple-500 to-pink-500' },
                      { title: 'Change Password', desc: 'Update your account password', icon: '🔑', color: 'from-orange-500 to-red-500' }
                    ].map((item, index) => (
                      <div key={index} className="bg-gradient-to-r from-white to-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-2xl`}>
                              {item.icon}
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                              <p className="text-sm text-gray-600">{item.desc}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => {
                              if (item.title === 'Change Password') {
                                setShowPasswordModal(true)
                                setMessage({ type: '', text: '' })
                              } else if (item.title === 'Change Name') {
                                setNameData({ name: user?.name || '' })
                                setShowNameModal(true)
                                setMessage({ type: '', text: '' })
                              } else if (item.title === 'Change Email') {
                                setEmailData({ email: user?.email || '' })
                                setShowEmailModal(true)
                                setMessage({ type: '', text: '' })
                              }
                            }}
                            className={`px-6 py-3 bg-gradient-to-r ${item.color} text-white rounded-lg hover:shadow-lg font-semibold transition-all`}
                          >
                            Change
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews & Ratings */}
              {activeTab === 'reviews' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-3xl font-bold text-gray-900">Your Reviews & Ratings</h2>
                    <div className="text-sm text-gray-500">Total: {reviews.length} review{reviews.length !== 1 ? 's' : ''}</div>
                  </div>
                  
                  {loadingReviews ? (
                    <div className="text-center py-16">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-yellow-500 border-t-transparent"></div>
                      <p className="text-gray-600 mt-4">Loading reviews...</p>
                    </div>
                  ) : reviews.length === 0 ? (
                    <div className="text-center py-16 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl border-2 border-dashed border-yellow-300">
                      <div className="w-24 h-24 mx-auto mb-4 bg-yellow-200 rounded-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      </div>
                      <p className="text-gray-600 text-lg mb-2">No reviews yet</p>
                      <p className="text-sm text-gray-500 mb-4">Your product reviews will appear here</p>
                      <Link to="/" className="inline-block px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-semibold shadow-md transition-all">
                        Browse Products
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {reviews.map((review) => (
                        <div key={review.id} className="bg-gradient-to-r from-white to-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            {/* Product Info */}
                            <div className="flex items-start gap-4 flex-1">
                              {review.product?.imageUrl && (
                                <img 
                                  src={review.product.imageUrl} 
                                  alt={review.product.name}
                                  className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                                  onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/80?text=No+Image'
                                  }}
                                />
                              )}
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 mb-2">
                                  {review.product?.name || 'Product'}
                                </h3>
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="flex items-center">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <svg
                                        key={star}
                                        className={`w-5 h-5 ${star <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                      </svg>
                                    ))}
                                  </div>
                                  <span className="text-sm font-semibold text-gray-700">{review.rating}/5</span>
                                </div>
                                <p className="text-gray-700 mb-2">{review.comment}</p>
                                <p className="text-xs text-gray-500">
                                  Reviewed on {review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  }) : 'N/A'}
                                </p>
                              </div>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              <Link
                                to={`/product/${review.product?.id}`}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold text-sm transition-all"
                              >
                                View Product
                              </Link>
                              <button
                                onClick={() => handleDeleteReview(review.id)}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold text-sm transition-all"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Customer Support */}
              {activeTab === 'support' && (
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Customer Support</h2>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      { title: 'Help Center', desc: 'Find answers to common questions', icon: '📚', color: 'from-blue-500 to-cyan-500', action: 'Visit' },
                      { title: 'Returns & Refunds', desc: 'Manage your returns and refunds', icon: '↩️', color: 'from-purple-500 to-pink-500', action: 'View' },
                      { title: 'Chat with Support', desc: 'Get instant help from our team', icon: '💬', color: 'from-green-500 to-emerald-500', action: 'Start Chat' },
                      { title: 'Contact Us', desc: 'Email: support@sudharshini.in', icon: '📧', color: 'from-orange-500 to-red-500', action: 'Contact' }
                    ].map((item, index) => (
                      <div key={index} className={`bg-gradient-to-br ${item.color} rounded-xl p-6 text-white hover:shadow-xl transition-all cursor-pointer transform hover:scale-105`}>
                        <div className="text-4xl mb-3">{item.icon}</div>
                        <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                        <p className="text-white/90 text-sm mb-4">{item.desc}</p>
                        <button className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 font-semibold transition-all">
                          {item.action}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {editingAddress !== null ? 'Edit Address' : 'Add New Address'}
              </h3>
              <button
                onClick={() => {
                  setShowAddressModal(false)
                  setAddressForm({
                    label: '',
                    address: '',
                    city: '',
                    state: '',
                    pincode: '',
                    isDefault: false
                  })
                  setEditingAddress(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Label (e.g., Home, Office)</label>
                <input
                  type="text"
                  value={addressForm.label}
                  onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                  className="w-full px-4 py-3 bg-white/80 border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all text-gray-900 placeholder:text-gray-400"
                  placeholder="Home"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Address *</label>
                <textarea
                  value={addressForm.address}
                  onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                  className="w-full px-4 py-3 bg-white/80 border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all resize-none text-gray-900 placeholder:text-gray-400"
                  placeholder="Street address, apartment, suite, etc."
                  rows="3"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">City *</label>
                  <input
                    type="text"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full px-4 py-3 bg-white/80 border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all text-gray-900 placeholder:text-gray-400"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">State *</label>
                  <input
                    type="text"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    className="w-full px-4 py-3 bg-white/80 border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all text-gray-900 placeholder:text-gray-400"
                    placeholder="State"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Pincode *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={addressForm.pincode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                    setAddressForm({ ...addressForm, pincode: value })
                  }}
                  className="w-full px-4 py-3 bg-white/80 border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all text-gray-900 placeholder:text-gray-400"
                  placeholder="Enter 6-digit pincode"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="w-4 h-4 text-purple-500 rounded focus:ring-purple-500 accent-purple-500"
                />
                <label htmlFor="isDefault" className="text-sm font-medium text-gray-700">
                  Set as default address
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveAddress}
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : (editingAddress !== null ? 'Update Address' : 'Save Address')}
                </button>
                <button
                  onClick={() => {
                    setShowAddressModal(false)
                    setAddressForm({
                      label: '',
                      address: '',
                      city: '',
                      state: '',
                      pincode: '',
                      isDefault: false
                    })
                    setEditingAddress(null)
                  }}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Name Modal */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Change Name</h3>
              <button
                onClick={() => {
                  setShowNameModal(false)
                  setNameData({ name: '' })
                  setMessage({ type: '', text: '' })
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Name</label>
                <input
                  type="text"
                  value={nameData.name}
                  onChange={(e) => setNameData({ name: e.target.value })}
                  className="w-full px-4 py-3 bg-white/80 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all text-gray-900 placeholder:text-gray-400"
                  placeholder="Enter your new name"
                  autoFocus
                />
              </div>

              {message.text && (
                <div className={`p-3 rounded-lg ${
                  message.type === 'success' 
                    ? 'bg-green-500 text-white font-semibold shadow-md' 
                    : message.type === 'info'
                    ? 'bg-blue-500 text-white font-semibold shadow-md'
                    : 'bg-red-500 text-white font-semibold shadow-md'
                }`}>
                  <div className="flex items-center gap-2">
                    {message.type === 'success' && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {message.text}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleChangeName}
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold shadow-md transition-all disabled:opacity-50"
                >
                  {saving ? 'Updating...' : 'Update Name'}
                </button>
                <button
                  onClick={() => {
                    setShowNameModal(false)
                    setNameData({ name: '' })
                    setMessage({ type: '', text: '' })
                  }}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Change Email</h3>
              <button
                onClick={() => {
                  setShowEmailModal(false)
                  setEmailData({ email: '' })
                  setMessage({ type: '', text: '' })
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Current Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-lg text-gray-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Email</label>
                <input
                  type="email"
                  value={emailData.email}
                  onChange={(e) => setEmailData({ email: e.target.value })}
                  className="w-full px-4 py-3 bg-white/80 border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all text-gray-900 placeholder:text-gray-400"
                  placeholder="Enter your new email address"
                  autoFocus
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> After changing your email, you may need to login again with your new email address.
                </p>
              </div>

              {message.text && (
                <div className={`p-3 rounded-lg ${
                  message.type === 'success' 
                    ? 'bg-green-500 text-white font-semibold shadow-md' 
                    : message.type === 'info'
                    ? 'bg-blue-500 text-white font-semibold shadow-md'
                    : 'bg-red-500 text-white font-semibold shadow-md'
                }`}>
                  <div className="flex items-center gap-2">
                    {message.type === 'success' && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {message.text}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleChangeEmail}
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-semibold shadow-md transition-all disabled:opacity-50"
                >
                  {saving ? 'Updating...' : 'Update Email'}
                </button>
                <button
                  onClick={() => {
                    setShowEmailModal(false)
                    setEmailData({ email: '' })
                    setMessage({ type: '', text: '' })
                  }}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Change Password</h3>
              <button
                onClick={() => {
                  setShowPasswordModal(false)
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
                  setMessage({ type: '', text: '' })
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-white/80 border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all text-gray-900 placeholder:text-gray-400"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-white/80 border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all text-gray-900 placeholder:text-gray-400"
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-white/80 border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all text-gray-900 placeholder:text-gray-400"
                  placeholder="Confirm new password"
                />
              </div>

              {message.text && (
                <div className={`p-3 rounded-lg ${
                  message.type === 'success' 
                    ? 'bg-green-500 text-white font-semibold shadow-md' 
                    : message.type === 'info'
                    ? 'bg-blue-500 text-white font-semibold shadow-md'
                    : 'bg-red-500 text-white font-semibold shadow-md'
                }`}>
                  <div className="flex items-center gap-2">
                    {message.type === 'success' && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {message.text}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleChangePassword}
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold shadow-md transition-all disabled:opacity-50"
                >
                  {saving ? 'Changing...' : 'Change Password'}
                </button>
                <button
                  onClick={() => {
                    setShowPasswordModal(false)
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
                    setMessage({ type: '', text: '' })
                  }}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-2xl font-bold">Order Details</h2>
              <button
                onClick={() => {
                  setShowOrderDetails(false)
                  setSelectedOrder(null)
                }}
                className="text-white hover:text-gray-200 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {/* Order Header */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">Order Information</h3>
                  <p className="text-lg font-bold text-gray-900">Order #{selectedOrder.orderNumber || selectedOrder.id || 'N/A'}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Placed on: {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'N/A'}
                  </p>
                  <div className="mt-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status ? selectedOrder.status.replace(/_/g, ' ') : 'PENDING'}
                    </span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">Payment Information</h3>
                  <p className="text-3xl font-bold text-green-600">
                    ₹{selectedOrder.totalAmount ? parseFloat(selectedOrder.totalAmount).toFixed(2) : (selectedOrder.total ? parseFloat(selectedOrder.total).toFixed(2) : '0.00')}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Total Amount</p>
                </div>
              </div>

              {/* Delivery Address */}
              {selectedOrder.deliveryAddress && (
                <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Delivery Address</h3>
                  <p className="text-gray-900">{selectedOrder.deliveryAddress}</p>
                </div>
              )}

              {/* Order Items */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Order Items</h3>
                <div className="space-y-3">
                  {(selectedOrder.items || selectedOrder.orderItems || []).length === 0 ? (
                    <p className="text-gray-500">No items found</p>
                  ) : (
                    (selectedOrder.items || selectedOrder.orderItems || []).map((item, idx) => {
                      const unitPrice = item.unitPrice || item.price || item.unit_price || 0
                      const totalPrice = item.totalPrice || item.total || item.total_price || (unitPrice * (item.quantity || 1))
                      const itemName = item.productName || item.name || (item.product && item.product.name) || 'Product'
                      return (
                        <div key={item.id || idx} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 border border-gray-200 flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 text-lg">{itemName}</p>
                            <p className="text-sm text-gray-600 mt-1">Quantity: {item.quantity || 1} × ₹{parseFloat(unitPrice).toFixed(2)}</p>
                            {item.productDescription && (
                              <p className="text-sm text-gray-500 mt-1">{item.productDescription}</p>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-lg font-bold text-gray-900">
                              ₹{parseFloat(totalPrice).toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-600">
                              Unit: ₹{parseFloat(unitPrice).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal:</span>
                    <span className="font-semibold">₹{selectedOrder.totalAmount ? parseFloat(selectedOrder.totalAmount).toFixed(2) : (selectedOrder.total ? parseFloat(selectedOrder.total).toFixed(2) : '0.00')}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Shipping:</span>
                    <span className="font-semibold">Free</span>
                  </div>
                  <div className="border-t border-purple-300 pt-2 mt-2">
                    <div className="flex justify-between text-xl font-bold text-gray-900">
                      <span>Total:</span>
                      <span className="text-purple-600">₹{selectedOrder.totalAmount ? parseFloat(selectedOrder.totalAmount).toFixed(2) : (selectedOrder.total ? parseFloat(selectedOrder.total).toFixed(2) : '0.00')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200">
                <Link
                  to={`/track/${selectedOrder.id}`}
                  className="px-5 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold shadow-md transition-all flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Track Order
                </Link>
                <button
                  onClick={() => handleDownloadInvoice(selectedOrder)}
                  className="px-5 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold shadow-md transition-all flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Invoice
                </button>
                {selectedOrder.status === 'DELIVERED' && (
                  <button className="px-5 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-semibold shadow-md transition-all flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Return/Replace
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
