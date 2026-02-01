import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { adminLogin } from '../services/api'

function LogoDisplay() {
  const [logoError, setLogoError] = useState(false)
  
  if (logoError) {
    return (
      <div className="flex items-center justify-center h-20 w-20 rounded-full shadow-lg" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' }}>
        <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
    )
  }
  
  return (
    <img 
      src="/logo.svg" 
      alt="Stock Management Logo" 
      className="w-auto object-contain"
      style={{ maxHeight: '150px', maxWidth: '100%' }}
      onError={() => setLogoError(true)}
    />
  )
}

export default function AdminLogin() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await adminLogin(formData)
      login(response.data.token, response.data.user)
      
      // Navigate based on user role
      const userRole = response.data.user.role
      if (userRole === 'DELIVERY_MAN') {
        // Navigate to delivery man dashboard
        navigate('/delivery')
      } else {
        // Navigate to admin dashboard
        navigate('/admin/dashboard')
      }
    } catch (error) {
      setError('Invalid username or password')
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
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
      <div className="max-w-md w-full space-y-8 animate-fade-in" style={{ background: '#ffffff', borderRadius: '1rem', padding: '2rem', boxShadow: '0 10px 40px rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center mb-6">
            <LogoDisplay />
          </div>
          <h2 className="text-3xl font-extrabold mb-2" style={{ color: '#1e293b' }}>
            Login
          </h2>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="border-l-4 p-4 rounded-lg animate-shake" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444' }}>
              <div className="flex">
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#ef4444' }}>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p style={{ color: '#dc2626' }}>{error}</p>
              </div>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-semibold mb-2" style={{ color: '#1e293b' }}>
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg focus:outline-none transition-all duration-200"
                style={{ background: '#f8fafc', border: '2px solid #e2e8f0', color: '#1e293b' }}
                onFocus={(e) => { e.target.style.borderColor = '#06b6d4'; e.target.style.boxShadow = '0 0 0 3px rgba(6, 182, 212, 0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                placeholder="Enter your username"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-2" style={{ color: '#1e293b' }}>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg focus:outline-none transition-all duration-200"
                style={{ background: '#f8fafc', border: '2px solid #e2e8f0', color: '#1e293b' }}
                onFocus={(e) => { e.target.style.borderColor = '#06b6d4'; e.target.style.boxShadow = '0 0 0 3px rgba(6, 182, 212, 0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                placeholder="Enter your password"
              />
            </div>
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
                Signing in...
              </span>
            ) : (
              'Sign in'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

