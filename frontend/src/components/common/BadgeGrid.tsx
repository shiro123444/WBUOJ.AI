import { useQuery } from '@tanstack/react-query'
import { badgeService } from '../../services/badge'
import type { BadgeOverviewItem } from '../../services/badge'
import { LockClosedIcon } from '@heroicons/react/24/outline'

interface BadgeGridProps {
  userId?: string // 如果传了userId，展示该用户的徽章；否则展示当前用户的概览
}

export function BadgeGrid({ userId }: BadgeGridProps) {
  const { data: badges, isLoading } = useQuery<BadgeOverviewItem[]>({
    queryKey: userId ? ['user-badges', userId] : ['my-badge-overview'],
    queryFn: () => (userId ? badgeService.getUserBadges(userId) as any : badgeService.getMyBadgeOverview()),
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl h-24" />
        ))}
      </div>
    )
  }

  if (!badges || badges.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
        暂无徽章数据
      </p>
    )
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
      {badges.map((badge: BadgeOverviewItem) => (
        <div
          key={badge.id}
          className={`relative rounded-xl p-3 text-center transition-all ${
            badge.earned
              ? 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md'
              : 'bg-gray-100 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 opacity-50'
          }`}
          title={badge.description}
        >
          <div className="text-3xl mb-1">{badge.icon}</div>
          <div className={`text-xs font-medium truncate ${
            badge.earned
              ? 'text-gray-900 dark:text-white'
              : 'text-gray-400 dark:text-gray-500'
          }`}>
            {badge.name}
          </div>
          {badge.earned && badge.earnedAt && (
            <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
              {new Date(badge.earnedAt).toLocaleDateString('zh-CN')}
            </div>
          )}
          {!badge.earned && (
            <LockClosedIcon className="h-3.5 w-3.5 text-gray-400 absolute top-1.5 right-1.5" />
          )}
        </div>
      ))}
    </div>
  )
}
