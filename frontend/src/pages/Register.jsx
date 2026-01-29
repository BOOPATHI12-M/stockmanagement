import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { customerLogin, sendOtp, verifyOtp, googleLogin } from '../services/api'
import { useGoogleLogin } from '@react-oauth/google'
import axios from 'axios'

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState('form') // 'form', 'otp', or 'password'
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    otp: ''
  })
  const [passwordSetup, setPasswordSetup] = useState({
    password: '',
    confirmPassword: ''
  })
  const [newUser, setNewUser] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true)
        setError('')
        const userInfoResponse = await axios.get(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
        )
        
        const googleUser = userInfoResponse.data
        const response = await googleLogin({
          email: googleUser.email,
          name: googleUser.name,
          googleId: googleUser.sub,
          imageUrl: googleUser.picture
        })
        
        if (!response.data.hasPassword) {
          setNewUser(response.data.user)
          setStep('password')
        } else {
          login(response.data.token, response.data.user)
          navigate('/')
        }
      } catch (error) {
        console.error('Google login error:', error)
        const errorMessage = error.response?.data?.error || 'Google login failed. Please try again.'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    },
    onError: () => {
      setError('Google login failed. Please try again.')
    }
  })

  const handleSignUpSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      const response = await sendOtp({
        email: formData.email,
        name: formData.name
      })
      
      setNewUser(response.data.user)
      setStep('otp')
    } catch (error) {
      console.error('Sign up error:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Sign up failed. Please try again.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleOtpVerify = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      const response = await verifyOtp({
        email: formData.email,
        otp: formData.otp
      })
      
      setNewUser(response.data.user)
      setStep('password')
    } catch (error) {
      console.error('OTP verification error:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Invalid OTP. Please try again.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSetPassword = async (e) => {
    e.preventDefault()
    setError('')
    
    if (passwordSetup.password !== passwordSetup.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    if (passwordSetup.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    
    setLoading(true)
    
    try {
      const response = await customerLogin({
        email: newUser.email,
        password: passwordSetup.password
      })
      
      login(response.data.token, response.data.user)
      navigate('/')
    } catch (error) {
      console.error('Set password error:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Failed to set password'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Password setup screen
  if (step === 'password' && newUser) {
    return (
      <div className="min-h-screen flex items-center justify-center py-6 px-4" style={{ background: '#0f172a' }}>
        <div className="w-full max-w-md space-y-6" style={{ background: 'rgba(30, 41, 59, 0.9)', padding: '1.5rem', borderRadius: '1rem', border: '2px solid #3b82f6' }}>
          <div className="text-center">
            <h2 className="text-3xl font-extrabold mb-2" style={{ color: '#fff' }}>
              User Verified!
            </h2>
            <p className="text-sm mb-1" style={{ color: '#ccc' }}>
              Create a secure password for your account
            </p>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSetPassword} className="space-y-6">
            <div className="input-box">
              <input
                type="password"
                required
                value={passwordSetup.password}
                onChange={(e) => setPasswordSetup({...passwordSetup, password: e.target.value})}
                className="w-full bg-gray-800 text-white placeholder-gray-400 border border-gray-600 rounded-lg px-3 py-3 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
              <label className="text-sm text-gray-300">Password (min 6 characters)</label>
            </div>
            <div className="input-box">
              <input
                type="password"
                required
                value={passwordSetup.confirmPassword}
                onChange={(e) => setPasswordSetup({...passwordSetup, confirmPassword: e.target.value})}
                className="w-full bg-gray-800 text-white placeholder-gray-400 border border-gray-600 rounded-lg px-3 py-3 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
              <label className="text-sm text-gray-300">Confirm Password</label>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
            >
              {loading ? 'Setting Password...' : 'Set Password & Continue'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // OTP verification screen
  if (step === 'otp') {
    return (
      <div className="min-h-screen flex items-center justify-center py-6 px-4" style={{ background: '#0f172a' }}>
        <div className="w-full max-w-md space-y-6" style={{ background: 'rgba(30, 41, 59, 0.9)', padding: '1.5rem', borderRadius: '1rem', border: '2px solid #3b82f6' }}>
          <div className="text-center">
            <h2 className="text-3xl font-extrabold mb-2" style={{ color: '#fff' }}>
              Verify OTP
            </h2>
            <p className="text-sm mb-4 break-words" style={{ color: '#ccc' }}>
              We've sent a 6-digit OTP to <strong>{formData.email}</strong>
            </p>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleOtpVerify} className="space-y-5">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <label style={{ color: '#fff', fontSize: '13px', fontWeight: '600' }}>Enter OTP</label>
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <input
                    key={index}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={formData.otp[index] || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '')
                      if (value) {
                        const newOtp = formData.otp.split('')
                        newOtp[index] = value
                        const updatedOtp = newOtp.join('').slice(0, 6)
                        setFormData({...formData, otp: updatedOtp})
                        
                        if (index < 5 && value) {
                          const nextInput = document.getElementById(`otp-${index + 1}`)
                          if (nextInput) nextInput.focus()
                        }
                      }
                    }}
                    id={`otp-${index}`}
                    style={{
                      width: '45px',
                      height: '52px',
                      textAlign: 'center',
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: '#fff',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '2px solid rgba(6, 182, 212, 0.3)',
                      borderRadius: '8px',
                      outline: 'none',
                      transition: 'all 0.3s'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#06b6d4'
                      e.target.style.boxShadow = '0 0 0 3px rgba(6, 182, 212, 0.2)'
                      e.target.style.background = 'rgba(6, 182, 212, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(6, 182, 212, 0.3)'
                      e.target.style.boxShadow = 'none'
                      e.target.style.background = 'rgba(255, 255, 255, 0.05)'
                    }}
                  />
                ))}
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || formData.otp.length !== 6}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>
          
          <div className="text-center space-y-2">
            <button
              onClick={() => {
                setStep('form')
                setFormData({...formData, otp: ''})
                setError('')
              }}
              style={{ color: '#ccc', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Main register form
  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Left Panel - Welcome Section */}
        <div className="auth-left">
          <h2>WELCOME!</h2>
          <p>
            We're delighted to have you here.
            If you need any assistance, feel free to reach out.
          </p>
        </div>

        {/* Right Panel - Register Form */}
        <div className="auth-right">
          <h2>Register</h2>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSignUpSubmit}>
            <input
              type="email"
              placeholder="Email"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
            <input
              type="text"
              placeholder="Name (Optional)"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />

            <button
              type="submit"
              disabled={loading}
              className="primary-btn"
            >
              {loading ? 'Sending OTP...' : 'Register'}
            </button>

            <p className="link">
              Already have an account?{' '}
              <a href="/login">Sign In</a>
            </p>

            <div className="divider">Or</div>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                handleGoogleLogin()
              }}
              disabled={loading}
              className="google-btn"
            >
              {loading ? 'Connecting...' : 'Connect with Google'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
