import { useEffect, useState } from 'react'
import { getProducts, stockIn, stockOut, getStockHistory } from '../services/api'

export default function AdminStock() {
  const [products, setProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [stockHistory, setStockHistory] = useState([])
  const [formData, setFormData] = useState({
    quantity: '',
    reason: '',
    notes: ''
  })
  const [movementType, setMovementType] = useState('IN')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    if (selectedProduct) {
      loadStockHistory()
    }
  }, [selectedProduct])

  const loadProducts = async () => {
    try {
      const response = await getProducts()
      setProducts(response.data)
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStockHistory = async () => {
    try {
      const response = await getStockHistory(selectedProduct.id)
      setStockHistory(response.data)
    } catch (error) {
      console.error('Error loading stock history:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = {
        productId: selectedProduct.id,
        quantity: parseInt(formData.quantity),
        reason: formData.reason,
        notes: formData.notes
      }

      if (movementType === 'IN') {
        await stockIn(data)
      } else {
        await stockOut(data)
      }

      loadProducts()
      loadStockHistory()
      setFormData({ quantity: '', reason: '', notes: '' })
      alert('Stock movement recorded successfully')
    } catch (error) {
      console.error('Error recording stock movement:', error)
      alert('Failed to record stock movement')
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
          <p className="text-lg" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Loading stock information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold mb-2" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          Stock Management
        </h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Manage stock movements and inventory</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Stock Movement Form */}
        <div className="card" style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold" style={{ color: '#fff' }}>Stock Movement</h2>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2" style={{ color: '#fff' }}>Select Product</label>
            <select
              value={selectedProduct?.id || ''}
              onChange={(e) => {
                const productId = e.target.value
                if (productId) {
                  const product = products.find(p => p.id === parseInt(productId))
                  setSelectedProduct(product || null)
                } else {
                  setSelectedProduct(null)
                }
              }}
              className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none transition-all"
              style={{ 
                background: 'rgba(255, 255, 255, 0.05)', 
                borderColor: 'rgba(6, 182, 212, 0.3)', 
                color: '#fff'
              }}
              onFocus={(e) => { e.target.style.borderColor = '#06b6d4'; e.target.style.boxShadow = '0 0 0 3px rgba(6, 182, 212, 0.1)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(6, 182, 212, 0.3)'; e.target.style.boxShadow = 'none'; }}
            >
              <option value="" style={{ background: '#1e293b', color: '#fff' }}>Select a product</option>
              {products.map(product => (
                <option key={product.id} value={product.id} style={{ background: '#1e293b', color: '#fff' }}>
                  {product.name} (Stock: {product.stockQuantity || 0})
                </option>
              ))}
            </select>
            {selectedProduct && (
              <p className="mt-2 text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Selected: <span className="font-semibold" style={{ color: '#fff' }}>{selectedProduct.name}</span> - Current Stock: <span className="font-semibold" style={{ color: '#06b6d4' }}>{selectedProduct.stockQuantity || 0}</span>
              </p>
            )}
          </div>

          {selectedProduct && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-3" style={{ color: '#fff' }}>Movement Type</label>
                <div className="grid grid-cols-2 gap-4">
                  <label 
                    className="relative flex items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all"
                    style={{
                      borderColor: movementType === 'IN' ? '#22c55e' : 'rgba(6, 182, 212, 0.3)',
                      background: movementType === 'IN' ? 'rgba(34, 197, 94, 0.1)' : 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (movementType !== 'IN') {
                        e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.5)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (movementType !== 'IN') {
                        e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.3)'
                      }
                    }}
                  >
                    <input
                      type="radio"
                      value="IN"
                      checked={movementType === 'IN'}
                      onChange={(e) => setMovementType(e.target.value)}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
                        movementType === 'IN' ? 'bg-green-500' : 'bg-gray-600'
                      }`}>
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <span className="font-bold" style={{ color: movementType === 'IN' ? '#22c55e' : 'rgba(255, 255, 255, 0.7)' }}>
                        Stock IN
                      </span>
                    </div>
                  </label>
                  <label 
                    className="relative flex items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all"
                    style={{
                      borderColor: movementType === 'OUT' ? '#ef4444' : 'rgba(6, 182, 212, 0.3)',
                      background: movementType === 'OUT' ? 'rgba(239, 68, 68, 0.1)' : 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (movementType !== 'OUT') {
                        e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.5)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (movementType !== 'OUT') {
                        e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.3)'
                      }
                    }}
                  >
                    <input
                      type="radio"
                      value="OUT"
                      checked={movementType === 'OUT'}
                      onChange={(e) => setMovementType(e.target.value)}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
                        movementType === 'OUT' ? 'bg-red-500' : 'bg-gray-600'
                      }`}>
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </div>
                      <span className="font-bold" style={{ color: movementType === 'OUT' ? '#ef4444' : 'rgba(255, 255, 255, 0.7)' }}>
                        Stock OUT
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#fff' }}>Quantity *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none transition-all"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.05)', 
                    borderColor: 'rgba(6, 182, 212, 0.3)', 
                    color: '#fff'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#06b6d4'; e.target.style.boxShadow = '0 0 0 3px rgba(6, 182, 212, 0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(6, 182, 212, 0.3)'; e.target.style.boxShadow = 'none'; }}
                  placeholder="Enter quantity"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#fff' }}>Reason</label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  placeholder={movementType === 'IN' ? 'Purchase, Return, etc.' : 'Damage, Adjustment, etc.'}
                  className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none transition-all"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.05)', 
                    borderColor: 'rgba(6, 182, 212, 0.3)', 
                    color: '#fff'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#06b6d4'; e.target.style.boxShadow = '0 0 0 3px rgba(6, 182, 212, 0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(6, 182, 212, 0.3)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#fff' }}>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows="3"
                  className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none transition-all"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.05)', 
                    borderColor: 'rgba(6, 182, 212, 0.3)', 
                    color: '#fff'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#06b6d4'; e.target.style.boxShadow = '0 0 0 3px rgba(6, 182, 212, 0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(6, 182, 212, 0.3)'; e.target.style.boxShadow = 'none'; }}
                  placeholder="Additional notes (optional)"
                />
              </div>

              <button
                type="submit"
                className={`w-full btn-primary ${
                  movementType === 'IN' 
                    ? 'bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800' 
                    : 'bg-gradient-to-r from-red-600 to-pink-700 hover:from-red-700 hover:to-pink-800'
                }`}
              >
                <span className="flex items-center justify-center">
                  {movementType === 'IN' ? (
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  )}
                  Record {movementType === 'IN' ? 'Stock IN' : 'Stock OUT'}
                </span>
              </button>
            </form>
          )}
        </div>

        {/* Stock History */}
        <div className="card" style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold" style={{ color: '#fff' }}>
              Stock History {selectedProduct && `- ${selectedProduct.name}`}
            </h2>
          </div>
          
          {!selectedProduct ? (
            <div className="text-center py-12">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4" style={{ background: 'rgba(6, 182, 212, 0.1)' }}>
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'rgba(6, 182, 212, 0.5)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Select a product to view history</p>
            </div>
          ) : stockHistory.length === 0 ? (
            <div className="text-center py-12">
              <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>No stock movements recorded</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {stockHistory.map(movement => (
                <div key={movement.id} className="p-4 rounded-xl border-2 transition-colors" style={{ borderColor: 'rgba(6, 182, 212, 0.3)', background: 'rgba(6, 182, 212, 0.05)' }}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                          movement.type === 'IN' ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                          {movement.type === 'IN' ? (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          )}
                        </div>
                        <p className="font-bold text-lg" style={{ color: movement.type === 'IN' ? '#22c55e' : '#ef4444' }}>
                          {movement.type === 'IN' ? '+' : '-'}{movement.quantity} units
                        </p>
                      </div>
                      <p className="text-sm font-semibold mb-1" style={{ color: '#fff' }}>{movement.reason}</p>
                      {movement.notes && (
                        <p className="text-xs mb-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{movement.notes}</p>
                      )}
                      <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                        {new Date(movement.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

