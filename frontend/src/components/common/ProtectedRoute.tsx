import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { isAuthenticated, user, isTokenExpired } = useAuthStore()
  const location = useLocation()

  // Check if user is authenticated and token is not expired
  if (!isAuthenticated || isTokenExpired()) {
    // Redirect to login page with return URL
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check if admin access is required
  if (requireAdmin && user?.role !== 'admin') {
    // Redirect to home page if not admin
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
