import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { authService } from '../services/auth'

export function OAuthCallback() {
  const [error, setError] = useState<string | null>(null)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      // Get token from URL fragment
      const hash = window.location.hash.substring(1)
      const params = new URLSearchParams(hash)
      const token = params.get('token')
      const expiresAt = params.get('expiresAt')

      if (!token || !expiresAt) {
        setError('OAuth 登录失败：未收到有效的认证信息')
        return
      }

      try {
        // Set token in API client
        const { api } = await import('../services/api')
        api.setToken(token)

        // Get user info
        const { user } = await authService.getCurrentUser()
        
        // Set auth state
        setAuth(user, token, parseInt(expiresAt, 10))
        
        // Redirect to home
        navigate('/', { replace: true })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'OAuth 登录失败')
      }
    }

    handleCallback()
  }, [navigate, setAuth])

  if (error) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-2">登录失败</h2>
            <p>{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              返回登录
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">正在完成登录...</p>
      </div>
    </div>
  )
}
