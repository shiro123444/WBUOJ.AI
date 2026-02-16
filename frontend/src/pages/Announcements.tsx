import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  MegaphoneIcon,
  ExclamationTriangleIcon,
  FireIcon,
  CheckCircleIcon,
  ClockIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline'
import { announcementService, type AnnouncementListItem } from '../services/announcement'
import { Pagination } from '../components/common'
import { GlassPageWrapper } from '../components/ui/GlassCard'

const priorityConfig = {
  URGENT: { icon: FireIcon, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10', borderAccent: 'border-l-red-500', label: '紧急' },
  IMPORTANT: { icon: ExclamationTriangleIcon, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10', borderAccent: 'border-l-orange-500', label: '重要' },
  NORMAL: { icon: MegaphoneIcon, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10', borderAccent: 'border-l-blue-500', label: '普通' },
} as const

export function Announcements() {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentPage = Number(searchParams.get('page')) || 1

  const { data, isLoading, error } = useQuery({
    queryKey: ['announcements', currentPage],
    queryFn: () => announcementService.getAnnouncements({ page: currentPage, limit: 20 }),
  })

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', String(page))
    setSearchParams(params)
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / 86400000)
    if (days < 1) return '今天'
    if (days < 7) return `${days} 天前`
    return date.toLocaleDateString('zh-CN')
  }

  const renderItem = (item: AnnouncementListItem, index: number) => {
    const config = priorityConfig[item.priority as keyof typeof priorityConfig] || priorityConfig.NORMAL
    const Icon = config.icon

    return (
      <Link
        key={item.id}
        to={`/announcements/${item.id}`}
        className={`block glass-card border-l-4 ${config.borderAccent} glass-animate-in glass-animate-in-delay-${Math.min(index % 4 + 1, 4)}`}
      >
        <div className="p-4 flex items-start gap-3">
          <div className={`p-2 rounded-xl ${config.bg} flex-shrink-0`}>
            <Icon className={`w-5 h-5 ${config.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {item.isPinned && <MapPinIcon className="w-4 h-4 text-orange-500 flex-shrink-0" />}
              {item.isRead === false && (
                <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 animate-pulse" />
              )}
              <h3 className="text-base font-medium text-gray-900 dark:text-white truncate">
                {item.title}
              </h3>
              <span className={`glass-badge px-2 py-0.5 text-xs rounded-full ${config.color} flex-shrink-0 font-medium`}>
                {config.label}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="font-medium">{item.createdBy}</span>
              <span className="flex items-center gap-1">
                <ClockIcon className="w-3.5 h-3.5" />{formatTime(item.createdAt)}
              </span>
            </div>
          </div>
          {item.isRead && (
            <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
          )}
        </div>
      </Link>
    )
  }

  return (
    <GlassPageWrapper>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 glass-animate-in">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
            <MegaphoneIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">公告</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">平台动态与重要通知</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 glass-skeleton" />
            ))}
          </div>
        ) : error ? (
          <div className="glass-card-static p-8 text-center text-red-500">加载失败，请重试</div>
        ) : !data || data.announcements.length === 0 ? (
          <div className="glass-card-static p-16 text-center">
            <MegaphoneIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">暂无公告</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {data.announcements.map((item, i) => renderItem(item, i))}
            </div>

            {data.totalPages > 1 && (
              <div className="mt-6">
                <Pagination currentPage={data.page} totalPages={data.totalPages} onPageChange={handlePageChange} />
              </div>
            )}
          </>
        )}
      </div>
    </GlassPageWrapper>
  )
}
