import { Link } from 'react-router-dom'
import { Card, CardBody } from '@heroui/react'
import { useEffect, useState } from 'react'
import { ProblemCard } from '../components/ui/ProblemCard'
import { TypewriterTitle } from '../components/ui/TypewriterTitle'

interface Problem {
  id: string
  number: number
  title: string
  difficulty: 'easy' | 'medium' | 'hard'
  tags: string[]
  description?: string
}

interface Announcement {
  id: number
  title: string
  date: string
  type: 'info' | 'contest' | 'update'
  preview: string
}

// Mock data for announcements (TODO: fetch from API)
const MOCK_ANNOUNCEMENTS: Announcement[] = [
  { id: 1, title: 'AI Club OJ 正式上线啦！', date: '2025-12-25', type: 'info', preview: '欢迎来到 AI Club OJ！' },
  { id: 2, title: '本周六晚 19:00 新手周赛', date: '2025-12-28', type: 'contest', preview: '新手友好，奖品丰厚' },
  { id: 3, title: '关于 DeepSeek 模型集成的说明', date: '2025-12-26', type: 'update', preview: '智能提示功能上线' },
]

const typeConfig: Record<string, { label: string; color: string; bgFrom: string; bgTo: string }> = {
  info: { label: '通知', color: 'text-blue-600 dark:text-blue-400', bgFrom: 'from-blue-400', bgTo: 'to-blue-600' },
  contest: { label: '比赛', color: 'text-amber-600 dark:text-amber-400', bgFrom: 'from-amber-400', bgTo: 'to-orange-500' },
  update: { label: '更新', color: 'text-green-600 dark:text-green-400', bgFrom: 'from-green-400', bgTo: 'to-emerald-600' },
}

// Announcement card with corner animation effect
const AnnouncementCard = ({ announcement }: { announcement: Announcement }) => {
  const config = typeConfig[announcement.type] || typeConfig.info
  
  return (
    <Link to={`/announcements/${announcement.id}`} className="block group">
      <div className="relative h-28 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-md">
        {/* Corner decorations */}
        <div className={`absolute top-0 right-0 w-[20%] h-[20%] bg-gradient-to-br ${config.bgFrom} ${config.bgTo} rounded-bl-[100%] transition-all duration-500 group-hover:w-full group-hover:h-full group-hover:rounded-none opacity-80`} />
        <div className={`absolute bottom-0 left-0 w-[20%] h-[20%] bg-gradient-to-tr ${config.bgFrom} ${config.bgTo} rounded-tr-[100%] transition-all duration-500 group-hover:w-full group-hover:h-full group-hover:rounded-none opacity-80`} />
        
        {/* Content - default state */}
        <div className="absolute inset-0 p-4 flex flex-col justify-between z-10 transition-opacity duration-300 group-hover:opacity-0">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
            <span className="text-xs text-gray-400">{announcement.date}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-800 dark:text-gray-100 line-clamp-2">
            {announcement.title}
          </h3>
        </div>
        
        {/* Content - hover state */}
        <div className="absolute inset-0 p-4 flex items-center justify-center z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="text-center text-white">
            <p className="text-sm font-medium">{announcement.preview}</p>
            <span className="text-xs opacity-80 mt-1 block">点击查看详情 →</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export function Home() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const response = await fetch('/api/problems?limit=3')
        const data = await response.json()
        if (data.success && data.data?.problems) {
          setProblems(data.data.problems.map((p: any) => ({
            ...p,
            description: `点击查看题目详情，开始你的算法之旅...`
          })))
        }
      } catch (error) {
        console.error('Failed to fetch problems:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProblems()
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="mb-8">
             <TypewriterTitle text="AI CLUB OJ" />
          </div>
          
          <p className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed font-light tracking-wide">
            智能驱动的算法学习平台
            <br />
            <span className="text-sm md:text-base text-gray-400 dark:text-gray-500 mt-4 block tracking-[0.2em] uppercase">
              Code smarter, learn faster
            </span>
          </p>

          <div className="flex gap-6">
            <Link
              to="/problems"
              className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-full font-medium text-lg shadow-xl hover:shadow-cyan-500/25 transition-all hover:-translate-y-1 overflow-hidden"
            >
              <span className="relative z-10">开始刷题</span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
            <Link
              to="/contests"
              className="px-8 py-4 bg-transparent text-gray-900 dark:text-white rounded-full font-medium text-lg border border-gray-300 dark:border-gray-600 hover:border-black dark:hover:border-white transition-all hover:-translate-y-1 backdrop-blur-sm"
            >
              参加比赛
            </Link>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-20">
          {/* Today's Problems */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-1 h-6 bg-primary rounded-full" />
                今日题目
              </h2>
              <Link to="/problems" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm transition-colors">
                查看全部 →
              </Link>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {loading ? (
                // Loading skeleton
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-48 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                ))
              ) : (
                problems.map(problem => (
                  <ProblemCard key={problem.id} {...problem} />
                ))
              )}
              {/* More placeholder */}
              <Link to="/problems" className="group flex items-center justify-center h-48 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors bg-white/50 dark:bg-gray-800/30">
                <div className="text-center text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300 transition-colors">
                  <span className="text-3xl block mb-1 font-light">+</span>
                  <span className="text-sm">更多题目</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Announcements & Sidebar */}
          <div className="space-y-6">
            {/* Announcements */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
                <span className="w-1 h-6 bg-gray-300 dark:bg-gray-600 rounded-full" />
                公告栏
              </h2>
              <div className="space-y-3">
                {MOCK_ANNOUNCEMENTS.map(announcement => (
                  <AnnouncementCard key={announcement.id} announcement={announcement} />
                ))}
              </div>
              <div className="mt-4 text-center">
                <Link to="/announcements" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  查看历史公告 →
                </Link>
              </div>
            </div>

            {/* Daily Quote */}
            <Card 
              shadow="sm" 
              radius="lg"
              className="bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/50"
            >
              <CardBody className="p-5">
                <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-white">每日一言</h3>
                <p className="text-gray-500 dark:text-gray-400 italic text-sm leading-relaxed">
                  "Talk is cheap. Show me the code."
                </p>
                <p className="text-right text-xs mt-3 text-gray-400">— Linus Torvalds</p>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
