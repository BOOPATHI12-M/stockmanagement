import { useEffect, useState } from 'react'
import { getSummary } from '../services/api'

export default function AdminReports() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSummary()
  }, [])

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600 text-lg">Loading reports...</p>
        </div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center card max-w-md">
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-r from-red-100 to-pink-100 mb-6">
            <svg className="h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Reports</h3>
          <p className="text-gray-600">Unable to load report data. Please try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Reports & Analytics
        </h1>
        <p className="text-gray-600">Comprehensive inventory and stock reports</p>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Total Products</h3>
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <p className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">{summary.totalProducts}</p>
        </div>
        
        <div className="card bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Stock Value</h3>
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-4xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-800 bg-clip-text text-transparent">₹{summary.totalStockValue?.toFixed(2)}</p>
        </div>
        
        <div className="card bg-gradient-to-br from-red-50 to-pink-100 border-2 border-red-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Low Stock</h3>
            <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <p className="text-4xl font-extrabold bg-gradient-to-r from-red-600 to-pink-800 bg-clip-text text-transparent">{summary.lowStockCount}</p>
        </div>
        
        <div className="card bg-gradient-to-br from-orange-50 to-amber-100 border-2 border-orange-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Near Expiry</h3>
            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-4xl font-extrabold bg-gradient-to-r from-orange-600 to-amber-800 bg-clip-text text-transparent">{summary.nearExpiryCount}</p>
        </div>
      </div>

      {/* Low Stock Items */}
      <div className="card mb-8">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-500 to-pink-600 flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Low Stock Items</h2>
        </div>
        {summary.lowStockItems?.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No low stock items - all products are well stocked!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-red-50 to-pink-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Price</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {summary.lowStockItems?.map(item => (
                  <tr key={item.id} className="hover:bg-red-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                      {item.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-800 border border-red-200">
                        {item.stockQuantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      ₹{item.price}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Near Expiry Items */}
      <div className="card">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-amber-600 flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Near Expiry Items</h2>
        </div>
        {summary.nearExpiryItems?.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No items expiring soon - all products are fresh!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-orange-50 to-amber-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Expiry Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Stock</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {summary.nearExpiryItems?.map(item => (
                  <tr key={item.id} className="hover:bg-orange-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                      {item.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 rounded-full text-sm font-bold bg-orange-100 text-orange-800 border border-orange-200">
                        {new Date(item.expiryDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {item.stockQuantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

