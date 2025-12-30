/**
 * EditorToolbar Component
 * 编辑器工具栏组件
 */

import { useState, useRef, useEffect } from 'react'
import {
  Cog6ToothIcon,
  PlayIcon,
  SwatchIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline'
import { LanguageSelector } from '../common'
import { themeList } from './themes'
import { useTheme } from '../../hooks/useTheme'
import { useEditorSettingsStore } from '../../stores/editorSettingsStore'
import type { SupportedLanguage } from '../../types'
import type { ThemeId } from '../../types/editor'

export interface EditorToolbarProps {
  language: SupportedLanguage
  onLanguageChange: (language: SupportedLanguage) => void
  isSubmitting?: boolean
  onSubmit: () => void
  onSettingsClick: () => void
  className?: string
}

function ThemeDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { themeId, setTheme, theme } = useTheme()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleThemeSelect = (id: ThemeId) => {
    setTheme(id)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-sm font-medium rounded-md bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
        title="切换主题"
      >
        <SwatchIcon className="h-4 w-4" />
        <span className="hidden md:inline">{theme.name}</span>
        <ChevronDownIcon className={`h-3 w-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 py-1 animate-dropdown-in">
          {themeList.map((t) => (
            <button
              key={t.id}
              onClick={() => handleThemeSelect(t.id)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 transition-colors flex items-center justify-between ${
                themeId === t.id ? 'text-blue-400' : 'text-gray-300'
              }`}
            >
              <span>{t.name}</span>
              <span className="text-xs text-gray-500">
                {t.type === 'light' ? '浅色' : '深色'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function AICompletionIndicator() {
  const aiEnabled = useEditorSettingsStore((state) => state.aiCompletionEnabled)
  const toggleAI = useEditorSettingsStore((state) => state.setAICompletionEnabled)

  return (
    <button
      onClick={() => toggleAI(!aiEnabled)}
      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
        aiEnabled
          ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
          : 'bg-gray-700 text-gray-500 hover:bg-gray-600'
      }`}
      title={aiEnabled ? '关闭 AI 补全' : '开启 AI 补全'}
    >
      <span className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${aiEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></span>
      <span className="hidden xs:inline">AI</span>
    </button>
  )
}

export function EditorToolbar({
  language,
  onLanguageChange,
  isSubmitting = false,
  onSubmit,
  onSettingsClick,
  className = '',
}: EditorToolbarProps) {
  return (
    <div
      className={`flex items-center justify-between px-2 sm:px-4 py-2 bg-gray-800 border-b border-gray-700 gap-2 ${className}`}
    >
      {/* 左侧：语言选择器和主题 */}
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-shrink">
        <LanguageSelector
          value={language}
          onChange={onLanguageChange}
          disabled={isSubmitting}
        />
        <ThemeDropdown />
        <AICompletionIndicator />
      </div>

      {/* 右侧：操作按钮 */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        {/* 设置按钮 */}
        <button
          onClick={onSettingsClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
          title="编辑器设置"
        >
          <Cog6ToothIcon className="h-4 w-4" />
          <span className="hidden md:inline">设置</span>
        </button>

        {/* 提交按钮 */}
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 text-white text-sm font-medium rounded-md transition-colors ${
            isSubmitting
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              <span className="hidden xs:inline">评测中...</span>
            </>
          ) : (
            <>
              <PlayIcon className="h-4 w-4" />
              <span>提交</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default EditorToolbar
