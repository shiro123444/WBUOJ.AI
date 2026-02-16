import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  TrophyIcon,
  FireIcon,
  ChartBarIcon,
  BoltIcon,
} from '@heroicons/react/24/outline'
import { leaderboardService } from '../services'
import { Pagination } from '../components/common'
import { GlassPageWrapper } from '../components/ui/GlassCard'
import type { LeaderboardEntry } from '../services/leaderboard'

type SortBy = 'score' | 'solvedCount' | 'streak'

const SORT_OPTIONS: { value: SortBy; label: string; icon: typeof TrophyIcon }[] = [
  { value: 'score', label: '总分', icon: TrophyIcon },
  { value: 'solvedCount', label: '通过数', icon: ChartBarIcon },
  { value: 'streak', label: '连续打卡', icon: FireIcon },
]

const ITEMS_PER_PAGE = 20

function TopThreeCard({ entry, position }: { entry: LeaderboardEntry; position: 1 | 2 | 3 }) {
  const config = {
    1: {
      glow: 'stat-glow-yellow',
      gradient: 'from-yellow-400 to-amber-500',
      textColor: 'text-yellow-600 dark:text-yellow-400',
      size: 'w-16 h-16',
      ringColor: 'ring-yellow-400/50',
    },
    2: {
      glow: '',
      gradient: 'from-gray-300 to-gray-400',
      textColor: 'text-gray-500 dark:text-gray-400',
      size: 'w-14 h-14',
      ringColor: 'ring-gray-400/50',
    },
    3: {
      glow: '',
      gradient: 'from-amber-600 to-orange-600',
      textColor: 'text-amber-700 dark:text-amber-500',
      size: 'w-14 h-14',
      ringColor: 'ring-amber-500/50',
    },
  }[position]

  return (
    <div className={`glass-card ${config.glow} p-5 text-center glass-animate-in glass-animate-in-delay-${position}`}>
      <div className={`inline-flex items-center justify-center ${config.size} rounded-full bg-gradient-to-br ${config.gradient} text-white font-bold text-xl mb-3 ring-4 ${config.ringColor}`}>
        {position}
      </div>
      <Link to={`/profile/${entry.id}`} className="block group">
        <div className="flex justify-center mb-2">
          {entry.avatar ? (
            <img src={entry.avatar} alt="" className="w-12 h-12 rounded-full ring-2 ring-white/50 dark:ring-white/20" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
              {entry.username[0]?.toUpperCase()}
            </div>
          )}
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
          {entry.username}
        </h3>
      </Link>
      <div className={`text-2xl font-bold mt-2 ${config.textColor}`}>{entry.score}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">积分</div>
      <div className="flex justify-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <ChartBarIcon className="w-3.5 h-3.5 text-green-500" />
          {entry.solvedCount}
        </span>
        <span className="flex items-center gap-1">
          <FireIcon className="w-3.5 h-3.5 text-orange-500" />
          {entry.streak}天
        </span>
      </div>
    </div>
  )
}

export function Leaderboard() {
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<SortBy>('score')

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', page, sortBy],
    queryFn: () => leaderboardService.getLeaderboard({ page, limit: ITEMS_PER_PAGE, sortBy }),
  })

  const topThree = page === 1 ? (data?.entries.slice(0, 3) ?? []) : []
  const restEntries = page === 1 ? (data?.entries.slice(3) ?? []) : (data?.entries ?? [])

  return (
    <GlassPageWrapper>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 glass-animate-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 text-white">
              <TrophyIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">排行榜</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">与高手同台竞技</p>
            </div>
          </div>
          <div className="flex gap-2">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setSortBy(opt.value); setPage(1) }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  sortBy === opt.value ? 'glass-btn glass-btn-active' : 'glass-btn text-gray-600 dark:text-gray-400'
                }`}
              >
                <opt.icon className="h-4 w-4" />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Top 3 Podium */}
        {page === 1 && topThree.length >= 3 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="sm:mt-8 order-2 sm:order-1">
              <TopThreeCard entry={topThree[1]} position={2} />
            </div>
            <div className="order-1 sm:order-2">
              <TopThreeCard entry={topThree[0]} position={1} />
            </div>
            <div className="sm:mt-8 order-3">
              <TopThreeCard entry={topThree[2]} position={3} />
            </div>
          </div>
        )}

        {/* Table */}
        <div className="glass-card-static overflow-hidden glass-animate-in glass-animate-in-delay-4">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-14 glass-skeleton" />
              ))}
            </div>
          ) : !data || restEntries.length === 0 ? (
            <div className="p-12 text-center">
              <TrophyIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">暂无排行数据</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200/50 dark:border-white/5">
                    <th className="px-5 py-3.5 w-16 text-center font-medium">排名</th>
                    <th className="px-5 py-3.5 font-medium">用户</th>
                    <th className="px-5 py-3.5 text-center font-medium">
                      <span className="flex items-center justify-center gap-1"><BoltIcon className="h-3.5 w-3.5" /> 总分</span>
                    </th>
                    <th className="px-5 py-3.5 text-center font-medium hidden sm:table-cell">通过数</th>
                    <th className="px-5 py-3.5 text-center font-medium hidden md:table-cell">提交数</th>
                    <th className="px-5 py-3.5 text-center font-medium hidden md:table-cell">通过率</th>
                    <th className="px-5 py-3.5 text-center font-medium">
                      <span className="flex items-center justify-center gap-1"><FireIcon className="h-3.5 w-3.5" /> 连续</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {restEntries.map((entry: LeaderboardEntry) => (
                    <tr key={entry.id} className="glass-row border-b border-gray-100/50 dark:border-white/[0.03] last:border-0">
                      <td className="px-5 py-3.5 text-center">
                        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">#{entry.rank}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <Link to={`/profile/${entry.id}`} className="flex items-center gap-3 group">
                          {entry.avatar ? (
                            <img src={entry.avatar} alt="" className="h-9 w-9 rounded-full ring-2 ring-white/50 dark:ring-white/10" />
                          ) : (
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                              {entry.username[0]?.toUpperCase()}
                            </div>
                          )}
                          <span className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {entry.username}
                          </span>
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="font-bold text-blue-600 dark:text-blue-400">{entry.score}</span>
                      </td>
                      <td className="px-5 py-3.5 text-center hidden sm:table-cell">
                        <span className="text-green-600 dark:text-green-400 font-medium">{entry.solvedCount}</span>
                      </td>
                      <td className="px-5 py-3.5 text-center text-gray-600 dark:text-gray-400 hidden md:table-cell">
                        {entry.submissionCount}
                      </td>
                      <td className="px-5 py-3.5 text-center hidden md:table-cell">
                        <span className="glass-badge px-2 py-0.5 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300">
                          {entry.acceptRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 text-orange-500 font-medium">
                          <FireIcon className="h-4 w-4" />{entry.streak}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {data && data.totalPages > 1 && (
          <div className="mt-6">
            <Pagination currentPage={page} totalPages={data.totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </GlassPageWrapper>
  )
}
