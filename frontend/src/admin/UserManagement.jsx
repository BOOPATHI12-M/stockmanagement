import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { 
  getAllUsers, 
  getDeliveryMen, 
  createDeliveryMan, 
  updateDeliveryMan, 
  deleteDeliveryMan 
} from '../services/api'

export default function UserManagement() {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [deliveryMen, setDeliveryMen] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('users') // 'users' or 'delivery-men'
  const [showDeliveryForm, setShowDeliveryForm] = useState(false)
  const [deliveryFormData, setDeliveryFormData] = useState({
    username: '',
    password: '',
    email: '',
    name: '',
    mobile: ''
  })
  const [proofDocuments, setProofDocuments] = useState({
    aadhaarCard: null,
    panCard: null,
    drivingLicense: null
  })
  const [viewingProof, setViewingProof] = useState(null)
  const [proofImageUrl, setProofImageUrl] = useState(null)
  const [loadingImage, setLoadingImage] = useState(false)
  const [deliveryFormError, setDeliveryFormError] = useState('')
  const [deliveryFormSuccess, setDeliveryFormSuccess] = useState('')
  const [creatingDelivery, setCreatingDelivery] = useState(false)

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [usersResponse, deliveryMenResponse] = await Promise.all([
        getAllUsers(),
        getDeliveryMen()
      ])
      setUsers(usersResponse.data || [])
      setDeliveryMen(deliveryMenResponse.data || [])
    } catch (error) {
      console.error('Error loading data:', error)
      setError(error.response?.data?.error || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDeliveryMan = async (e) => {
    e.preventDefault()
    setDeliveryFormError('')
    setDeliveryFormSuccess('')
    setCreatingDelivery(true)

    try {
      // Create FormData for multipart/form-data
      const formData = new FormData()
      formData.append('username', deliveryFormData.username)
      formData.append('password', deliveryFormData.password)
      formData.append('email', deliveryFormData.email)
      formData.append('name', deliveryFormData.name)
      if (deliveryFormData.mobile) {
        formData.append('mobile', deliveryFormData.mobile)
      }
      
      // Append proof documents if provided
      if (proofDocuments.aadhaarCard) {
        formData.append('aadhaarCard', proofDocuments.aadhaarCard)
      }
      if (proofDocuments.panCard) {
        formData.append('panCard', proofDocuments.panCard)
      }
      if (proofDocuments.drivingLicense) {
        formData.append('drivingLicense', proofDocuments.drivingLicense)
      }
      
      await createDeliveryMan(formData)
      setDeliveryFormSuccess(`Delivery man "${deliveryFormData.username}" created successfully!`)
      setDeliveryFormData({
        username: '',
        password: '',
        email: '',
        name: '',
        mobile: ''
      })
      setProofDocuments({
        aadhaarCard: null,
        panCard: null,
        drivingLicense: null
      })
      setShowDeliveryForm(false)
      await loadData() // Reload delivery men list
    } catch (error) {
      console.error('Error creating delivery man:', error)
      const errorData = error.response?.data || {}
      const errorMessage = errorData.message || 
                          errorData.error || 
                          error.message || 
                          'Failed to create delivery man'
      setDeliveryFormError(errorMessage)
    } finally {
      setCreatingDelivery(false)
    }
  }
  
  const handleFileChange = (documentType, file) => {
    setProofDocuments({
      ...proofDocuments,
      [documentType]: file
    })
  }
  
  const getProofDocumentUrl = (url) => {
    if (!url) return null
    if (url.startsWith('http')) return url
    
    // Extract filename from URL if it contains the full path
    let filename = url
    if (url.includes('/proof-documents/')) {
      filename = url.substring(url.indexOf('/proof-documents/') + '/proof-documents/'.length)
    } else if (url.startsWith('/api/auth/admin/proof-documents/')) {
      filename = url.substring('/api/auth/admin/proof-documents/'.length)
    }
    
    // Construct the correct URL
    const baseUrl = import.meta.env.DEV ? '/api' : 'http://localhost:8080/api'
    return `${baseUrl}/auth/admin/proof-documents/${filename}`
  }
  
  const loadProofImage = async (url) => {
    if (!url) {
      setProofImageUrl(null)
      return
    }
    
    setLoadingImage(true)
    setProofImageUrl(null)
    
    try {
      const fullUrl = getProofDocumentUrl(url)
      if (!fullUrl) {
        setLoadingImage(false)
        return
      }
      
      // Fetch image with authentication
      const token = localStorage.getItem('token')
      const response = await fetch(fullUrl, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to load image: ${response.status}`)
      }
      
      const blob = await response.blob()
      const imageUrl = URL.createObjectURL(blob)
      setProofImageUrl(imageUrl)
    } catch (error) {
      console.error('Error loading proof image:', error)
      setProofImageUrl(null)
    } finally {
      setLoadingImage(false)
    }
  }
  
  // Load image when viewingProof changes
  useEffect(() => {
    if (viewingProof && viewingProof.url) {
      loadProofImage(viewingProof.url)
    } else {
      setProofImageUrl(null)
    }
  }, [viewingProof])
  
  // Cleanup blob URL when component unmounts
  useEffect(() => {
    return () => {
      if (proofImageUrl) {
        URL.revokeObjectURL(proofImageUrl)
      }
    }
  }, [proofImageUrl])

  const handleDeleteDeliveryMan = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete delivery man "${name}"?`)) {
      return
    }

    try {
      await deleteDeliveryMan(id)
      await loadData() // Reload delivery men list
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete delivery man')
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
          <p className="text-lg" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Loading user management...</p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="flex justify-center items-center h-screen" style={{ background: '#25252b' }}>
        <div className="text-center card max-w-md" style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
          <h3 className="text-xl font-semibold mb-2" style={{ color: '#fff' }}>Access Denied</h3>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>This page is only accessible to administrators.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#25252b' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold mb-2" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            User Management
          </h1>
          <p className="text-gray-300">Manage users and delivery personnel</p>
        </div>

        {error && (
          <div className="mb-6 card bg-red-900 bg-opacity-30 border-l-4 border-red-500" style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-red-300 font-semibold">Error</p>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
              <button
                onClick={loadData}
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
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'users'
                ? 'border-b-2 border-cyan-400 text-cyan-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('delivery-men')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'delivery-men'
                ? 'border-b-2 border-cyan-400 text-cyan-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Delivery Men ({deliveryMen.length})
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="card" style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6" style={{ color: '#fff' }}>All Users (Customers)</h2>
              
              {users.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-r from-cyan-700 to-blue-700 mb-6">
                    <svg className="h-12 w-12 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">No users found</h3>
                  <p className="text-gray-300">There are no registered customers yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 font-semibold" style={{ color: '#06b6d4' }}>ID</th>
                        <th className="text-left py-3 px-4 font-semibold" style={{ color: '#06b6d4' }}>Name</th>
                        <th className="text-left py-3 px-4 font-semibold" style={{ color: '#06b6d4' }}>Email</th>
                        <th className="text-left py-3 px-4 font-semibold" style={{ color: '#06b6d4' }}>Mobile</th>
                        <th className="text-left py-3 px-4 font-semibold" style={{ color: '#06b6d4' }}>Role</th>
                        <th className="text-left py-3 px-4 font-semibold" style={{ color: '#06b6d4' }}>Created At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((userItem) => (
                        <tr key={userItem.id} className="border-b border-gray-700 hover:bg-gray-800 transition-colors">
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 rounded font-mono font-semibold" style={{ background: 'rgba(6, 182, 212, 0.2)', color: '#06b6d4' }}>
                              #{userItem.id}
                            </span>
                          </td>
                          <td className="py-3 px-4" style={{ color: '#fff' }}>{userItem.name || 'N/A'}</td>
                          <td className="py-3 px-4" style={{ color: '#fff' }}>{userItem.email || 'N/A'}</td>
                          <td className="py-3 px-4" style={{ color: '#fff' }}>{userItem.mobile || 'N/A'}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 rounded text-xs font-semibold" style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#86efac' }}>
                              {userItem.role || 'CUSTOMER'}
                            </span>
                          </td>
                          <td className="py-3 px-4" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            {userItem.createdAt ? new Date(userItem.createdAt).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delivery Men Tab */}
        {activeTab === 'delivery-men' && (
          <div className="space-y-6">
            {/* Create Delivery Man Card */}
            <div className="card" style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold" style={{ color: '#fff' }}>Create Delivery Man</h2>
                  <button
                    onClick={() => {
                      setShowDeliveryForm(!showDeliveryForm)
                      setDeliveryFormError('')
                      setDeliveryFormSuccess('')
                    }}
                    className="btn-primary"
                    style={{ padding: '8px 16px', fontSize: '14px' }}
                  >
                    {showDeliveryForm ? 'Cancel' : 'Create New'}
                  </button>
                </div>
                
                {showDeliveryForm && (
                  <form onSubmit={handleCreateDeliveryMan} className="space-y-4">
                    {deliveryFormError && (
                      <div className="p-3 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                        <p style={{ color: '#fca5a5', fontSize: '14px' }}>{deliveryFormError}</p>
                      </div>
                    )}
                    
                    {deliveryFormSuccess && (
                      <div className="p-3 rounded-lg" style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                        <p style={{ color: '#86efac', fontSize: '14px' }}>{deliveryFormSuccess}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: '#fff' }}>Username *</label>
                        <input
                          type="text"
                          required
                          value={deliveryFormData.username}
                          onChange={(e) => setDeliveryFormData({...deliveryFormData, username: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg focus:outline-none transition-all duration-200"
                          style={{ background: 'rgba(255, 255, 255, 0.05)', border: '2px solid rgba(6, 182, 212, 0.3)', color: '#fff' }}
                          onFocus={(e) => { e.target.style.borderColor = '#06b6d4'; e.target.style.boxShadow = '0 0 0 3px rgba(6, 182, 212, 0.1)'; }}
                          onBlur={(e) => { e.target.style.borderColor = 'rgba(6, 182, 212, 0.3)'; e.target.style.boxShadow = 'none'; }}
                          placeholder="Enter username"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: '#fff' }}>Password *</label>
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={deliveryFormData.password}
                          onChange={(e) => setDeliveryFormData({...deliveryFormData, password: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg focus:outline-none transition-all duration-200"
                          style={{ background: 'rgba(255, 255, 255, 0.05)', border: '2px solid rgba(6, 182, 212, 0.3)', color: '#fff' }}
                          onFocus={(e) => { e.target.style.borderColor = '#06b6d4'; e.target.style.boxShadow = '0 0 0 3px rgba(6, 182, 212, 0.1)'; }}
                          onBlur={(e) => { e.target.style.borderColor = 'rgba(6, 182, 212, 0.3)'; e.target.style.boxShadow = 'none'; }}
                          placeholder="Min 6 characters"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: '#fff' }}>Email *</label>
                        <input
                          type="email"
                          required
                          value={deliveryFormData.email}
                          onChange={(e) => setDeliveryFormData({...deliveryFormData, email: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg focus:outline-none transition-all duration-200"
                          style={{ background: 'rgba(255, 255, 255, 0.05)', border: '2px solid rgba(6, 182, 212, 0.3)', color: '#fff' }}
                          onFocus={(e) => { e.target.style.borderColor = '#06b6d4'; e.target.style.boxShadow = '0 0 0 3px rgba(6, 182, 212, 0.1)'; }}
                          onBlur={(e) => { e.target.style.borderColor = 'rgba(6, 182, 212, 0.3)'; e.target.style.boxShadow = 'none'; }}
                          placeholder="Enter email"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: '#fff' }}>Name *</label>
                        <input
                          type="text"
                          required
                          value={deliveryFormData.name}
                          onChange={(e) => setDeliveryFormData({...deliveryFormData, name: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg focus:outline-none transition-all duration-200"
                          style={{ background: 'rgba(255, 255, 255, 0.05)', border: '2px solid rgba(6, 182, 212, 0.3)', color: '#fff' }}
                          onFocus={(e) => { e.target.style.borderColor = '#06b6d4'; e.target.style.boxShadow = '0 0 0 3px rgba(6, 182, 212, 0.1)'; }}
                          onBlur={(e) => { e.target.style.borderColor = 'rgba(6, 182, 212, 0.3)'; e.target.style.boxShadow = 'none'; }}
                          placeholder="Enter full name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: '#fff' }}>Mobile</label>
                        <input
                          type="text"
                          value={deliveryFormData.mobile}
                          onChange={(e) => setDeliveryFormData({...deliveryFormData, mobile: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg focus:outline-none transition-all duration-200"
                          style={{ background: 'rgba(255, 255, 255, 0.05)', border: '2px solid rgba(6, 182, 212, 0.3)', color: '#fff' }}
                          onFocus={(e) => { e.target.style.borderColor = '#06b6d4'; e.target.style.boxShadow = '0 0 0 3px rgba(6, 182, 212, 0.1)'; }}
                          onBlur={(e) => { e.target.style.borderColor = 'rgba(6, 182, 212, 0.3)'; e.target.style.boxShadow = 'none'; }}
                          placeholder="Enter mobile number"
                        />
                      </div>
                    </div>
                    
                    {/* Proof Documents Section */}
                    <div className="mt-6 pt-6 border-t border-gray-700">
                      <h3 className="text-lg font-semibold mb-4" style={{ color: '#fff' }}>Proof Documents</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-semibold mb-2" style={{ color: '#fff' }}>Aadhaar Card</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange('aadhaarCard', e.target.files[0])}
                            className="w-full px-4 py-2 rounded-lg focus:outline-none transition-all duration-200"
                            style={{ background: 'rgba(255, 255, 255, 0.05)', border: '2px solid rgba(6, 182, 212, 0.3)', color: '#fff' }}
                          />
                          {proofDocuments.aadhaarCard && (
                            <p className="text-xs mt-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                              Selected: {proofDocuments.aadhaarCard.name}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold mb-2" style={{ color: '#fff' }}>PAN Card</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange('panCard', e.target.files[0])}
                            className="w-full px-4 py-2 rounded-lg focus:outline-none transition-all duration-200"
                            style={{ background: 'rgba(255, 255, 255, 0.05)', border: '2px solid rgba(6, 182, 212, 0.3)', color: '#fff' }}
                          />
                          {proofDocuments.panCard && (
                            <p className="text-xs mt-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                              Selected: {proofDocuments.panCard.name}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold mb-2" style={{ color: '#fff' }}>Driving License</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange('drivingLicense', e.target.files[0])}
                            className="w-full px-4 py-2 rounded-lg focus:outline-none transition-all duration-200"
                            style={{ background: 'rgba(255, 255, 255, 0.05)', border: '2px solid rgba(6, 182, 212, 0.3)', color: '#fff' }}
                          />
                          {proofDocuments.drivingLicense && (
                            <p className="text-xs mt-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                              Selected: {proofDocuments.drivingLicense.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={creatingDelivery}
                      className="btn-primary w-full"
                    >
                      {creatingDelivery ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating...
                        </span>
                      ) : (
                        'Create Delivery Man'
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Delivery Men List */}
            <div className="card" style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-6" style={{ color: '#fff' }}>All Delivery Men</h2>
                
                {deliveryMen.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-r from-cyan-700 to-blue-700 mb-6">
                      <svg className="h-12 w-12 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No delivery men found</h3>
                    <p className="text-gray-300">Create a new delivery man using the form above.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-3 px-4 font-semibold" style={{ color: '#06b6d4' }}>ID</th>
                          <th className="text-left py-3 px-4 font-semibold" style={{ color: '#06b6d4' }}>Username</th>
                          <th className="text-left py-3 px-4 font-semibold" style={{ color: '#06b6d4' }}>Name</th>
                          <th className="text-left py-3 px-4 font-semibold" style={{ color: '#06b6d4' }}>Email</th>
                          <th className="text-left py-3 px-4 font-semibold" style={{ color: '#06b6d4' }}>Mobile</th>
                          <th className="text-left py-3 px-4 font-semibold" style={{ color: '#06b6d4' }}>Role</th>
                          <th className="text-left py-3 px-4 font-semibold" style={{ color: '#06b6d4' }}>Proof Documents</th>
                          <th className="text-left py-3 px-4 font-semibold" style={{ color: '#06b6d4' }}>Created At</th>
                          <th className="text-left py-3 px-4 font-semibold" style={{ color: '#06b6d4' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deliveryMen.map((deliveryMan) => (
                          <tr key={deliveryMan.id} className="border-b border-gray-700 hover:bg-gray-800 transition-colors">
                            <td className="py-3 px-4">
                              <span className="px-2 py-1 rounded font-mono font-semibold" style={{ background: 'rgba(6, 182, 212, 0.2)', color: '#06b6d4' }}>
                                #{deliveryMan.id}
                              </span>
                            </td>
                            <td className="py-3 px-4" style={{ color: '#fff' }}>{deliveryMan.username || 'N/A'}</td>
                            <td className="py-3 px-4" style={{ color: '#fff' }}>{deliveryMan.name || 'N/A'}</td>
                            <td className="py-3 px-4" style={{ color: '#fff' }}>{deliveryMan.email || 'N/A'}</td>
                            <td className="py-3 px-4" style={{ color: '#fff' }}>{deliveryMan.mobile || 'N/A'}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-1 rounded text-xs font-semibold" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }}>
                                {deliveryMan.role || 'DELIVERY_MAN'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-2">
                                {deliveryMan.aadhaarCardUrl && (
                                  <button
                                    onClick={() => setViewingProof({ type: 'Aadhaar Card', url: getProofDocumentUrl(deliveryMan.aadhaarCardUrl) })}
                                    className="px-2 py-1 rounded text-xs font-semibold transition-colors"
                                    style={{ background: 'rgba(6, 182, 212, 0.2)', color: '#06b6d4', border: '1px solid rgba(6, 182, 212, 0.3)' }}
                                    onMouseEnter={(e) => { e.target.style.background = 'rgba(6, 182, 212, 0.3)'; }}
                                    onMouseLeave={(e) => { e.target.style.background = 'rgba(6, 182, 212, 0.2)'; }}
                                  >
                                    Aadhaar
                                  </button>
                                )}
                                {deliveryMan.panCardUrl && (
                                  <button
                                    onClick={() => setViewingProof({ type: 'PAN Card', url: getProofDocumentUrl(deliveryMan.panCardUrl) })}
                                    className="px-2 py-1 rounded text-xs font-semibold transition-colors"
                                    style={{ background: 'rgba(6, 182, 212, 0.2)', color: '#06b6d4', border: '1px solid rgba(6, 182, 212, 0.3)' }}
                                    onMouseEnter={(e) => { e.target.style.background = 'rgba(6, 182, 212, 0.3)'; }}
                                    onMouseLeave={(e) => { e.target.style.background = 'rgba(6, 182, 212, 0.2)'; }}
                                  >
                                    PAN
                                  </button>
                                )}
                                {deliveryMan.drivingLicenseUrl && (
                                  <button
                                    onClick={() => setViewingProof({ type: 'Driving License', url: getProofDocumentUrl(deliveryMan.drivingLicenseUrl) })}
                                    className="px-2 py-1 rounded text-xs font-semibold transition-colors"
                                    style={{ background: 'rgba(6, 182, 212, 0.2)', color: '#06b6d4', border: '1px solid rgba(6, 182, 212, 0.3)' }}
                                    onMouseEnter={(e) => { e.target.style.background = 'rgba(6, 182, 212, 0.3)'; }}
                                    onMouseLeave={(e) => { e.target.style.background = 'rgba(6, 182, 212, 0.2)'; }}
                                  >
                                    License
                                  </button>
                                )}
                                {!deliveryMan.aadhaarCardUrl && !deliveryMan.panCardUrl && !deliveryMan.drivingLicenseUrl && (
                                  <span className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>No documents</span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                              {deliveryMan.createdAt ? new Date(deliveryMan.createdAt).toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 'N/A'}
                            </td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => handleDeleteDeliveryMan(deliveryMan.id, deliveryMan.name || deliveryMan.username)}
                                className="px-3 py-1 rounded-lg text-sm font-semibold transition-colors"
                                style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                                onMouseEnter={(e) => { e.target.style.background = 'rgba(239, 68, 68, 0.3)'; }}
                                onMouseLeave={(e) => { e.target.style.background = 'rgba(239, 68, 68, 0.2)'; }}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Proof Document Viewer Modal */}
      {viewingProof && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setViewingProof(null)}
        >
          <div 
            className="bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">{viewingProof.type}</h2>
                <p className="text-sm text-gray-400 mt-1">Proof Document</p>
              </div>
              <button
                onClick={() => setViewingProof(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-auto max-h-[calc(90vh-120px)] flex items-center justify-center">
              {loadingImage ? (
                <div className="text-center">
                  <svg className="animate-spin h-12 w-12 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ color: '#06b6d4' }}>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-gray-300">Loading image...</p>
                </div>
              ) : proofImageUrl ? (
                <img 
                  src={proofImageUrl} 
                  alt={viewingProof.type}
                  className="max-w-full max-h-[70vh] rounded-lg shadow-xl"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    const errorDiv = e.target.nextElementSibling
                    if (errorDiv) {
                      errorDiv.style.display = 'block'
                    }
                  }}
                />
              ) : (
                <div className="text-center">
                  <p className="text-red-400 mb-4">Failed to load image</p>
                  {viewingProof.url && (
                    <>
                      <p className="text-gray-400 text-sm mb-2">URL: {getProofDocumentUrl(viewingProof.url)}</p>
                      <a 
                        href={getProofDocumentUrl(viewingProof.url)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 underline"
                      >
                        Open in new tab
                      </a>
                    </>
                  )}
                </div>
              )}
              {proofImageUrl && (
                <div className="hidden text-center">
                  <p className="text-red-400 mb-4">Failed to load image</p>
                  <a 
                    href={getProofDocumentUrl(viewingProof.url)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 underline"
                  >
                    Open in new tab
                  </a>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-700 flex justify-end">
              <button
                onClick={() => setViewingProof(null)}
                className="px-6 py-2 rounded-lg font-semibold transition-colors"
                style={{ background: '#06b6d4', color: '#fff' }}
                onMouseEnter={(e) => { e.target.style.background = '#0891b2'; }}
                onMouseLeave={(e) => { e.target.style.background = '#06b6d4'; }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

