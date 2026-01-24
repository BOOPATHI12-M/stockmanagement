import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading, isAdmin } = useAuth()

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  if (!user) {
    return <Navigate to={adminOnly ? '/admin/login' : '/login'} replace />
  }

  if (adminOnly && !isAdmin()) {
    return <Navigate to="/" replace />
  }

  return children
}

