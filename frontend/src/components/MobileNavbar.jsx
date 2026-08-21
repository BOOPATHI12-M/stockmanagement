import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Mobile Navbar Component with Hamburger Menu
 * Shows for screens < 768px
 */
export default function MobileNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/login');
  };

  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="bg-slate-900 text-white shadow-lg fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2" onClick={closeMenu}>
          <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center" style={{ background: 'rgba(6, 182, 212, 0.15)', border: '2px solid rgba(6, 182, 212, 0.5)' }}>
            <img
              src="/logo.png"
              alt="Stock Management Logo"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          </div>
          <span className="font-bold text-lg">Stock Management</span>
        </Link>

        {/* Hamburger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-slate-800 transition-colors touch-manipulation"
          aria-label="Toggle menu"
          style={{ minWidth: '44px', minHeight: '44px' }}
        >
          <div className="w-6 h-5 flex flex-col justify-between">
            <span
              className={`block h-0.5 w-6 bg-white transition-all duration-300 ${
                isOpen ? 'rotate-45 translate-y-2' : ''
              }`}
            ></span>
            <span
              className={`block h-0.5 w-6 bg-white transition-all duration-300 ${
                isOpen ? 'opacity-0' : ''
              }`}
            ></span>
            <span
              className={`block h-0.5 w-6 bg-white transition-all duration-300 ${
                isOpen ? '-rotate-45 -translate-y-2' : ''
              }`}
            ></span>
          </div>
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeMenu}
        style={{ top: '60px' }}
      >
        <div
          className={`absolute right-0 top-0 bottom-0 w-64 bg-slate-900 shadow-xl transform transition-transform duration-300 ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col h-full">
            {/* User Info */}
            {user && (
              <div className="p-4 border-b border-slate-700">
                <p className="text-sm text-gray-400">Logged in as</p>
                <p className="font-semibold truncate">{user.name || user.email}</p>
                <p className="text-xs text-cyan-400">{user.role}</p>
              </div>
            )}

            {/* Navigation Links */}
            <div className="flex-1 overflow-y-auto py-4">
              {user ? (
                <>
                  {user.role === 'CUSTOMER' && (
                    <>
                      <MobileNavLink to="/" onClick={closeMenu}>
                        🏠 Home
                      </MobileNavLink>
                      <MobileNavLink to="/orders" onClick={closeMenu}>
                        📦 My Orders
                      </MobileNavLink>
                      <MobileNavLink to="/cart" onClick={closeMenu}>
                        🛒 Cart
                      </MobileNavLink>
                      <MobileNavLink to="/profile" onClick={closeMenu}>
                        👤 Profile
                      </MobileNavLink>
                    </>
                  )}

                  {user.role === 'ADMIN' && (
                    <>
                      <MobileNavLink to="/admin/dashboard" onClick={closeMenu}>
                        📊 Dashboard
                      </MobileNavLink>
                      <MobileNavLink to="/admin/products" onClick={closeMenu}>
                        📦 Products
                      </MobileNavLink>
                      <MobileNavLink to="/admin/stock" onClick={closeMenu}>
                        📈 Stock
                      </MobileNavLink>
                      <MobileNavLink to="/admin/orders" onClick={closeMenu}>
                        🛍️ Orders
                      </MobileNavLink>
                      <MobileNavLink to="/admin/suppliers" onClick={closeMenu}>
                        🏭 Suppliers
                      </MobileNavLink>
                      <MobileNavLink to="/admin/users" onClick={closeMenu}>
                        👥 Users
                      </MobileNavLink>
                      <MobileNavLink to="/admin/delivery" onClick={closeMenu}>
                        🚚 Delivery
                      </MobileNavLink>
                    </>
                  )}

                  {user.role === 'DELIVERY_MAN' && (
                    <>
                      <MobileNavLink to="/delivery/dashboard" onClick={closeMenu}>
                        📊 Dashboard
                      </MobileNavLink>
                      <MobileNavLink to="/delivery/orders" onClick={closeMenu}>
                        📦 My Deliveries
                      </MobileNavLink>
                    </>
                  )}
                </>
              ) : (
                <>
                  <MobileNavLink to="/" onClick={closeMenu}>
                    🏠 Home
                  </MobileNavLink>
                  <MobileNavLink to="/login" onClick={closeMenu}>
                    🔑 Login
                  </MobileNavLink>
                </>
              )}
            </div>

            {/* Logout Button */}
            {user && (
              <div className="p-4 border-t border-slate-700">
                <button
                  onClick={handleLogout}
                  className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors touch-manipulation"
                  style={{ minHeight: '44px' }}
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add padding to body to prevent content hiding under fixed navbar */}
      <style jsx>{`
        body {
          padding-top: 60px;
        }
      `}</style>
    </nav>
  );
}

/**
 * Mobile Navigation Link Component
 */
function MobileNavLink({ to, children, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="block px-6 py-3 text-white hover:bg-slate-800 transition-colors touch-manipulation border-l-4 border-transparent hover:border-cyan-500"
      style={{ minHeight: '44px' }}
    >
      {children}
    </Link>
  );
}
