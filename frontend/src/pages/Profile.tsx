import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import { userService } from '../services'
import type { UserProfile } from '../services/user'
import { Link } from 'react-router-dom'
import {
  UserCircleIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  FireIcon,
  TrophyIcon,
  CodeBracketIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'
import { StatusBadge, DifficultyBadge } from '../components/common'
import { GlassPageWrapper } from '../components/ui/GlassCard'

export function Profile() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [bio, setBio] = useState('')

  const { data: profile, isLoading, error } = useQuery<UserProfile>({
    queryKey: ['profile', user?.id],
    queryFn: () => userService.getMyProfile(),
    enabled: !!user,
    onSuccess: (data: UserProfile) => setBio(data.bio || ''),
  } as any)

  const updateMutation = useMutation({
    mutationFn: (data: { bio: string }) => userService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      setIsEditing(false)
    },
  })

  if (!user) {
    return (
      <GlassPageWrapper>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <p className="text-gray-500 dark:text-gray-400">请先登录以查看个人中心</p>
          <Link to="/login" className="mt-4 inline-block text-blue-600 hover:text-blue-500">去登录</Link>
        </div>
      </GlassPageWrapper>
    )
  }

  if (isLoading) {
    return (
      <GlassPageWrapper>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div className="h-48 glass-skeleton" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-28 glass-skeleton" />)}
          </div>
          <div className="h-64 glass-skeleton" />
        </div>
      </GlassPageWrapper>
    )
  }

  if (error || !profile) {
    return (
      <GlassPageWrapper>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <p className="text-red-500">加载个人信息失败</p>
        </div>
      </GlassPageWrapper>
    )
  }

  const totalSolved = profile.solvedByDifficulty.easy + profile.solvedByDifficulty.medium + profile.solvedByDifficulty.hard

  return (
    <GlassPageWrapper>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Profile Header Card */}
        <div className="glass-card-static p-6 glass-animate-in">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.username} className="w-20 h-20 rounded-2xl ring-4 ring-white/50 dark:ring-white/10 shadow-lg" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 via-purple-500 to-cyan-400 flex items-center justify-center text-white text-2xl font-bold ring-4 ring-white/50 dark:ring-white/10 shadow-lg">
                  {profile.username[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.username}</h1>
                <span className={`glass-badge px-2.5 py-0.5 text-xs rounded-full font-medium ${
                  profile.role === 'admin'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-blue-600 dark:text-blue-400'
                }`}>
                  {profile.role === 'admin' ? '管理员' : '学生'}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{profile.email}</p>
              {isEditing ? (
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="text"
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="写一句个性签名..."
                    maxLength={500}
                    className="flex-1 px-3 py-1.5 text-sm glass-input rounded-xl text-gray-900 dark:text-white focus:outline-none"
                  />
                  <button
                    onClick={() => updateMutation.mutate({ bio })}
                    disabled={updateMutation.isPending}
                    className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                  >
                    <CheckIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => { setIsEditing(false); setBio(profile.bio || '') }}
                    className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="mt-2 flex items-center gap-2">
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {profile.bio || '这个人很懒，什么都没写...'}
                  </p>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={TrophyIcon} label="积分" value={profile.score} color="yellow" delay={1} />
          <StatCard icon={CodeBracketIcon} label="已解决" value={totalSolved} color="green" delay={2} />
          <StatCard icon={FireIcon} label="连续打卡" value={`${profile.streak} 天`} color="orange" delay={3} />
          <StatCard
            icon={ChartBarIcon}
            label="通过率"
            value={profile.submissionCount > 0
              ? `${Math.round((totalSolved / profile.submissionCount) * 100)}%`
              : '0%'}
            color="blue"
            delay={4}
          />
        </div>

        {/* Solved by Difficulty */}
        <div className="glass-card-static p-6 glass-animate-in glass-animate-in-delay-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-gradient-to-b from-green-400 to-blue-500 rounded-full" />
            题目通过统计
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <DifficultyStatCard label="简单" count={profile.solvedByDifficulty.easy} color="green" />
            <DifficultyStatCard label="中等" count={profile.solvedByDifficulty.medium} color="yellow" />
            <DifficultyStatCard label="困难" count={profile.solvedByDifficulty.hard} color="red" />
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="glass-card-static p-6 glass-animate-in glass-animate-in-delay-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-gradient-to-b from-blue-400 to-purple-500 rounded-full" />
            最近提交
          </h2>
          {profile.recentSubmissions.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm py-4 text-center">暂无提交记录</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200/50 dark:border-white/5">
                    <th className="pb-3 font-medium">题目</th>
                    <th className="pb-3 font-medium">状态</th>
                    <th className="pb-3 font-medium hidden sm:table-cell">语言</th>
                    <th className="pb-3 font-medium">时间</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.recentSubmissions.map(sub => (
                    <tr key={sub.id} className="glass-row border-b border-gray-100/50 dark:border-white/[0.03] last:border-0">
                      <td className="py-3">
                        <Link
                          to={`/problems/${sub.problemId}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                          {sub.problemTitle}
                        </Link>
                      </td>
                      <td className="py-3">
                        <StatusBadge status={sub.status as any} />
                      </td>
                      <td className="py-3 hidden sm:table-cell">
                        <span className="glass-badge px-2 py-0.5 rounded-full text-xs text-gray-600 dark:text-gray-300">
                          {sub.language}
                        </span>
                      </td>
                      <td className="py-3 text-gray-500 dark:text-gray-400">
                        {new Date(sub.createdAt).toLocaleDateString('zh-CN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Badges */}
        {profile.badges && profile.badges.length > 0 && (
          <div className="glass-card-static p-6 glass-animate-in glass-animate-in-delay-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-gradient-to-b from-purple-400 to-pink-500 rounded-full" />
              徽章
            </h2>
            <div className="flex flex-wrap gap-3">
              {profile.badges.map(badge => (
                <div
                  key={badge.id}
                  className="glass-card flex items-center gap-2 px-4 py-2.5"
                  title={badge.description}
                >
                  <span className="text-xl">{badge.icon}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{badge.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </GlassPageWrapper>
  )
}

function StatCard({ icon: Icon, label, value, color, delay }: {
  icon: typeof TrophyIcon
  label: string
  value: string | number
  color: 'yellow' | 'green' | 'orange' | 'blue'
  delay: number
}) {
  const glowMap = {
    yellow: 'stat-glow-yellow',
    green: 'stat-glow-green',
    orange: 'stat-glow-orange',
    blue: 'stat-glow-blue',
  }
  const iconColorMap = {
    yellow: 'from-yellow-400 to-amber-500',
    green: 'from-green-400 to-emerald-500',
    orange: 'from-orange-400 to-red-500',
    blue: 'from-blue-400 to-indigo-500',
  }

  return (
    <div className={`glass-card-static p-4 ${glowMap[color]} glass-animate-in glass-animate-in-delay-${Math.min(delay, 4)}`}>
      <div className={`inline-flex p-2 rounded-xl bg-gradient-to-br ${iconColorMap[color]} text-white mb-2`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  )
}

function DifficultyStatCard({ label, count, color }: {
  label: string
  count: number
  color: 'green' | 'yellow' | 'red'
}) {
  const gradientMap = {
    green: 'from-green-400 to-emerald-500',
    yellow: 'from-yellow-400 to-amber-500',
    red: 'from-red-400 to-rose-500',
  }
  const textMap = {
    green: 'text-green-600 dark:text-green-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    red: 'text-red-600 dark:text-red-400',
  }

  return (
    <div className="glass-card text-center p-4">
      <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${gradientMap[color]} mx-auto mb-2`} />
      <p className={`text-3xl font-bold ${textMap[color]}`}>{count}</p>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">{label}</p>
    </div>
  )
}
