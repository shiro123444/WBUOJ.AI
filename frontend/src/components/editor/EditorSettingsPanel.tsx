/**
 * EditorSettingsPanel Component
 * 编辑器设置面板组件
 *
 * 功能：
 * - Modal 布局
 * - 分组 Tab 导航
 * - 实时预览
 * - 重置和导入/导出按钮
 * - 响应式设计（移动端适配）
 * - 动画效果
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  XMarkIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  SwatchIcon,
  Cog6ToothIcon,
  PhotoIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { useEditorSettingsStore } from '../../stores/editorSettingsStore'
import { ThemeSettings } from './settings/ThemeSettings'
import { FontSettings } from './settings/FontSettings'
import { BehaviorSettings } from './settings/BehaviorSettings'
import { BackgroundSettings } from './settings/BackgroundSettings'

/**
 * 设置面板 Tab 类型
 */
type SettingsTab = 'theme' | 'font' | 'behavior' | 'background' | 'ai'

/**
 * Tab 配置
 */
const TABS: { id: SettingsTab; label: string; shortLabel: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'theme', label: '主题', shortLabel: '主题', icon: SwatchIcon },
  { id: 'font', label: '字体', shortLabel: '字体', icon: ({ className }) => <span className={className}>Aa</span> },
  { id: 'behavior', label: '行为', shortLabel: '行为', icon: Cog6ToothIcon },
  { id: 'background', label: '背景', shortLabel: '背景', icon: PhotoIcon },
  { id: 'ai', label: 'AI', shortLabel: 'AI', icon: SparklesIcon },
]

/**
 * EditorSettingsPanel Props
 */
export interface EditorSettingsPanelProps {
  /** 是否打开 */
  isOpen: boolean
  /** 关闭回调 */
  onClose: () => void
}

/**
 * AI 设置组件
 */
function AISettings() {
  const aiEnabled = useEditorSettingsStore((state) => state.aiCompletionEnabled)
  const setAIEnabled = useEditorSettingsStore((state) => state.setAICompletionEnabled)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-200 mb-4">AI 智能补全</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-200">启用 AI 补全</p>
              <p className="text-xs text-gray-400 mt-1">
                在编写代码时获得 AI 智能补全建议
              </p>
            </div>
            <button
              onClick={() => setAIEnabled(!aiEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                aiEnabled ? 'bg-green-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  aiEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {aiEnabled && (
            <div className="p-4 bg-green-900/20 border border-green-700/50 rounded-lg">
              <div className="flex items-center gap-2 text-green-400">
                <SparklesIcon className="h-5 w-5" />
                <span className="text-sm font-medium">AI 补全已启用</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                输入代码时，AI 会自动提供补全建议。按 Tab 接受建议，按 Escape 取消。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * EditorSettingsPanel 组件
 */
export function EditorSettingsPanel({ isOpen, onClose }: EditorSettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('theme')
  const [isAnimating, setIsAnimating] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetToDefaults = useEditorSettingsStore((state) => state.resetToDefaults)
  const exportSettings = useEditorSettingsStore((state) => state.exportSettings)
  const importSettings = useEditorSettingsStore((state) => state.importSettings)

  // 处理打开/关闭动画
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      // 延迟一帧以触发动画
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true)
        })
      })
    } else {
      setIsAnimating(false)
      // 等待动画完成后隐藏
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // 导出设置
  const handleExport = useCallback(() => {
    const data = exportSettings()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `editor-settings-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [exportSettings])

  // 导入设置
  const handleImport = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // 处理文件选择
  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string)
          const success = importSettings(data)
          if (!success) {
            alert('导入失败：设置格式无效')
          }
        } catch {
          alert('导入失败：文件格式错误')
        }
      }
      reader.readAsText(file)

      // 重置 input 以允许重复选择同一文件
      event.target.value = ''
    },
    [importSettings]
  )

  // 重置设置
  const handleReset = useCallback(() => {
    if (confirm('确定要重置所有设置为默认值吗？')) {
      resetToDefaults()
    }
  }, [resetToDefaults])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* 背景遮罩 - 带动画 */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* 面板内容 - 带动画 */}
      <div 
        className={`relative w-full max-w-3xl max-h-[90vh] sm:max-h-[85vh] bg-gray-800 rounded-xl shadow-2xl overflow-hidden flex flex-col transform transition-all duration-300 ease-out ${
          isAnimating 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-95 translate-y-4'
        }`}
      >
        {/* 头部 - 响应式布局 */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-700">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-100">编辑器设置</h2>
          <div className="flex items-center gap-1 sm:gap-2">
            {/* 重置按钮 */}
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-md transition-colors"
              title="重置为默认"
            >
              <ArrowPathIcon className="h-4 w-4" />
              <span className="hidden sm:inline">重置</span>
            </button>
            {/* 导入按钮 */}
            <button
              onClick={handleImport}
              className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-md transition-colors"
              title="导入设置"
            >
              <ArrowUpTrayIcon className="h-4 w-4" />
              <span className="hidden sm:inline">导入</span>
            </button>
            {/* 导出按钮 */}
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-md transition-colors"
              title="导出设置"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              <span className="hidden sm:inline">导出</span>
            </button>
            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-md transition-colors"
              title="关闭"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab 导航 - 响应式布局，移动端可滚动 */}
        <div className="flex border-b border-gray-700 px-2 sm:px-6 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'text-blue-400 border-blue-400'
                    : 'text-gray-400 border-transparent hover:text-gray-200 hover:border-gray-600'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden xs:inline sm:inline">{tab.label}</span>
                <span className="xs:hidden">{tab.shortLabel}</span>
              </button>
            )
          })}
        </div>

        {/* 内容区域 - 响应式内边距 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'theme' && <ThemeSettings />}
          {activeTab === 'font' && <FontSettings />}
          {activeTab === 'behavior' && <BehaviorSettings />}
          {activeTab === 'background' && <BackgroundSettings />}
          {activeTab === 'ai' && <AISettings />}
        </div>

        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  )
}

export default EditorSettingsPanel
