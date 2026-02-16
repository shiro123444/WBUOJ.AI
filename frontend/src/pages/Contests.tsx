import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  DocumentTextIcon,
  FunnelIcon,
  ArrowRightIcon,
  SignalIcon,
} from '@heroicons/react/24/outline'
import { contestService } from '../services'
import { Pagination } from '../components/common'
import { GlassPageWrapper } from '../components/ui/GlassCard'
import type { Contest } from '../services/contest'

type StatusFilter = 'all' | 'UPCOMING' | 'RUNNING' | 'ENDED'

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'RUNNING', label: '进行中' },
  { value: 'UPCOMING', label: '即将开始' },
  { value: 'ENDED', label: '已结束' },
]

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getTimeInfo(contest: Contest) {
  const now = Date.now()
  const start = new Date(contest.startTime).getTime()
  const end = new Date(contest.endTime).getTime()

  if (contest.status === 'UPCOMING') {
    const diff = start - now
    const hours = Math.floor(diff / 3600000)
    const mins = Math.floor((diff % 3600000) / 60000)
    if (hours > 24) return `${Math.floor(hours / 24)} 天后开始`
    return hours > 0 ? `${hours}h ${mins}m 后开始` : `${mins}m 后开始`
  }
  if (contest.status === 'RUNNING') {
    const diff = end - now
    const hours = Math.floor(diff / 3600000)
    const mins = Math.floor((diff % 3600000) / 60000)
    return hours > 0 ? `剩余 ${hours}h ${mins}m` : `剩余 ${mins}m`
  }
  return '已结束'
}

const statusConfig: Record<string, { dot: string; text: string; bg: string; label: string }> = {
  UPCOMING: {
    dot: 'bg-blue-500',
    text: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-500/10',
    label: '即将开始',
  },
  RUNNING: {
    dot: 'bg-green-500 animate-pulse',
    text: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-500/10',
    label: '进行中',
  },
  ENDED: {
    dot: 'bg-gray-400',
    text: 'text-gray-500 dark:text-gray-400',
    bg: 'bg-gray-500/10',
    label: '已结束',
  },
}

function ContestCard({ contest }: { contest: Contest }) {
  const config = statusConfig[contest.status] || statusConfig.ENDED

  return (
    <Link to={`/contests/${contest.id}`} className="block group">
      <div className="glass-card p-6 h-full flex flex-col">
        {/* Status + Time */}
        <div className="flex items-center justify-between mb-4">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
            {config.label}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            {getTimeInfo(contest)}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2 line-clamp-2 flex-grow-0">
          {contest.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-5 flex-grow">
          {contest.description}
        </p>

        {/* Divider */}
        <div className="border-t border-gray-200/50 dark:border-white/5 pt-4">
          {/* Meta row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5">
                <ClockIcon className="h-3.5 w-3.5" />
                {formatDateTime(contest.startTime)}
              </span>
              <span className="flex items-center gap-1.5">
                <DocumentTextIcon className="h-3.5 w-3.5" />
                {contest.problemCount} 题
              </span>
              <span className="flex items-center gap-1.5">
                <UserGroupIcon className="h-3.5 w-3.5" />
                {contest.participantCount}{contest.maxParticipants ? `/${contest.maxParticipants}` : ''}
              </span>
            </div>
            <ArrowRightIcon className="h-4 w-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </div>
    </Link>
  )
}

export function Contests() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const limit = 12

  const { data, isLoading, error } = useQuery({
    queryKey: ['contests', page, statusFilter],
    queryFn: () =>
      contestService.getContests({
        page,
        limit,
        status: statusFilter === 'all' ? undefined : statusFilter,
      }),
  })

  return (
    <GlassPageWrapper>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 glass-animate-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
              <SignalIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">比赛</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">参加比赛，挑战自我</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setStatusFilter(opt.value); setPage(1) }}
                className={`px-4 py-2 text-sm rounded-xl font-medium transition-all ${
                  statusFilter === opt.value
                    ? 'glass-btn glass-btn-active'
                    : 'glass-btn text-gray-600 dark:text-gray-400'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-52 glass-skeleton" />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="glass-card-static p-8 text-center">
            <p className="text-red-500 dark:text-red-400">加载失败，请稍后重试</p>
          </div>
        )}

        {/* Empty */}
        {data && data.contests.length === 0 && (
          <div className="glass-card-static p-16 text-center">
            <CalendarIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">暂无比赛</p>
          </div>
        )}

        {/* Contest Cards */}
        {data && data.contests.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {data.contests.map((contest, i) => (
                <div key={contest.id} className={`glass-animate-in glass-animate-in-delay-${Math.min(i % 4 + 1, 4)}`}>
                  <ContestCard contest={contest} />
                </div>
              ))}
            </div>

            {data.totalPages > 1 && (
              <div className="mt-8">
                <Pagination currentPage={data.page} totalPages={data.totalPages} onPageChange={setPage} />
              </div>
            )}
          </>
        )}
      </div>
    </GlassPageWrapper>
  )
}
