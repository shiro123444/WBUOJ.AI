import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import { adminService } from '../services/admin'
import type { AdminUser, DashboardStats, SystemConfig, AdminLog } from '../services/admin'
import { Link } from 'react-router-dom'
import {
  UsersIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ClipboardDocumentListIcon,
  ShieldCheckIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'

type Tab = 'overview' | 'users' | 'configs' | 'logs'

export function AdminDashboard() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [userSearch, setUserSearch] = useState('')
  const [userPage, setUserPage] = useState(1)
  const [logPage, setLogPage] = useState(1)
  const [newConfigKey, setNewConfigKey] = useState('')
  const [newConfigValue, setNewConfigValue] = useState('')

  // Queries
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['admin-stats'],
    queryFn: () => adminService.getStats(),
    enabled: !!user && user.role === 'ADMIN',
  })

  const { data: usersData } = useQuery({
    queryKey: ['admin-users', userSearch, userPage],
    queryFn: () => adminService.listUsers({ page: userPage, search: userSearch || undefined }),
    enabled: !!user && user.role === 'ADMIN' && activeTab === 'users',
  })

  const { data: configs } = useQuery<SystemConfig[]>({
    queryKey: ['admin-configs'],
    queryFn: () => adminService.getConfigs(),
    enabled: !!user && user.role === 'ADMIN' && activeTab === 'configs',
  })

  const { data: logsData } = useQuery({
    queryKey: ['admin-logs', logPage],
    queryFn: () => adminService.getLogs(logPage),
    enabled: !!user && user.role === 'ADMIN' && activeTab === 'logs',
  })

  // Mutations
  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      adminService.updateUserRole(userId, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const disableMutation = useMutation({
    mutationFn: (userId: string) => adminService.disableUser(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const enableMutation = useMutation({
    mutationFn: (userId: string) => adminService.enableUser(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const setConfigMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      adminService.setConfig(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-configs'] })
      setNewConfigKey('')
      setNewConfigValue('')
    },
  })

  const deleteConfigMutation = useMutation({
    mutationFn: (key: string) => adminService.deleteConfig(key),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-configs'] }),
  })

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <ShieldCheckIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">需要管理员权限</p>
        <Link to="/" className="mt-4 inline-block text-blue-600 hover:text-blue-500">返回首页</Link>
      </div>
    )
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: '概览', icon: <ChartBarIcon className="h-4 w-4" /> },
    { key: 'users', label: '用户管理', icon: <UsersIcon className="h-4 w-4" /> },
    { key: 'configs', label: '系统配置', icon: <Cog6ToothIcon className="h-4 w-4" /> },
    { key: 'logs', label: '操作日志', icon: <ClipboardDocumentListIcon className="h-4 w-4" /> },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheckIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">管理后台</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard icon={<UsersIcon className="h-6 w-6" />} label="总用户" value={stats.totalUsers} color="blue" />
          <StatCard icon={<DocumentTextIcon className="h-6 w-6" />} label="总题目" value={stats.totalProblems} color="green" />
          <StatCard icon={<CodeBracketIcon className="h-6 w-6" />} label="总提交" value={stats.totalSubmissions} color="purple" />
          <StatCard icon={<DocumentTextIcon className="h-6 w-6" />} label="总题解" value={stats.totalSolutions} color="amber" />
          <StatCard icon={<UsersIcon className="h-6 w-6" />} label="今日新用户" value={stats.todayUsers} color="cyan" />
          <StatCard icon={<CodeBracketIcon className="h-6 w-6" />} label="今日提交" value={stats.todaySubmissions} color="rose" />
        </div>
      )}

      {/* Users */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索用户名或邮箱..."
                value={userSearch}
                onChange={(e) => { setUserSearch(e.target.value); setUserPage(1) }}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-400 font-medium">用户</th>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-400 font-medium">角色</th>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-400 font-medium hidden md:table-cell">等级</th>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-400 font-medium hidden md:table-cell">通过</th>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-400 font-medium">状态</th>
                  <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-400 font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {(usersData as any)?.users?.map((u: AdminUser) => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">{u.username}</div>
                      <div className="text-xs text-gray-500">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        u.role === 'admin'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {u.role === 'admin' ? '管理员' : '学生'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-600 dark:text-gray-400">Lv.{u.level}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-600 dark:text-gray-400">{u.solvedCount}</td>
                    <td className="px-4 py-3">
                      {u.isDisabled ? (
                        <span className="text-red-500 text-xs">已禁用</span>
                      ) : (
                        <span className="text-green-500 text-xs">正常</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button
                        onClick={() => roleMutation.mutate({
                          userId: u.id,
                          role: u.role === 'admin' ? 'student' : 'admin',
                        })}
                        className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        title={u.role === 'admin' ? '降为学生' : '升为管理员'}
                      >
                        {u.role === 'admin' ? '降级' : '升级'}
                      </button>
                      {u.isDisabled ? (
                        <button
                          onClick={() => enableMutation.mutate(u.id)}
                          className="text-xs px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200"
                        >
                          <CheckCircleIcon className="h-3.5 w-3.5 inline" /> 启用
                        </button>
                      ) : (
                        <button
                          onClick={() => disableMutation.mutate(u.id)}
                          className="text-xs px-2 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200"
                        >
                          <NoSymbolIcon className="h-3.5 w-3.5 inline" /> 禁用
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(usersData as any)?.pagination && (
            <div className="flex justify-center gap-2">
              <button
                disabled={userPage <= 1}
                onClick={() => setUserPage(userPage - 1)}
                className="px-3 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50"
              >
                上一页
              </button>
              <span className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400">
                {userPage} / {(usersData as any).pagination.totalPages}
              </span>
              <button
                disabled={userPage >= (usersData as any).pagination.totalPages}
                onClick={() => setUserPage(userPage + 1)}
                className="px-3 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          )}
        </div>
      )}

      {/* Configs */}
      {activeTab === 'configs' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="配置键"
              value={newConfigKey}
              onChange={(e) => setNewConfigKey(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            />
            <input
              type="text"
              placeholder="配置值"
              value={newConfigValue}
              onChange={(e) => setNewConfigValue(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            />
            <button
              onClick={() => newConfigKey && setConfigMutation.mutate({ key: newConfigKey, value: newConfigValue })}
              disabled={!newConfigKey || setConfigMutation.isPending}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
            >
              <PlusIcon className="h-4 w-4" /> 添加
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
            {configs?.map((config: SystemConfig) => (
              <div key={config.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <span className="font-mono text-sm text-gray-900 dark:text-white">{config.key}</span>
                  <span className="mx-2 text-gray-400">=</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{config.value}</span>
                </div>
                <button
                  onClick={() => deleteConfigMutation.mutate(config.key)}
                  className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
            {configs?.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-gray-500">暂无配置</p>
            )}
          </div>
        </div>
      )}

      {/* Logs */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
            {(logsData as any)?.logs?.map((log: AdminLog) => (
              <div key={log.id} className="px-4 py-3 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{log.adminUsername}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                      {log.action}
                    </span>
                  </div>
                  {log.details && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{log.details}</p>
                  )}
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString('zh-CN')}
                </span>
              </div>
            ))}
            {(logsData as any)?.logs?.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-gray-500">暂无日志</p>
            )}
          </div>

          {(logsData as any)?.pagination && (
            <div className="flex justify-center gap-2">
              <button
                disabled={logPage <= 1}
                onClick={() => setLogPage(logPage - 1)}
                className="px-3 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50"
              >
                上一页
              </button>
              <span className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400">
                {logPage} / {(logsData as any).pagination.totalPages}
              </span>
              <button
                disabled={logPage >= (logsData as any).pagination.totalPages}
                onClick={() => setLogPage(logPage + 1)}
                className="px-3 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode
  label: string
  value: number
  color: string
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    cyan: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400',
    rose: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400',
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className={`inline-flex p-2 rounded-lg mb-3 ${colorMap[color]}`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value.toLocaleString()}</div>
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  )
}
