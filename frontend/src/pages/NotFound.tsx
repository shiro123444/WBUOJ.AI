import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-200 dark:text-gray-700">404</h1>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-4">页面未找到</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          抱歉，您访问的页面不存在或已被移除
        </p>
        <Link
          to="/"
          className="inline-block mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          返回首页
        </Link>
      </div>
    </div>
  )
}
