import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  MegaphoneIcon,
  ExclamationTriangleIcon,
  FireIcon,
  ArrowLeftIcon,
  ClockIcon,
  UserIcon,
} from '@heroicons/react/24/outline'
import { announcementService } from '../services/announcement'
import { EnhancedMarkdown } from '../components/common'
import { GlassPageWrapper } from '../components/ui/GlassCard'

const priorityConfig = {
  URGENT: { icon: FireIcon, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10', borderAccent: 'border-l-red-500', label: '紧急' },
  IMPORTANT: { icon: ExclamationTriangleIcon, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10', borderAccent: 'border-l-orange-500', label: '重要' },
  NORMAL: { icon: MegaphoneIcon, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10', borderAccent: 'border-l-blue-500', label: '普通' },
} as const

export function AnnouncementDetail() {
  const { id } = useParams<{ id: string }>()

  const { data, isLoading, error } = useQuery({
    queryKey: ['announcement', id],
    queryFn: () => announcementService.getAnnouncementById(id!),
    enabled: !!id,
  })

  const announcement = data?.announcement
  const config = announcement
    ? priorityConfig[announcement.priority as keyof typeof priorityConfig] || priorityConfig.NORMAL
    : priorityConfig.NORMAL
  const Icon = config.icon

  if (isLoading) {
    return (
      <GlassPageWrapper>
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
          <div className="h-8 w-48 glass-skeleton" />
          <div className="h-64 glass-skeleton" />
        </div>
      </GlassPageWrapper>
    )
  }

  if (error || !announcement) {
    return (
      <GlassPageWrapper>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="glass-card-static p-12 text-center">
            <MegaphoneIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-red-500">公告不存在或加载失败</p>
            <Link to="/announcements" className="glass-btn inline-flex items-center gap-1 mt-4 px-4 py-2 text-sm">
              <ArrowLeftIcon className="w-4 h-4" />返回公告列表
            </Link>
          </div>
        </div>
      </GlassPageWrapper>
    )
  }

  return (
    <GlassPageWrapper>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          to="/announcements"
          className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-4 transition-colors glass-animate-in"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          返回公告列表
        </Link>

        <div className={`glass-card-static border-l-4 ${config.borderAccent} p-6 glass-animate-in glass-animate-in-delay-1`}>
          {/* Header */}
          <div className="flex items-start gap-3 mb-5">
            <div className={`p-2.5 rounded-xl ${config.bg} flex-shrink-0`}>
              <Icon className={`w-6 h-6 ${config.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{announcement.title}</h1>
                <span className={`glass-badge px-2 py-0.5 text-xs rounded-full ${config.color} font-medium`}>
                  {config.label}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <UserIcon className="w-4 h-4" />
                  {announcement.createdByName}
                </span>
                <span className="flex items-center gap-1">
                  <ClockIcon className="w-4 h-4" />
                  {new Date(announcement.createdAt).toLocaleString('zh-CN')}
                </span>
                {announcement.updatedAt !== announcement.createdAt && (
                  <span className="text-xs text-gray-400">
                    （更新于 {new Date(announcement.updatedAt).toLocaleString('zh-CN')}）
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="border-t border-white/20 dark:border-white/10 pt-5">
            <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
              <EnhancedMarkdown content={announcement.content} />
            </div>
          </div>
        </div>
      </div>
    </GlassPageWrapper>
  )
}
