import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import { checkInService } from '../services/checkin'
import type { CheckInStatus, CheckInResult, CalendarDay } from '../services/checkin'
import { Link } from 'react-router-dom'
import {
  FireIcon,
  CalendarDaysIcon,
  StarIcon,
  BoltIcon,
  TrophyIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { BadgeGrid } from '../components/common'

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']
const MONTH_NAMES = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

export function CheckIn() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [checkInResult, setCheckInResult] = useState<CheckInResult | null>(null)
  const [showResult, setShowResult] = useState(false)

  const now = new Date()
  const [calYear, setCalYear] = useState(now.getFullYear())
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1)

  const { data: status, isLoading } = useQuery<CheckInStatus>({
    queryKey: ['checkin-status'],
    queryFn: () => checkInService.getStatus(),
    enabled: !!user,
  })

  const { data: calendar } = useQuery<CalendarDay[]>({
    queryKey: ['checkin-calendar', calYear, calMonth],
    queryFn: () => checkInService.getCalendar(calYear, calMonth),
    enabled: !!user,
  })

  const checkInMutation = useMutation({
    mutationFn: () => checkInService.checkIn(),
    onSuccess: (data: CheckInResult) => {
      setCheckInResult(data)
      setShowResult(true)
      queryClient.invalidateQueries({ queryKey: ['checkin-status'] })
      queryClient.invalidateQueries({ queryKey: ['checkin-calendar'] })
    },
  })

  const checkedDates = new Set(calendar?.map((c: CalendarDay) => c.date) || [])

  const prevMonth = () => {
    if (calMonth === 1) { setCalYear(calYear - 1); setCalMonth(12) }
    else setCalMonth(calMonth - 1)
  }
  const nextMonth = () => {
    if (calMonth === 12) { setCalYear(calYear + 1); setCalMonth(1) }
    else setCalMonth(calMonth + 1)
  }

  // 生成日历网格
  const firstDay = new Date(calYear, calMonth - 1, 1).getDay()
  const daysInMonth = new Date(calYear, calMonth, 0).getDate()
  const calendarGrid: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) calendarGrid.push(null)
  for (let d = 1; d <= daysInMonth; d++) calendarGrid.push(d)

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-gray-500 dark:text-gray-400">请先登录以使用签到功能</p>
        <Link to="/login" className="mt-4 inline-block text-blue-600 hover:text-blue-500">去登录</Link>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    )
  }

  const xpPercent = status ? Math.min((status.xp / status.xpForNextLevel) * 100, 100) : 0

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* 标题 */}
      <div className="flex items-center gap-3">
        <CalendarDaysIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">每日签到</h1>
      </div>

      {/* 签到按钮 + 结果 */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 rounded-2xl p-6 border border-blue-100 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <button
            onClick={() => checkInMutation.mutate()}
            disabled={status?.checkedInToday || checkInMutation.isPending}
            className={`relative w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all duration-300 ${
              status?.checkedInToday
                ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-700 cursor-default'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-95 border-2 border-blue-500 cursor-pointer shadow-lg hover:shadow-xl'
            }`}
          >
            {status?.checkedInToday ? (
              <>
                <CheckCircleIcon className="h-10 w-10 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-700 dark:text-green-400 mt-1">已签到</span>
              </>
            ) : checkInMutation.isPending ? (
              <ArrowPathIcon className="h-8 w-8 text-white animate-spin" />
            ) : (
              <>
                <CalendarDaysIcon className="h-8 w-8 text-white" />
                <span className="text-sm font-bold text-white mt-1">签到</span>
              </>
            )}
          </button>

          <div className="flex-1 space-y-3 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
              <div className="flex items-center gap-1.5">
                <FireIcon className="h-5 w-5 text-orange-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  连续 <span className="font-bold text-orange-600 dark:text-orange-400">{status?.currentStreak || 0}</span> 天
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrophyIcon className="h-5 w-5 text-yellow-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  最长 <span className="font-bold text-yellow-600 dark:text-yellow-400">{status?.maxStreak || 0}</span> 天
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <CalendarDaysIcon className="h-5 w-5 text-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  累计 <span className="font-bold text-blue-600 dark:text-blue-400">{status?.totalCheckIns || 0}</span> 天
                </span>
              </div>
            </div>

            {/* 等级 + 经验条 */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  <StarIcon className="h-4 w-4 inline text-purple-500 mr-1" />
                  Lv.{status?.level || 1}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {status?.xp || 0} / {status?.xpForNextLevel || 100} XP
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
            </div>

            {/* 积分 */}
            <div className="flex items-center gap-1.5">
              <BoltIcon className="h-5 w-5 text-amber-500" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                总积分 <span className="font-bold text-amber-600 dark:text-amber-400">{status?.totalPoints || 0}</span>
              </span>
            </div>
          </div>
        </div>

        {/* 签到成功弹窗 */}
        {showResult && checkInResult && (
          <div className="mt-6 p-4 bg-white dark:bg-gray-900 rounded-xl border border-green-200 dark:border-green-800 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-green-700 dark:text-green-400 flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5" />
                签到成功！
              </h3>
              <button onClick={() => setShowResult(false)} className="text-gray-400 hover:text-gray-600 text-sm">
                关闭
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">+{checkInResult.xpGained}</div>
                <div className="text-xs text-gray-500">经验值</div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2">
                <div className="text-lg font-bold text-amber-600 dark:text-amber-400">+{checkInResult.pointsGained}</div>
                <div className="text-xs text-gray-500">积分</div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-2">
                <div className="text-lg font-bold text-orange-600 dark:text-orange-400">{checkInResult.streak}天</div>
                <div className="text-xs text-gray-500">连续签到</div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2">
                <div className="text-lg font-bold text-purple-600 dark:text-purple-400">Lv.{checkInResult.newLevel}</div>
                <div className="text-xs text-gray-500">当前等级</div>
              </div>
            </div>
            {checkInResult.leveledUp && (
              <div className="mt-3 text-center text-sm font-medium text-purple-600 dark:text-purple-400 animate-bounce">
                🎉 恭喜升级到 Lv.{checkInResult.newLevel}！
              </div>
            )}
            {checkInResult.milestoneReached && (
              <div className="mt-2 text-center text-sm font-medium text-yellow-600 dark:text-yellow-400">
                🏆 达成里程碑：连续签到 {checkInResult.milestoneReached} 天！
              </div>
            )}
          </div>
        )}

        {checkInMutation.isError && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-600 dark:text-red-400">
            {(checkInMutation.error as Error)?.message || '签到失败，请稍后重试'}
          </div>
        )}
      </div>

      {/* 签到日历 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">签到日历</h2>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
              <ChevronLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[80px] text-center">
              {calYear}年{MONTH_NAMES[calMonth - 1]}
            </span>
            <button onClick={nextMonth} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
              <ChevronRightIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* 星期头 */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1">
              {d}
            </div>
          ))}
        </div>

        {/* 日期格子 */}
        <div className="grid grid-cols-7 gap-1">
          {calendarGrid.map((day, i) => {
            if (day === null) {
              return <div key={`empty-${i}`} className="aspect-square" />
            }
            const dateStr = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const isChecked = checkedDates.has(dateStr)
            const isToday = dateStr === new Date().toISOString().split('T')[0]
            const calEntry = calendar?.find((c) => c.date === dateStr)

            return (
              <div
                key={dateStr}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-colors relative ${
                  isChecked
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium'
                    : isToday
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 ring-1 ring-blue-300 dark:ring-blue-700'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
                title={isChecked ? `+${calEntry?.xpGained || 0} XP` : undefined}
              >
                <span>{day}</span>
                {isChecked && (
                  <CheckCircleIcon className="h-3 w-3 text-green-500 dark:text-green-400 absolute bottom-0.5" />
                )}
                {calEntry?.milestoneReached && (
                  <TrophyIcon className="h-3 w-3 text-yellow-500 absolute top-0.5 right-0.5" />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 最近签到记录 */}
      {status?.recentCheckIns && status.recentCheckIns.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">最近签到</h2>
          <div className="space-y-2">
            {status.recentCheckIns.slice(0, 10).map((record) => (
              <div
                key={record.date}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <div className="flex items-center gap-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{record.date}</span>
                  <span className="text-xs text-orange-500 font-medium">
                    <FireIcon className="h-3.5 w-3.5 inline" /> {record.streak}天
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-blue-600 dark:text-blue-400">+{record.xpGained} XP</span>
                  <span className="text-amber-600 dark:text-amber-400">+{record.pointsGained} 积分</span>
                  {record.milestoneReached && (
                    <span className="text-yellow-600 dark:text-yellow-400">🏆 {record.milestoneReached}天</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* 徽章展示 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <SparklesIcon className="h-5 w-5 text-purple-500" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">我的徽章</h2>
        </div>
        <BadgeGrid />
      </div>
    </div>
  )
}
