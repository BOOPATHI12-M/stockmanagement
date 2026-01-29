import { useState, useEffect } from 'react'
import { useGoogleLogin } from '@react-oauth/google'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { googleLogin, customerLogin, setPassword, sendOtp, verifyOtp } from '../services/api'
import axios from 'axios'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('signin') // 'signin' or 'signup'
  const [step, setStep] = useState('form') // 'form', 'otp', or 'password'
  const [showPasswordSetup, setShowPasswordSetup] = useState(false)
  const [newUser, setNewUser] = useState(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    otp: ''
  })
  const [passwordSetup, setPasswordSetup] = useState({
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [containerActive, setContainerActive] = useState(false)
  const [animationComplete, setAnimationComplete] = useState(false)

  // Sync container active state with mode
  useEffect(() => {
    setContainerActive(mode === 'signup')
    // Reset animation complete state when mode changes
    setAnimationComplete(false)
    
    // Wait for animation to complete (curved-shape has 1.6s delay + 1.5s transition = ~3.1s)
    // Adding extra buffer for all animations to complete
    const timer = setTimeout(() => {
      setAnimationComplete(true)
    }, 3200) // 3.2 seconds to ensure all animations complete

    return () => clearTimeout(timer)
  }, [mode])

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
          setShowPasswordSetup(true)
        } else {
          login(response.data.token, response.data.user)
          navigate('/')
        }
      } catch (error) {
        console.error('Login error:', error)
        const responseData = error.response?.data
        if (error.response?.status === 400 && responseData?.hasPassword) {
          setMode('signin')
          setStep('form')
          if (responseData?.email) {
            setFormData({...formData, email: responseData.email})
          }
          setError('You already have a password set. Please use email/password to sign in.')
        } else {
          const errorMessage = responseData?.error || error.message || 'Login failed. Please try again.'
          setError(errorMessage)
        }
      } finally {
        setLoading(false)
      }
    },
    onError: () => {
      setError('Google login failed. Please try again.')
    }
  })

  const handleSignIn = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      const loginResponse = await customerLogin({
        email: formData.email,
        password: formData.password
      })
      login(loginResponse.data.token, loginResponse.data.user)
      navigate('/')
    } catch (error) {
      console.error('Login error:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Invalid email or password. Please try again.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSignUpSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      await sendOtp({ email: formData.email })
      setOtpSent(true)
      setStep('otp')
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Failed to send OTP. Please try again.'
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
        otp: formData.otp,
        name: formData.name
      })
      
      if (response.data.hasPassword && response.data.token) {
        login(response.data.token, response.data.user)
        navigate('/')
      } else {
        setNewUser(response.data.user)
        setShowPasswordSetup(true)
        setStep('password')
      }
    } catch (error) {
      console.error('OTP verification error:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Invalid OTP. Please try again.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setError('')
    setLoading(true)
    
    try {
      await sendOtp({ email: formData.email })
      setError('')
      alert('OTP resent successfully!')
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to resend OTP.'
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
      await setPassword({
        email: newUser.email,
        password: passwordSetup.password
      })
      
      const response = await customerLogin({
        email: newUser.email,
        password: passwordSetup.password
      })
      
      login(response.data.token, response.data.user)
      setShowPasswordSetup(false)
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
  if (showPasswordSetup && newUser) {
    return (
      <div className="min-h-screen flex items-center justify-center py-6 px-4 sm:px-6 lg:px-8" style={{ background: '#0f172a' }}>
        <div className="w-full max-w-sm sm:max-w-md space-y-4 sm:space-y-6" style={{ background: 'rgba(30, 41, 59, 0.9)', padding: '1.5rem', borderRadius: '1rem', border: '2px solid #3b82f6' }}>
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-2" style={{ color: '#fff' }}>
              User Verified!
            </h2>
            <p className="text-xs sm:text-sm mb-1" style={{ color: '#ccc' }}>
              Create a secure password for your account
            </p>
          </div>
          
          {error && (
            <div className="error-message">{error}</div>
          )}
          
          <form onSubmit={handleSetPassword} className="space-y-4 sm:space-y-6">
            <div className="input-box">
              <input
                type="password"
                required
                value={passwordSetup.password}
                onChange={(e) => setPasswordSetup({...passwordSetup, password: e.target.value})}
                className="w-full bg-gray-800 text-white placeholder-gray-400 border border-gray-600 rounded-lg px-3 py-2.5 sm:py-3 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
              <label className="text-xs sm:text-sm text-gray-300">Password (min 6 characters)</label>
            </div>
            <div className="input-box">
              <input
                type="password"
                required
                value={passwordSetup.confirmPassword}
                onChange={(e) => setPasswordSetup({...passwordSetup, confirmPassword: e.target.value})}
                className="w-full bg-gray-800 text-white placeholder-gray-400 border border-gray-600 rounded-lg px-3 py-2.5 sm:py-3 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
              <label className="text-xs sm:text-sm text-gray-300">Confirm Password</label>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-2.5 sm:py-3 rounded-lg font-semibold transition-all disabled:opacity-50 text-sm sm:text-base"
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
      <div className="min-h-screen flex items-center justify-center py-6 px-4 sm:px-6 lg:px-8" style={{ background: '#0f172a' }}>
        <div className="w-full max-w-sm sm:max-w-md space-y-4 sm:space-y-6" style={{ background: 'rgba(30, 41, 59, 0.9)', padding: '1.25rem sm:1.5rem', borderRadius: '1rem', border: '2px solid #3b82f6' }}>
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-2" style={{ color: '#fff' }}>
              Verify OTP
            </h2>
            <p className="text-xs sm:text-sm mb-3 sm:mb-4 break-words" style={{ color: '#ccc' }}>
              We've sent a 6-digit OTP to <strong>{formData.email}</strong>
            </p>
          </div>
          
          {error && (
            <div className="error-message">{error}</div>
          )}
          
          <form onSubmit={handleOtpVerify} className="space-y-4 sm:space-y-5">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <label style={{ color: '#fff', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Enter OTP</label>
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
                        
                        // Auto-focus next input
                        if (index < 5 && value) {
                          const nextInput = document.getElementById(`otp-${index + 1}`)
                          if (nextInput) nextInput.focus()
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !formData.otp[index] && index > 0) {
                        const prevInput = document.getElementById(`otp-${index - 1}`)
                        if (prevInput) prevInput.focus()
                      }
                    }}
                    onPaste={(e) => {
                      e.preventDefault()
                      const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
                      if (pastedData) {
                        setFormData({...formData, otp: pastedData})
                        const lastIndex = Math.min(index + pastedData.length - 1, 5)
                        const lastInput = document.getElementById(`otp-${lastIndex}`)
                        if (lastInput) lastInput.focus()
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
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-2.5 sm:py-3 rounded-lg font-semibold transition-all disabled:opacity-50 text-sm sm:text-base"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>
          
          <div className="text-center space-y-2">
            <button
              onClick={handleResendOtp}
              disabled={loading}
              style={{ color: '#3b82f6', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Resend OTP
            </button>
            <br />
            <button
              onClick={() => {
                setStep('form')
                setOtpSent(false)
                setFormData({...formData, otp: ''})
                setError('')
              }}
              style={{ color: '#ccc', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              ← Back to {mode === 'signup' ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Main animated login/register form
  return (
    <div className="min-h-screen flex items-center justify-center py-6 px-2 sm:px-4" style={{ background: '#25252b' }}>
      <div className={`login-container ${containerActive ? 'active' : ''}`} style={{ margin: 'auto' }}>
        <div className="curved-shape"></div>
        <div className="curved-shape2"></div>
        
        {/* Login Form */}
        <div className="form-box Login">
          <h2 className="animation" style={{ '--D': 0, '--S': 21 }}>Login</h2>
          <form onSubmit={(e) => {
            e.preventDefault()
            if (mode === 'signin') {
              handleSignIn(e)
            }
          }}>
            {error && mode === 'signin' && (
              <div className="error-message animation" style={{ '--D': 0.5, '--S': 21.5 }}>{error}</div>
            )}
            <div className="input-box animation" style={{ '--D': 1, '--S': 22 }}>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
              <label>Email</label>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="input-box animation" style={{ '--D': 2, '--S': 23 }}>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
              <label>Password</label>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            {mode === 'signin' && animationComplete && (
              <button 
                className="login-btn" 
                type="submit" 
                disabled={loading}
                onClick={(e) => {
                  if (mode !== 'signin') {
                    e.preventDefault()
                  }
                }}
              >
                {loading ? 'Signing in...' : 'Login'}
              </button>
            )}
            <div className="regi-link animation" style={{ '--D': 4, '--S': 25 }}>
              <p>Don't have an account? <br /> 
                <a 
                  href="#" 
                  className="SignUpLink" 
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setMode('signup')
                    setError('')
                    setFormData({...formData, password: '', name: '', otp: ''})
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  Sign Up
                </a>
              </p>
            </div>
          </form>
        </div>

        {/* Register Form */}
        <div className="form-box Register">
          <h2 className="animation" style={{ '--li': 17, '--S': 0 }}>Register</h2>
          <form onSubmit={(e) => {
            e.preventDefault()
            if (mode === 'signup') {
              handleSignUpSubmit(e)
            }
          }}>
            {error && mode === 'signup' && (
              <div className="error-message animation" style={{ '--li': 16.5, '--S': 0.5 }}>{error}</div>
            )}
            <div className="input-box animation" style={{ '--li': 18, '--S': 1 }}>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
              <label>Email</label>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="input-box animation" style={{ '--li': 19, '--S': 2 }}>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
              <label>Name (Optional)</label>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            {mode === 'signup' && animationComplete && (
              <button 
                className="login-btn" 
                type="submit" 
                disabled={loading}
                onClick={(e) => {
                  if (mode !== 'signup') {
                    e.preventDefault()
                  }
                }}
              >
                {loading ? 'Sending OTP...' : 'Register'}
              </button>
            )}
            <div className="regi-link animation" style={{ '--li': 21, '--S': 4 }}>
              <p>Already have an account? <br />
                <a 
                  href="#" 
                  className="SignInLink" 
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setMode('signin')
                    setError('')
                    setFormData({...formData, password: '', name: '', otp: ''})
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  Sign In
                </a>
              </p>
            </div>
            <div className="animation" style={{ '--li': 21.5, '--S': 4.5, textAlign: 'center', marginTop: '15px' }}>
              <div style={{ color: '#ccc', fontSize: '14px', marginBottom: '10px' }}>Or</div>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (mode === 'signup') {
                    handleGoogleLogin()
                  }
                }}
                disabled={loading || mode !== 'signup'}
                className="login-btn"
              >
                {loading ? 'Connecting...' : 'Connect with Google'}
              </button>
            </div>
          </form>
        </div>

        {/* Info Content - Login */}
        <div className="info-content Login">
          <h2 className="animation" style={{ '--D': 0, '--S': 20 }}>WELCOME BACK!</h2>
          <p className="animation" style={{ '--D': 1, '--S': 21 }}>We are happy to have you with us again. If you need anything, we are here to help.</p>
        </div>

        {/* Info Content - Register */}
        <div className="info-content Register">
          <h2 className="animation" style={{ '--li': 17, '--S': 0 }}>WELCOME!</h2>
          <p className="animation" style={{ '--li': 18, '--S': 1 }}>We're delighted to have you here. If you need any assistance, feel free to reach out.</p>
        </div>
      </div>
    </div>
  )
}
