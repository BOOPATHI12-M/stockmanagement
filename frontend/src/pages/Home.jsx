import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProducts, getProductReviews, addReview } from '../services/api'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [productReviews, setProductReviews] = useState({}) // { productId: { reviews, averageRating, reviewCount } }
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewMessage, setReviewMessage] = useState({ type: '', text: '' })
  const [productQuantities, setProductQuantities] = useState({}) // { productId: quantity }
  const { addToCart } = useCart()
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  
  // Debug: Log user state
  useEffect(() => {
    console.log('👤 User state changed:', { user, hasToken: !!localStorage.getItem('token') })
  }, [user])

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    filterProducts()
  }, [searchQuery, selectedCategory, products])

  const loadProducts = async () => {
    try {
      const response = await getProducts()
      setProducts(response.data)
      setFilteredProducts(response.data)
      // Load reviews for all products
      loadAllProductReviews(response.data)
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAllProductReviews = async (productsList) => {
    const reviewsData = {}
    for (const product of productsList) {
      try {
        const response = await getProductReviews(product.id)
        reviewsData[product.id] = response.data
      } catch (error) {
        console.error(`Error loading reviews for product ${product.id}:`, error)
        reviewsData[product.id] = { reviews: [], averageRating: 0, reviewCount: 0 }
      }
    }
    setProductReviews(reviewsData)
  }

  const loadProductReviews = async (productId) => {
    try {
      const response = await getProductReviews(productId)
      setProductReviews(prev => ({
        ...prev,
        [productId]: response.data
      }))
    } catch (error) {
      console.error('Error loading reviews:', error)
    }
  }

  const handleOpenReviewModal = (product) => {
    console.log('🔍 Opening review modal - user:', user, 'token:', !!localStorage.getItem('token'))
    setSelectedProduct(product)
    setReviewForm({ rating: 5, comment: '' })
    setReviewMessage({ type: '', text: '' })
    setShowReviewModal(true)
    // Load reviews if not already loaded
    if (!productReviews[product.id]) {
      loadProductReviews(product.id)
    }
  }

  const handleSubmitReview = async () => {
    console.log('🔍 handleSubmitReview called - user:', user, 'selectedProduct:', selectedProduct)
    
    if (!user) {
      console.log('❌ No user found')
      setReviewMessage({ type: 'error', text: 'Please login to add a review' })
      setTimeout(() => setReviewMessage({ type: '', text: '' }), 3000)
      return
    }
    
    if (!selectedProduct) {
      console.log('❌ No product selected')
      setReviewMessage({ type: 'error', text: 'Product not selected' })
      return
    }

    // Validate rating
    if (!reviewForm.rating || reviewForm.rating < 1 || reviewForm.rating > 5) {
      setReviewMessage({ type: 'error', text: 'Please select a rating between 1 and 5 stars' })
      setTimeout(() => setReviewMessage({ type: '', text: '' }), 3000)
      return
    }

    // Validate comment (optional but recommended)
    if (!reviewForm.comment || reviewForm.comment.trim().length === 0) {
      setReviewMessage({ type: 'error', text: 'Please write a comment for your review' })
      setTimeout(() => setReviewMessage({ type: '', text: '' }), 3000)
      return
    }

    setSubmittingReview(true)
    setReviewMessage({ type: '', text: '' })
    
    try {
      const token = localStorage.getItem('token')
      
      // Check if token exists
      if (!token) {
        setReviewMessage({ 
          type: 'error', 
          text: 'You are not logged in. Please login to submit a review.' 
        })
        setSubmittingReview(false)
        return
      }
      
      // Check if user object is valid
      if (!user || !user.email) {
        setReviewMessage({ 
          type: 'error', 
          text: 'User session expired. Please refresh the page and login again.' 
        })
        setSubmittingReview(false)
        return
      }
      
      console.log('📤 Submitting review:', { 
        productId: selectedProduct.id, 
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim(),
        hasToken: !!token,
        tokenLength: token.length,
        userEmail: user?.email
      })
      
      const response = await addReview(selectedProduct.id, {
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim()
      })
      console.log('✅ Review submitted successfully:', response.data)
      
      setReviewMessage({ type: 'success', text: 'Review submitted successfully! Thank you for your feedback.' })
      
      // Reload reviews to show the new one
      await loadProductReviews(selectedProduct.id)
      
      // Reset form after a short delay
      setTimeout(() => {
        setReviewForm({ rating: 5, comment: '' })
        setReviewMessage({ type: '', text: '' })
        // Don't close modal, let user see their review was added
      }, 2000)
    } catch (error) {
      console.error('❌ Error submitting review:', error)
      console.error('Error response:', error.response)
      console.error('Error status:', error.response?.status)
      console.error('Error data:', error.response?.data)
      
      let errorMessage = 'Failed to submit review. Please try again.'
      
      // Handle different error types
      if (error.response) {
        const status = error.response.status
        const data = error.response.data
        
        if (status === 401) {
          // Unauthorized - token expired or invalid
          errorMessage = 'Your session has expired. Please refresh the page and login again to submit a review.'
          // Optionally clear invalid token
          const token = localStorage.getItem('token')
          if (token) {
            console.log('⚠️ Token exists but authentication failed. Token may be expired.')
          }
        } else if (status === 403) {
          errorMessage = 'You do not have permission to perform this action.'
        } else if (status === 404) {
          errorMessage = 'Product not found. Please try again.'
        } else if (status === 400) {
          errorMessage = data?.error || 'Invalid review data. Please check your rating and comment.'
        } else if (status === 500) {
          errorMessage = data?.error || 'Server error. Please try again later.'
        } else {
          errorMessage = data?.error || `Error (${status}): Please try again.`
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setReviewMessage({ 
        type: 'error', 
        text: errorMessage
      })
    } finally {
      setSubmittingReview(false)
    }
  }

  const renderStars = (rating, interactive = false, onRatingChange = null) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (interactive && onRatingChange) {
                console.log('⭐ Star clicked:', star)
                onRatingChange(star)
              }
            }}
            disabled={!interactive}
            className={
              interactive 
                ? 'cursor-pointer hover:scale-125 transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded' 
                : 'cursor-default'
            }
            style={{ 
              background: 'transparent', 
              border: 'none',
              padding: '2px'
            }}
          >
            <svg
              className={`w-6 h-6 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 fill-gray-300'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
    )
  }

  const filterProducts = () => {
    let filtered = [...products]

    // Filter by search query (name, description, category)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(product => 
        product.name?.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query)
      )
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(product => product.category === selectedCategory)
    }

    setFilteredProducts(filtered)
  }

  const handleQuantityChange = (productId, quantity) => {
    const qty = Math.max(1, Math.min(quantity, 100)) // Limit between 1 and 100
    setProductQuantities(prev => ({
      ...prev,
      [productId]: qty
    }))
  }

  const handleBuyNow = (product) => {
    if (!user) {
      alert('Please login to buy products')
      return
    }

    if (product.stockQuantity === 0) {
      alert('This product is out of stock')
      return
    }

    const quantity = productQuantities[product.id] || 1
    
    if (quantity > product.stockQuantity) {
      alert(`Only ${product.stockQuantity} items available in stock`)
      return
    }

    // Navigate to checkout with product data in state (without adding to cart)
    navigate('/checkout', { 
      state: { 
        directPurchase: true,
        product: {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          imageUrl: product.imageUrl,
          quantity: quantity
        }
      } 
    })
  }

  const handleAddToCartWithQuantity = async (product) => {
    const quantity = productQuantities[product.id] || 1
    await addToCart(product, quantity)
  }

  // Get unique categories
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))]

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ color: '#06b6d4' }}>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)' }} className="text-lg">Loading products...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search and Filter Section */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'rgba(6, 182, 212, 0.5)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search products by name, description, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
              style={{ 
                background: 'rgba(30, 41, 59, 0.8)', 
                borderColor: 'rgba(6, 182, 212, 0.3)',
                color: '#fff'
              }}
            />
          </div>

          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="md:w-64">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                style={{ 
                  background: 'rgba(30, 41, 59, 0.8)', 
                  borderColor: 'rgba(6, 182, 212, 0.3)',
                  color: '#fff'
                }}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category} style={{ background: 'rgba(30, 41, 59, 0.95)', color: '#fff' }}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Clear Filters Button */}
          {(searchQuery || selectedCategory) && (
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('')
              }}
              className="px-6 py-3 rounded-xl border-2 font-semibold transition-all hover:opacity-80"
              style={{ 
                background: 'rgba(6, 182, 212, 0.2)', 
                borderColor: 'rgba(6, 182, 212, 0.5)',
                color: '#06b6d4'
              }}
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Results Count */}
        {filteredProducts.length !== products.length && (
          <div className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Showing {filteredProducts.length} of {products.length} products
            {(searchQuery || selectedCategory) && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('')
                }}
                className="ml-2 underline hover:text-cyan-400"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
      
      {products.length === 0 ? (
        <div className="text-center py-16">
          <svg className="mx-auto h-24 w-24 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'rgba(6, 182, 212, 0.5)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="text-xl font-semibold mb-2" style={{ color: '#fff' }}>No products available</h3>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Check back later for new products</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16">
          <svg className="mx-auto h-24 w-24 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'rgba(6, 182, 212, 0.5)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="text-xl font-semibold mb-2" style={{ color: '#fff' }}>No products found</h3>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Try adjusting your search or filter criteria</p>
          {(searchQuery || selectedCategory) && (
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('')
              }}
              className="mt-4 px-6 py-2 rounded-lg font-semibold transition-all hover:opacity-80"
              style={{ 
                background: 'rgba(6, 182, 212, 0.2)', 
                color: '#06b6d4'
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <div key={product.id} className="rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300" style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
              {product.imageUrl ? (
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={product.imageUrl} 
                    alt={product.name}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(8, 145, 178, 0.1) 100%)' }}>
                  <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'rgba(6, 182, 212, 0.5)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <div className="p-5">
                <h3 className="text-lg font-bold mb-2 line-clamp-1" style={{ color: '#fff' }}>{product.name}</h3>
                {product.description && (
                  <p className="text-sm mb-3 line-clamp-2 min-h-[2.5rem]" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{product.description}</p>
                )}
                
                {/* Reviews Section */}
                {productReviews[product.id] && (
                  <div className="mb-3 flex items-center gap-2">
                    {renderStars(Math.round(productReviews[product.id].averageRating || 0))}
                    <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      ({productReviews[product.id].reviewCount || 0})
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-extrabold" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    ₹{product.price}
                  </span>
                  {product.category && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full" style={{ background: 'rgba(6, 182, 212, 0.2)', color: '#06b6d4' }}>
                      {product.category}
                    </span>
                  )}
                </div>
                
                {/* Review Button */}
                <button
                  onClick={() => handleOpenReviewModal(product)}
                  className="w-full mb-2 px-4 py-2 rounded-lg font-medium transition-all hover:opacity-80 flex items-center justify-center gap-2"
                  style={{ 
                    background: 'rgba(6, 182, 212, 0.1)', 
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    color: '#06b6d4'
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  Reviews
                </button>
                
                {!isAdmin() && (
                  <>
                    {/* Quantity Selector */}
                    <div className="mb-2 flex items-center gap-2">
                      <label className="text-sm font-medium" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Quantity:</label>
                      <div className="flex items-center gap-2 flex-1">
                        <button
                          onClick={() => {
                            const currentQty = productQuantities[product.id] || 1
                            if (currentQty > 1) {
                              handleQuantityChange(product.id, currentQty - 1)
                            }
                          }}
                          disabled={product.stockQuantity === 0 || (productQuantities[product.id] || 1) <= 1}
                          className="px-3 py-1 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ 
                            background: 'rgba(6, 182, 212, 0.2)', 
                            border: '1px solid rgba(6, 182, 212, 0.3)',
                            color: '#06b6d4'
                          }}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={product.stockQuantity || 100}
                          value={productQuantities[product.id] || 1}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 1
                            handleQuantityChange(product.id, value)
                          }}
                          className="w-16 px-2 py-1 text-center rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          style={{ 
                            background: 'rgba(30, 41, 59, 0.8)', 
                            borderColor: 'rgba(6, 182, 212, 0.3)',
                            color: '#fff'
                          }}
                          disabled={product.stockQuantity === 0}
                        />
                        <button
                          onClick={() => {
                            const currentQty = productQuantities[product.id] || 1
                            const maxQty = Math.min(product.stockQuantity || 100, 100)
                            if (currentQty < maxQty) {
                              handleQuantityChange(product.id, currentQty + 1)
                            }
                          }}
                          disabled={product.stockQuantity === 0 || (productQuantities[product.id] || 1) >= Math.min(product.stockQuantity || 100, 100)}
                          className="px-3 py-1 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ 
                            background: 'rgba(6, 182, 212, 0.2)', 
                            border: '1px solid rgba(6, 182, 212, 0.3)',
                            color: '#06b6d4'
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Buy Now Button */}
                    <button
                      onClick={() => handleBuyNow(product)}
                      disabled={product.stockQuantity === 0 || !user}
                      className="w-full mb-2 px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                      style={{ 
                        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                        color: '#fff',
                        border: 'none'
                      }}
                    >
                      {!user ? (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          Login to Buy
                        </>
                      ) : product.stockQuantity === 0 ? (
                        'Out of Stock'
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Buy Now
                        </>
                      )}
                    </button>

                    {/* Add to Cart Button */}
                    <button
                      onClick={() => handleAddToCartWithQuantity(product)}
                      disabled={product.stockQuantity === 0 || !user}
                      className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {!user ? (
                        <span className="flex items-center justify-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          Login to Add
                        </span>
                      ) : product.stockQuantity === 0 ? (
                        'Out of Stock'
                      ) : (
                        <span className="flex items-center justify-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          Add to Cart
                        </span>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-2xl font-bold">Reviews - {selectedProduct.name}</h2>
              <button
                onClick={() => {
                  setShowReviewModal(false)
                  setSelectedProduct(null)
                  setReviewForm({ rating: 5, comment: '' })
                  setReviewMessage({ type: '', text: '' })
                }}
                className="text-white hover:text-gray-200 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {/* Average Rating Summary */}
              {productReviews[selectedProduct.id] && (
                <div className="mb-6 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl border border-cyan-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        {renderStars(Math.round(productReviews[selectedProduct.id].averageRating || 0))}
                        <span className="text-2xl font-bold text-gray-900">
                          {productReviews[selectedProduct.id].averageRating?.toFixed(1) || '0.0'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Based on {productReviews[selectedProduct.id].reviewCount || 0} review(s)
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Add Review Form */}
              {user && user.email ? (
                <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Write a Review</h3>
                  
                  {/* Message Alert */}
                  {reviewMessage.text && (
                    <div className={`mb-4 p-3 rounded-lg ${
                      reviewMessage.type === 'success' 
                        ? 'bg-green-500 text-white font-semibold shadow-md' 
                        : 'bg-red-500 text-white font-semibold shadow-md'
                    }`}>
                      <div className="flex items-center gap-2">
                        {reviewMessage.type === 'success' && (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        {reviewMessage.text}
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Rating *</label>
                      <div className="mb-2">
                        {renderStars(reviewForm.rating, true, (rating) => {
                          console.log('⭐ Rating changed to:', rating)
                          setReviewForm({ ...reviewForm, rating })
                          setReviewMessage({ type: '', text: '' }) // Clear message when rating changes
                        })}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Current rating: {reviewForm.rating} star{reviewForm.rating !== 1 ? 's' : ''} - Click on the stars to change
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Comment *</label>
                      <textarea
                        value={reviewForm.comment}
                        onChange={(e) => {
                          setReviewForm({ ...reviewForm, comment: e.target.value })
                          setReviewMessage({ type: '', text: '' }) // Clear message when comment changes
                        }}
                        placeholder="Share your experience with this product..."
                        rows="4"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Please write a detailed review</p>
                    </div>
                    <button
                      onClick={handleSubmitReview}
                      disabled={submittingReview || !reviewForm.rating || !reviewForm.comment?.trim()}
                      className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 font-semibold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submittingReview ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Submitting...
                        </span>
                      ) : (
                        'Submit Review'
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                  <p className="text-gray-700 text-center">
                    <span className="font-semibold">Please login</span> to write a review for this product.
                  </p>
                </div>
              )}

              {/* Reviews List */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  All Reviews ({productReviews[selectedProduct.id]?.reviews?.length || 0})
                </h3>
                {productReviews[selectedProduct.id]?.reviews?.length > 0 ? (
                  <div className="space-y-4">
                    {productReviews[selectedProduct.id].reviews.map((review) => (
                      <div key={review.id} className="p-4 bg-white border border-gray-200 rounded-xl">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-gray-900">{review.user?.name || 'Anonymous'}</p>
                            <p className="text-xs text-gray-500">
                              {review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              }) : ''}
                            </p>
                          </div>
                          {renderStars(review.rating)}
                        </div>
                        {review.comment && (
                          <p className="text-gray-700 mt-2">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No reviews yet. Be the first to review this product!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

