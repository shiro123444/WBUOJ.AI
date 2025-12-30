import { useAuthStore } from '../stores/authStore'

export function Profile() {
  const { user } = useAuthStore()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">个人中心</h1>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {user ? (
          <div>
            <p className="text-gray-600 dark:text-gray-300">欢迎，{user.username}！</p>
            <p className="text-gray-500 dark:text-gray-400 mt-2">个人中心功能将在后续实现...</p>
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-300">请先登录</p>
        )}
      </div>
    </div>
  )
}
