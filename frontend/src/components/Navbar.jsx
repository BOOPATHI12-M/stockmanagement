import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export default function Navbar() {
  const { user, logout, isAdmin, isDeliveryMan } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Safely get cart item count
  let cartItemCount = 0
  try {
    const cartContext = useCart()
    if (cartContext && cartContext.getItemCount) {
      cartItemCount = cartContext.getItemCount()
    }
  } catch (e) {
    // Cart context not available, use default value
    // This can happen during initial render or if context is not properly set up
  }

  const handleLogout = () => {
    logout()
    navigate('/')
    setMobileMenuOpen(false)
  }

  return (
    <nav className="shadow-lg sticky top-0 z-50 backdrop-blur-sm" style={{ background: 'rgba(30, 41, 59, 0.95)', borderBottom: '1px solid rgba(6, 182, 212, 0.3)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center px-2 py-2 text-xl font-bold hover:opacity-80 transition-all duration-200">
              <div className="h-10 w-10 rounded-full overflow-hidden mr-2 flex items-center justify-center" style={{ background: 'rgba(6, 182, 212, 0.1)', border: '2px solid rgba(6, 182, 212, 0.3)' }}>
                <img 
                  src="/logo.svg" 
                  alt="Sudharshini Stock Management Logo" 
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    // Fallback to SVG if image fails to load
                    e.target.style.display = 'none'
                    const svg = e.target.nextElementSibling
                    if (svg) svg.style.display = 'block'
                  }}
                />
                <svg className="h-6 w-6 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#06b6d4', display: 'none' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <span style={{ color: '#06b6d4' }}>Sudharshini</span>
              <span style={{ color: '#06b6d4' }}> Stock</span>
            </Link>
          </div>

          {/* Centered Navigation Links */}
          <div className="hidden md:flex items-center justify-center flex-1 space-x-1 mx-8">
            <Link to="/" className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200" style={{ color: '#fff' }} onMouseEnter={(e) => { e.target.style.background = 'rgba(6, 182, 212, 0.2)'; e.target.style.color = '#06b6d4'; }} onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#fff'; }}>
              Home
            </Link>
            {user && !isAdmin() && (
              <>
                <Link to="/orders" className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200" style={{ color: '#fff' }} onMouseEnter={(e) => { e.target.style.background = 'rgba(6, 182, 212, 0.2)'; e.target.style.color = '#06b6d4'; }} onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#fff'; }}>
                  My Orders
                </Link>
                <Link to="/track" className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200" style={{ color: '#fff' }} onMouseEnter={(e) => { e.target.style.background = 'rgba(6, 182, 212, 0.2)'; e.target.style.color = '#06b6d4'; }} onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#fff'; }}>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Track
                </Link>
              </>
            )}
            {isDeliveryMan && isDeliveryMan() && (
              <Link to="/delivery" className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200" style={{ color: '#fff' }} onMouseEnter={(e) => { e.target.style.background = 'rgba(6, 182, 212, 0.2)'; e.target.style.color = '#06b6d4'; }} onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#fff'; }}>
                Delivery
              </Link>
            )}
            {isAdmin() && user?.role === 'ADMIN' && (
              <>
                <Link to="/admin/dashboard" className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200" style={{ color: '#fff' }} onMouseEnter={(e) => { e.target.style.background = 'rgba(6, 182, 212, 0.2)'; e.target.style.color = '#06b6d4'; }} onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#fff'; }}>
                  Dashboard
                </Link>
                <Link to="/admin/products" className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200" style={{ color: '#fff' }} onMouseEnter={(e) => { e.target.style.background = 'rgba(6, 182, 212, 0.2)'; e.target.style.color = '#06b6d4'; }} onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#fff'; }}>
                  Products
                </Link>
                <Link to="/admin/orders" className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200" style={{ color: '#fff' }} onMouseEnter={(e) => { e.target.style.background = 'rgba(6, 182, 212, 0.2)'; e.target.style.color = '#06b6d4'; }} onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#fff'; }}>
                  Orders
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md focus:outline-none"
              style={{ color: '#fff' }}
              onMouseEnter={(e) => { e.target.style.background = 'rgba(6, 182, 212, 0.2)'; e.target.style.color = '#06b6d4'; }}
              onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#fff'; }}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Right Section - User Actions */}
          <div className="flex items-center space-x-3">
            {!user && (
              <>
                <Link to="/login" className="px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200" style={{ color: '#fff' }} onMouseEnter={(e) => { e.target.style.background = 'rgba(6, 182, 212, 0.2)'; e.target.style.color = '#06b6d4'; }} onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#fff'; }}>
                  Login
                </Link>
                <Link to="/admin/login" className="px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', border: '2px solid #06b6d4' }}>
                  Admin Login
                </Link>
              </>
            )}
            {user && !isAdmin() && (
              <Link to="/cart" className="relative px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200" style={{ color: '#fff' }} onMouseEnter={(e) => { e.target.style.background = 'rgba(6, 182, 212, 0.2)'; e.target.style.color = '#06b6d4'; }} onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#fff'; }}>
                <span className="flex items-center">
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Cart
                  {cartItemCount > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs font-bold text-white rounded-full" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' }}>
                      {cartItemCount}
                    </span>
                  )}
                </span>
              </Link>
            )}
            {user && (
              <>
                <Link
                  to="/profile"
                  className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer"
                  style={{ color: '#fff', background: 'rgba(6, 182, 212, 0.2)' }}
                  onMouseEnter={(e) => { e.target.style.background = 'rgba(6, 182, 212, 0.4)'; }}
                  onMouseLeave={(e) => { e.target.style.background = 'rgba(6, 182, 212, 0.2)'; }}
                >
                  {user?.role === 'ADMIN' ? 'Admin User' : user?.role === 'DELIVERY_MAN' ? 'Delivery Man' : (user.name || user.email)}
                </Link>
                <button 
                  onClick={handleLogout} 
                  className="px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                  style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', border: '2px solid #ef4444' }}
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4" style={{ borderTop: '1px solid rgba(6, 182, 212, 0.3)' }}>
            <div className="flex flex-col space-y-2">
              <Link 
                to="/" 
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200"
                style={{ color: '#fff' }}
                onMouseEnter={(e) => { e.target.style.background = 'rgba(6, 182, 212, 0.2)'; e.target.style.color = '#06b6d4'; }}
                onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#fff'; }}
              >
                Home
              </Link>
              {user && !isAdmin() && (
                <>
                  <Link 
                    to="/orders" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200"
                    style={{ color: '#fff' }}
                    onMouseEnter={(e) => { e.target.style.background = 'rgba(6, 182, 212, 0.2)'; e.target.style.color = '#06b6d4'; }}
                    onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#fff'; }}
                  >
                    My Orders
                  </Link>
                  <Link 
                    to="/track" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center"
                    style={{ color: '#fff' }}
                    onMouseEnter={(e) => { e.target.style.background = 'rgba(6, 182, 212, 0.2)'; e.target.style.color = '#06b6d4'; }}
                    onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#fff'; }}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Track Order
                  </Link>
                  <Link 
                    to="/cart" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center"
                    style={{ color: '#fff' }}
                    onMouseEnter={(e) => { e.target.style.background = 'rgba(6, 182, 212, 0.2)'; e.target.style.color = '#06b6d4'; }}
                    onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#fff'; }}
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Cart
                    {cartItemCount > 0 && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-bold text-white rounded-full" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' }}>
                        {cartItemCount}
                      </span>
                    )}
                  </Link>
                </>
              )}
              {isDeliveryMan && isDeliveryMan() && (
                <Link 
                  to="/delivery" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200"
                  style={{ color: '#fff' }}
                  onMouseEnter={(e) => { e.target.style.background = 'rgba(6, 182, 212, 0.2)'; e.target.style.color = '#06b6d4'; }}
                  onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#fff'; }}
                >
                  Delivery
                </Link>
              )}
              {isAdmin() && user?.role === 'ADMIN' && (
                <>
                  <Link 
                    to="/admin/dashboard" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200"
                    style={{ color: '#fff' }}
                    onMouseEnter={(e) => { e.target.style.background = 'rgba(6, 182, 212, 0.2)'; e.target.style.color = '#06b6d4'; }}
                    onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#fff'; }}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/admin/products" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200"
                    style={{ color: '#fff' }}
                    onMouseEnter={(e) => { e.target.style.background = 'rgba(6, 182, 212, 0.2)'; e.target.style.color = '#06b6d4'; }}
                    onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#fff'; }}
                  >
                    Products
                  </Link>
                  <Link 
                    to="/admin/orders" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200"
                    style={{ color: '#fff' }}
                    onMouseEnter={(e) => { e.target.style.background = 'rgba(6, 182, 212, 0.2)'; e.target.style.color = '#06b6d4'; }}
                    onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#fff'; }}
                  >
                    Orders
                  </Link>
                </>
              )}
              {!user && (
                <>
                  <Link 
                    to="/login" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200"
                    style={{ color: '#fff' }}
                    onMouseEnter={(e) => { e.target.style.background = 'rgba(6, 182, 212, 0.2)'; e.target.style.color = '#06b6d4'; }}
                    onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#fff'; }}
                  >
                    Login
                  </Link>
                  <Link 
                    to="/admin/login" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2 text-sm font-semibold text-white rounded-lg"
                    style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', border: '2px solid #06b6d4' }}
                  >
                    Admin Login
                  </Link>
                </>
              )}
              {user && (
                <>
                  <div className="px-4 py-2 text-sm font-medium" style={{ color: '#fff', background: 'rgba(6, 182, 212, 0.2)' }}>
                    {user?.role === 'ADMIN' ? 'Admin User' : user?.role === 'DELIVERY_MAN' ? 'Delivery Man' : (user.name || user.email)}
                  </div>
                  <button 
                    onClick={handleLogout} 
                    className="px-4 py-2 text-sm font-semibold text-white rounded-lg text-left"
                    style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', border: '2px solid #ef4444' }}
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

