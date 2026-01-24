import { useEffect, useState } from 'react'
import { getProducts, uploadProductImage } from '../services/api'
import api from '../services/api'

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stockQuantity: '',
    imageUrl: '',
    category: '',
    sku: '',
    expiryDate: ''
  })
  const [selectedFile, setSelectedFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadProducts()
  }, [])

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

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setUploading(true)
    try {
      let imageUrl = formData.imageUrl || null
      
      // Upload file if selected
      if (selectedFile) {
        try {
          const uploadResponse = await uploadProductImage(selectedFile)
          imageUrl = uploadResponse.data.imageUrl
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError)
          alert('Failed to upload image. Please try again.')
          setUploading(false)
          return
        }
      }
      
      // Convert form data to proper types
      const productData = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price) || 0,
        stockQuantity: parseInt(formData.stockQuantity) || 0,
        imageUrl: imageUrl,
        category: formData.category || null,
        sku: formData.sku || null,
        expiryDate: formData.expiryDate || null
      }
      
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, productData)
      } else {
        await api.post('/products', productData)
      }
      loadProducts()
      resetForm()
      alert('Product saved successfully!')
    } catch (error) {
      console.error('Error saving product:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Failed to save product'
      alert(`Error: ${errorMessage}`)
    } finally {
      setUploading(false)
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      stockQuantity: product.stockQuantity || '',
      imageUrl: product.imageUrl || '',
      category: product.category || '',
      sku: product.sku || '',
      expiryDate: product.expiryDate || ''
    })
    setSelectedFile(null)
    setImagePreview(product.imageUrl || null)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return
    
    try {
      await api.delete(`/products/${id}`)
      loadProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Failed to delete product')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      stockQuantity: '',
      imageUrl: '',
      category: '',
      sku: '',
      expiryDate: ''
    })
    setSelectedFile(null)
    setImagePreview(null)
    setEditingProduct(null)
    setShowForm(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ color: '#06b6d4' }}>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Loading products...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-extrabold mb-2" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Products Management
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Manage your product inventory</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
          style={showForm ? { background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', border: '2px solid #ef4444' } : {}}
        >
          {showForm ? (
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </span>
          ) : (
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Product
            </span>
          )}
        </button>
      </div>

      {showForm && (
        <div className="card mb-8 animate-fade-in">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' }}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold" style={{ color: '#fff' }}>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#fff' }}>Product Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="input-field"
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#fff' }}>SKU</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({...formData, sku: e.target.value})}
                  className="input-field"
                  placeholder="Stock Keeping Unit"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#fff' }}>Price (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="input-field"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#fff' }}>Stock Quantity *</label>
                <input
                  type="number"
                  required
                  value={formData.stockQuantity}
                  onChange={(e) => setFormData({...formData, stockQuantity: e.target.value})}
                  className="input-field"
                  placeholder="Enter quantity"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#fff' }}>Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="input-field"
                  placeholder="Product category"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#fff' }}>Expiry Date</label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                  className="input-field"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2" style={{ color: '#fff' }}>Product Image</label>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#fff' }}>
                      Upload Image from Browser
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="block w-full text-sm cursor-pointer"
                      style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                    />
                    {selectedFile && (
                      <p className="mt-2 text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Selected: {selectedFile.name}</p>
                    )}
                  </div>
                  <div className="text-center text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>OR</div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#fff' }}>
                      Image URL
                    </label>
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                      className="input-field"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  {(imagePreview || formData.imageUrl) && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium mb-2" style={{ color: '#fff' }}>Preview</label>
                      <div className="rounded-lg p-4" style={{ border: '2px solid rgba(6, 182, 212, 0.3)', background: 'rgba(6, 182, 212, 0.05)' }}>
                        <img
                          src={imagePreview || formData.imageUrl}
                          alt="Product preview"
                          className="max-w-full h-48 object-contain mx-auto rounded-lg"
                          onError={(e) => {
                            e.target.style.display = 'none'
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2" style={{ color: '#fff' }}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="4"
                  className="input-field"
                  placeholder="Enter product description"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-4 pt-4" style={{ borderTop: '1px solid rgba(6, 182, 212, 0.3)' }}>
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={uploading}
              >
                {uploading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {editingProduct ? 'Updating...' : 'Creating...'}
                  </span>
                ) : (
                  editingProduct ? 'Update Product' : 'Create Product'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        {products.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full mb-6" style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(8, 145, 178, 0.2) 100%)' }}>
              <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'rgba(6, 182, 212, 0.5)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: '#fff' }}>No products yet</h3>
            <p className="mb-6" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Add your first product to get started</p>
            <button onClick={() => setShowForm(true)} className="btn-primary">
              Add Product
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr style={{ background: 'rgba(6, 182, 212, 0.1)' }}>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#06b6d4', borderBottom: '1px solid rgba(6, 182, 212, 0.3)' }}>Product</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#06b6d4', borderBottom: '1px solid rgba(6, 182, 212, 0.3)' }}>Price</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#06b6d4', borderBottom: '1px solid rgba(6, 182, 212, 0.3)' }}>Stock</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#06b6d4', borderBottom: '1px solid rgba(6, 182, 212, 0.3)' }}>Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#06b6d4', borderBottom: '1px solid rgba(6, 182, 212, 0.3)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => (
                  <tr key={product.id} style={{ borderBottom: '1px solid rgba(6, 182, 212, 0.2)' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(6, 182, 212, 0.05)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold" style={{ color: '#fff' }}>{product.name}</div>
                      {product.sku && (
                        <div className="text-xs font-mono" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>{product.sku}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                        ₹{product.price}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold" style={{ color: '#fff' }}>{product.stockQuantity}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 text-xs font-bold rounded-full shadow-sm" style={{
                        background: product.stockQuantity < 10 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                        color: product.stockQuantity < 10 ? '#fca5a5' : '#86efac',
                        border: `1px solid ${product.stockQuantity < 10 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)'}`
                      }}>
                        {product.stockQuantity < 10 ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleEdit(product)}
                          className="px-3 py-1 rounded-lg transition-colors font-semibold"
                          style={{ background: 'rgba(6, 182, 212, 0.2)', color: '#06b6d4' }}
                          onMouseEnter={(e) => { e.target.style.background = 'rgba(6, 182, 212, 0.3)'; }}
                          onMouseLeave={(e) => { e.target.style.background = 'rgba(6, 182, 212, 0.2)'; }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="px-3 py-1 rounded-lg transition-colors font-semibold"
                          style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5' }}
                          onMouseEnter={(e) => { e.target.style.background = 'rgba(239, 68, 68, 0.3)'; }}
                          onMouseLeave={(e) => { e.target.style.background = 'rgba(239, 68, 68, 0.2)'; }}
                        >
                          Delete
                        </button>
                      </div>
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

