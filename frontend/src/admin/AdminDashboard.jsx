import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSummary, getAllOrders, createDeliveryMan } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function AdminDashboard() {
  const { isAdmin, user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [revenueData, setRevenueData] = useState([])
  const [showDeliveryForm, setShowDeliveryForm] = useState(false)
  const [deliveryFormData, setDeliveryFormData] = useState({
    username: '',
    password: '',
    email: '',
    name: '',
    mobile: ''
  })
  const [deliveryFormError, setDeliveryFormError] = useState('')
  const [deliveryFormSuccess, setDeliveryFormSuccess] = useState('')
  const [creatingDelivery, setCreatingDelivery] = useState(false)
  const [showLowStockModal, setShowLowStockModal] = useState(false)
  const [showNearExpiryModal, setShowNearExpiryModal] = useState(false)

  useEffect(() => {
    loadSummary()
    if (isAdmin && isAdmin()) {
      loadOrders()
    }
  }, [isAdmin])

  const loadSummary = async () => {
    try {
      const response = await getSummary()
      setSummary(response.data)
    } catch (error) {
      console.error('Error loading summary:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadOrders = async () => {
    try {
      const response = await getAllOrders()
      setOrders(response.data || [])
      calculateRevenueData(response.data || [])
    } catch (error) {
      console.error('Error loading orders:', error)
    }
  }

  const calculateRevenueData = (orderList) => {
    // Group orders by month and calculate revenue
    const monthlyRevenue = {}
    
    orderList.forEach(order => {
      if (order.status === 'DELIVERED' && order.totalAmount) {
        const date = new Date(order.createdAt)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        
        if (!monthlyRevenue[monthKey]) {
          monthlyRevenue[monthKey] = { revenue: 0, count: 0 }
        }
        monthlyRevenue[monthKey].revenue += order.totalAmount
        monthlyRevenue[monthKey].count += 1
      }
    })
    
    // Generate last 6 months
    const now = new Date()
    const last6Months = []
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      
      if (monthlyRevenue[monthKey]) {
        last6Months.push({
          month: monthName,
          revenue: monthlyRevenue[monthKey].revenue,
          count: monthlyRevenue[monthKey].count
        })
      } else {
        last6Months.push({
          month: monthName,
          revenue: 0,
          count: 0
        })
      }
    }
    
    setRevenueData(last6Months)
  }

  const handleCreateDeliveryMan = async (e) => {
    e.preventDefault()
    setDeliveryFormError('')
    setDeliveryFormSuccess('')
    setCreatingDelivery(true)

    try {
      const response = await createDeliveryMan(deliveryFormData)
      setDeliveryFormSuccess(`Delivery man "${deliveryFormData.username}" created successfully!`)
      setDeliveryFormData({
        username: '',
        password: '',
        email: '',
        name: '',
        mobile: ''
      })
      setShowDeliveryForm(false)
    } catch (error) {
      console.error('Error creating delivery man:', error)
      console.error('Error response:', error.response)
      console.error('Error response data:', error.response?.data)
      
      const errorData = error.response?.data || {}
      console.log('Error data keys:', Object.keys(errorData))
      console.log('Error data values:', errorData)
      
      // Try multiple ways to get the error message
      let errorMessage = errorData.message || 
                        errorData.error || 
                        errorData.details ||
                        error.message || 
                        'Failed to create delivery man'
      
      // If we have the full error data, show it
      if (error.response?.data) {
        const dataStr = JSON.stringify(errorData, null, 2)
        console.log('Full error data:', dataStr)
        
        // Build a comprehensive error message
        let fullErrorMessage = `Error: ${errorMessage}`
        
        if (errorData.exceptionType) {
          fullErrorMessage += `\n\nType: ${errorData.exceptionType}`
        }
        if (errorData.hint) {
          fullErrorMessage += `\n\n💡 ${errorData.hint}`
        }
        if (errorData.details) {
          fullErrorMessage += `\n\nDetails: ${errorData.details}`
        }
        
        // If message contains CHECK constraint, add specific help
        if (errorMessage.includes('CHECK constraint') || errorMessage.includes('constraint')) {
          fullErrorMessage += `\n\n🔧 Solution: Run the fix-delivery-man-constraint.ps1 script or restart your backend server to run the migration.`
        }
        
        setDeliveryFormError(fullErrorMessage)
      } else {
        setDeliveryFormError(`Server Error: ${error.message || 'Unknown error'}. Check backend console for details.`)
      }
    } finally {
      setCreatingDelivery(false)
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
          <p className="text-lg" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center card max-w-md" style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full mb-6" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%)' }}>
            <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#fca5a5' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: '#fff' }}>Error Loading Dashboard</h3>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Unable to load dashboard data. Please try again.</p>
        </div>
      </div>
    )
  }

  const maxRevenue = revenueData.length > 0 ? Math.max(...revenueData.map(d => d.revenue)) : 0
  const minRevenue = revenueData.length > 0 ? Math.min(...revenueData.map(d => d.revenue)) : 0

  return (
    <div className="min-h-screen" style={{ background: '#25252b' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="group relative overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 p-6 transform hover:-translate-y-1" style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Total Products</h3>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' }}>
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
              <p className="text-5xl font-black" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{summary.totalProducts}</p>
              <p className="text-xs mt-2 font-medium" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Active products</p>
            </div>
          </div>
          
          <div className="group relative overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 p-6 transform hover:-translate-y-1" style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Stock Value</h3>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform" style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}>
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-5xl font-black" style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>₹{summary.totalStockValue?.toFixed(2)}</p>
              <p className="text-xs mt-2 font-medium" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Total inventory value</p>
            </div>
          </div>
          
          <div 
            className="group relative overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 p-6 transform hover:-translate-y-1 cursor-pointer" 
            style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
            onClick={() => summary.lowStockCount > 0 && setShowLowStockModal(true)}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-400 to-pink-600 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Low Stock</h3>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <p className="text-5xl font-black" style={{ background: 'linear-gradient(135deg, #fca5a5 0%, #ef4444 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{summary.lowStockCount}</p>
              <p className="text-xs mt-2 font-medium" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                {summary.lowStockCount > 0 ? 'Click to view products' : 'Requires attention'}
              </p>
            </div>
          </div>
          
          <div 
            className="group relative overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 p-6 transform hover:-translate-y-1 cursor-pointer" 
            style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(245, 158, 11, 0.2)' }}
            onClick={() => summary.nearExpiryCount > 0 && setShowNearExpiryModal(true)}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400 to-amber-600 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Near Expiry</h3>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-5xl font-black" style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{summary.nearExpiryCount}</p>
              <p className="text-xs mt-2 font-medium" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                {summary.nearExpiryCount > 0 ? 'Click to view products' : 'Expiring soon'}
              </p>
            </div>
          </div>
        </div>

        {/* Revenue Graph */}
        <div className="mb-12">
          <div className="card" style={{ background: '#ffffff', border: '1px solid rgba(0, 0, 0, 0.1)', borderRadius: '12px' }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: '#333', padding: '20px 20px 0' }}>Monthly Revenue</h2>
            {revenueData.length > 0 ? (
              <div style={{ height: '350px', position: 'relative', padding: '20px 40px 40px 60px' }}>
                {/* Legend */}
                <div className="flex items-center mb-4" style={{ paddingLeft: '20px' }}>
                  <div style={{ width: '20px', height: '3px', background: '#06b6d4', marginRight: '8px' }}></div>
                  <span style={{ color: '#666', fontSize: '14px' }}>Monthly Revenue (₹)</span>
                </div>
                
                {/* SVG Chart */}
                {(() => {
                  const svgWidth = 800
                  const svgHeight = 250
                  const padding = { top: 20, right: 40, bottom: 30, left: 0 }
                  const innerWidth = svgWidth - padding.left - padding.right
                  const innerHeight = svgHeight - padding.top - padding.bottom
                  
                  // Calculate Y-axis step value (round to nearest 5000)
                  const yStep = Math.ceil(maxRevenue / 5 / 5000) * 5000 || 5000
                  const yMax = Math.ceil(maxRevenue / yStep) * yStep || yStep
                  
                  // Calculate points
                  const dataPoints = revenueData.map((data, index) => {
                    const x = padding.left + (index / Math.max(revenueData.length - 1, 1)) * innerWidth
                    const y = padding.top + innerHeight - (data.revenue / yMax) * innerHeight
                    return { x, y, data }
                  })
                  
                  // Create area path
                  const areaPath = dataPoints.reduce((path, point, index) => {
                    if (index === 0) {
                      return `M ${point.x} ${padding.top + innerHeight} L ${point.x} ${point.y}`
                    }
                    return `${path} L ${point.x} ${point.y}`
                  }, '') + ` L ${dataPoints[dataPoints.length - 1].x} ${padding.top + innerHeight} Z`
                  
                  // Create line path
                  const linePath = dataPoints.reduce((path, point, index) => {
                    if (index === 0) {
                      return `M ${point.x} ${point.y}`
                    }
                    return `${path} L ${point.x} ${point.y}`
                  }, '')
                  
                  return (
                    <svg width="100%" height="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="xMidYMid meet" style={{ overflow: 'visible' }}>
                      <defs>
                        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.05" />
                        </linearGradient>
                      </defs>
                      
                      {/* Area fill */}
                      <path
                        d={areaPath}
                        fill="url(#areaGradient)"
                      />
                      
                      {/* Line */}
                      <path
                        d={linePath}
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="2.5"
                      />
                      
                      {/* Data points */}
                      {dataPoints.map((point, index) => (
                        <g key={index}>
                          <circle
                            cx={point.x}
                            cy={point.y}
                            r="4"
                            fill="#06b6d4"
                            stroke="#ffffff"
                            strokeWidth="2"
                            className="hover:r-5 transition-all cursor-pointer"
                          />
                        </g>
                      ))}
                    </svg>
                  )
                })()}
                
                {/* Y-axis labels */}
                <div className="absolute left-0 top-12 bottom-12 flex flex-col justify-between text-xs" style={{ color: '#666', width: '50px' }}>
                  {(() => {
                    const yStep = Math.ceil(maxRevenue / 5 / 5000) * 5000 || 5000
                    const yMax = Math.ceil(maxRevenue / yStep) * yStep || yStep
                    const labels = []
                    for (let i = 5; i >= 0; i--) {
                      labels.push(yStep * i)
                    }
                    return labels.map((value, i) => (
                      <span key={i} className="text-right pr-2" style={{ fontSize: '12px' }}>
                        ₹{value.toLocaleString('en-IN')}
                      </span>
                    ))
                  })()}
                </div>
                
                {/* X-axis labels */}
                <div className="absolute bottom-0 left-12 right-12 flex justify-between text-xs" style={{ color: '#666', paddingBottom: '10px' }}>
                  {revenueData.map((data, index) => (
                    <div key={index} className="text-center" style={{ fontSize: '12px' }}>
                      {data.month}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p style={{ color: '#666' }}>No revenue data available yet</p>
                <p className="text-sm mt-2" style={{ color: '#999' }}>Revenue data will appear after orders are delivered</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6" style={{ color: '#fff' }}>Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link to="/admin/products" className="group relative overflow-hidden rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 p-8 transform hover:-translate-y-2 hover:scale-[1.02]" style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(6, 182, 212, 0.05)' }}></div>
              <div className="relative">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:rotate-6 group-hover:scale-110 transition-all" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' }}>
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-2xl font-bold transition-colors" style={{ color: '#fff' }} onMouseEnter={(e) => e.target.style.color = '#06b6d4'} onMouseLeave={(e) => e.target.style.color = '#fff'}>Manage Products</h3>
                    <p className="text-sm mt-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Product catalog</p>
                  </div>
                </div>
                <p className="leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Add, edit, or delete products from your inventory. Manage product details, pricing, and stock levels.</p>
                <div className="mt-6 flex items-center font-semibold group-hover:translate-x-2 transition-transform" style={{ color: '#06b6d4' }}>
                  <span>Get started</span>
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
            
            <Link to="/admin/stock" className="group relative overflow-hidden rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 p-8 transform hover:-translate-y-2 hover:scale-[1.02]" style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(6, 182, 212, 0.05)' }}></div>
              <div className="relative">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:rotate-6 group-hover:scale-110 transition-all" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' }}>
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-2xl font-bold transition-colors" style={{ color: '#fff' }} onMouseEnter={(e) => e.target.style.color = '#06b6d4'} onMouseLeave={(e) => e.target.style.color = '#fff'}>Stock Management</h3>
                    <p className="text-sm mt-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Inventory control</p>
                  </div>
                </div>
                <p className="leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Track stock movements, record stock in/out transactions, and monitor inventory levels in real-time.</p>
                <div className="mt-6 flex items-center font-semibold group-hover:translate-x-2 transition-transform" style={{ color: '#06b6d4' }}>
                  <span>Get started</span>
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
            
            <Link to="/admin/orders" className="group relative overflow-hidden rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 p-8 transform hover:-translate-y-2 hover:scale-[1.02]" style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(6, 182, 212, 0.05)' }}></div>
              <div className="relative">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:rotate-6 group-hover:scale-110 transition-all" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' }}>
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-2xl font-bold transition-colors" style={{ color: '#fff' }} onMouseEnter={(e) => e.target.style.color = '#06b6d4'} onMouseLeave={(e) => e.target.style.color = '#fff'}>View Orders</h3>
                    <p className="text-sm mt-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Order management</p>
                  </div>
                </div>
                <p className="leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>View and manage all customer orders. Update order status, track shipments, and handle customer requests.</p>
                <div className="mt-6 flex items-center font-semibold group-hover:translate-x-2 transition-transform" style={{ color: '#06b6d4' }}>
                  <span>Get started</span>
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
            
            <Link to="/admin/users" className="group relative overflow-hidden rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 p-8 transform hover:-translate-y-2 hover:scale-[1.02]" style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(6, 182, 212, 0.05)' }}></div>
              <div className="relative">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:rotate-6 group-hover:scale-110 transition-all" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' }}>
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-2xl font-bold transition-colors" style={{ color: '#fff' }} onMouseEnter={(e) => e.target.style.color = '#06b6d4'} onMouseLeave={(e) => e.target.style.color = '#fff'}>User Management</h3>
                    <p className="text-sm mt-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Users & delivery</p>
                  </div>
                </div>
                <p className="leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>View all users and delivery men. Create new delivery personnel and manage user accounts.</p>
                <div className="mt-6 flex items-center font-semibold group-hover:translate-x-2 transition-transform" style={{ color: '#06b6d4' }}>
                  <span>Get started</span>
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Alerts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Low Stock Alert */}
          {summary.lowStockCount > 0 && (
            <div className="relative overflow-hidden rounded-3xl shadow-xl p-8" style={{ background: 'rgba(30, 41, 59, 0.8)', border: '2px solid rgba(239, 68, 68, 0.3)' }}>
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-30" style={{ background: 'rgba(239, 68, 68, 0.2)' }}></div>
              <div className="relative">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg mr-4" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold" style={{ color: '#fca5a5' }}>Low Stock Alert</h2>
                </div>
                <div className="space-y-3">
                  {summary.lowStockItems?.slice(0, 5).map(item => (
                    <div key={item.id} className="flex justify-between items-center rounded-xl p-4 shadow-sm" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                      <span className="font-medium" style={{ color: '#fff' }}>{item.name}</span>
                      <span className="px-4 py-2 font-bold rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5' }}>{item.stockQuantity} units</span>
                    </div>
                  ))}
                </div>
                {summary.lowStockCount > 5 && (
                  <p className="text-sm mt-4 font-medium" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    +{summary.lowStockCount - 5} more items need attention
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Near Expiry Alert */}
          {summary.nearExpiryCount > 0 && (
            <div className="relative overflow-hidden rounded-3xl shadow-xl p-8" style={{ background: 'rgba(30, 41, 59, 0.8)', border: '2px solid rgba(245, 158, 11, 0.3)' }}>
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-30" style={{ background: 'rgba(245, 158, 11, 0.2)' }}></div>
              <div className="relative">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg mr-4" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold" style={{ color: '#fbbf24' }}>Near Expiry Alert</h2>
                </div>
                <div className="space-y-3">
                  {summary.nearExpiryItems?.slice(0, 5).map(item => (
                    <div key={item.id} className="flex justify-between items-center rounded-xl p-4 shadow-sm" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                      <span className="font-medium" style={{ color: '#fff' }}>{item.name}</span>
                      <span className="px-4 py-2 font-bold rounded-lg" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }}>
                        {new Date(item.expiryDate).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
                {summary.nearExpiryCount > 5 && (
                  <p className="text-sm mt-4 font-medium" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    +{summary.nearExpiryCount - 5} more items expiring soon
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Low Stock Modal */}
      {showLowStockModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowLowStockModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mr-4" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Low Stock Products</h2>
                  <p className="text-sm text-gray-600 mt-1">{summary.lowStockCount} product(s) need attention</p>
                </div>
              </div>
              <button
                onClick={() => setShowLowStockModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {summary.lowStockItems && summary.lowStockItems.length > 0 ? (
                <div className="space-y-3">
                  {summary.lowStockItems.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between p-4 rounded-xl border-2 border-red-100 bg-red-50 hover:bg-red-100 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">{item.name}</h3>
                        {item.sku && (
                          <p className="text-sm text-gray-600 mt-1">SKU: {item.sku}</p>
                        )}
                        {item.category && (
                          <p className="text-xs text-gray-500 mt-1">Category: {item.category}</p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <div className="px-4 py-2 rounded-lg font-bold text-lg" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
                          {item.stockQuantity} units
                        </div>
                        {item.price && (
                          <p className="text-sm text-gray-600 mt-2">Price: ₹{item.price.toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">No low stock products found.</p>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowLowStockModal(false)}
                className="px-6 py-2 rounded-lg font-semibold transition-colors"
                style={{ background: '#ef4444', color: '#fff' }}
                onMouseEnter={(e) => e.target.style.background = '#dc2626'}
                onMouseLeave={(e) => e.target.style.background = '#ef4444'}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Near Expiry Modal */}
      {showNearExpiryModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowNearExpiryModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mr-4" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Near Expiry Products</h2>
                  <p className="text-sm text-gray-600 mt-1">{summary.nearExpiryCount} product(s) expiring soon</p>
                </div>
              </div>
              <button
                onClick={() => setShowNearExpiryModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {summary.nearExpiryItems && summary.nearExpiryItems.length > 0 ? (
                <div className="space-y-3">
                  {summary.nearExpiryItems.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between p-4 rounded-xl border-2 border-orange-100 bg-orange-50 hover:bg-orange-100 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">{item.name}</h3>
                        {item.sku && (
                          <p className="text-sm text-gray-600 mt-1">SKU: {item.sku}</p>
                        )}
                        {item.category && (
                          <p className="text-xs text-gray-500 mt-1">Category: {item.category}</p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <div className="px-4 py-2 rounded-lg font-bold text-lg" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}>
                          {new Date(item.expiryDate).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                        {item.stockQuantity !== undefined && (
                          <p className="text-sm text-gray-600 mt-2">Stock: {item.stockQuantity} units</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">No products expiring soon.</p>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowNearExpiryModal(false)}
                className="px-6 py-2 rounded-lg font-semibold transition-colors"
                style={{ background: '#f59e0b', color: '#fff' }}
                onMouseEnter={(e) => e.target.style.background = '#d97706'}
                onMouseLeave={(e) => e.target.style.background = '#f59e0b'}
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

