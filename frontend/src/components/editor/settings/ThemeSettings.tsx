/**
 * ThemeSettings Component
 * 主题设置组件
 *
 * 功能：
 * - 主题预览卡片
 * - 主题选择器
 */

import { CheckIcon } from '@heroicons/react/24/outline'
import { useTheme } from '../../../hooks/useTheme'
import { themes, themeList } from '../themes'
import type { ThemeId } from '../../../types/editor'

/**
 * 主题预览卡片
 */
function ThemePreviewCard({
  themeId,
  isSelected,
  onSelect,
}: {
  themeId: ThemeId
  isSelected: boolean
  onSelect: () => void
}) {
  const theme = themes[themeId]

  return (
    <button
      onClick={onSelect}
      className={`relative w-full p-3 rounded-lg border-2 transition-all ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-500/20'
          : 'border-gray-600 hover:border-gray-500'
      }`}
      style={{ backgroundColor: theme.colors['editor.background'] }}
    >
      {/* 选中标记 */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
          <CheckIcon className="h-3 w-3 text-white" />
        </div>
      )}

      {/* 主题名称 */}
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-sm font-medium"
          style={{ color: theme.colors['editor.foreground'] }}
        >
          {theme.name}
        </span>
        <span
          className="text-xs px-1.5 py-0.5 rounded"
          style={{
            backgroundColor: theme.ui.surface,
            color: theme.ui.textSecondary,
          }}
        >
          {theme.type === 'light' ? '浅色' : '深色'}
        </span>
      </div>

      {/* 代码预览 */}
      <div
        className="text-left text-xs font-mono p-2 rounded"
        style={{
          backgroundColor: theme.colors['editor.lineHighlightBackground'],
        }}
      >
        <div>
          <span style={{ color: theme.colors.keyword }}>function</span>{' '}
          <span style={{ color: theme.colors.function }}>hello</span>
          <span style={{ color: theme.colors['editor.foreground'] }}>()</span>{' '}
          <span style={{ color: theme.colors['editor.foreground'] }}>{'{'}</span>
        </div>
        <div className="pl-4">
          <span style={{ color: theme.colors.keyword }}>return</span>{' '}
          <span style={{ color: theme.colors.string }}>"Hello"</span>
          <span style={{ color: theme.colors['editor.foreground'] }}>;</span>
        </div>
        <div>
          <span style={{ color: theme.colors['editor.foreground'] }}>{'}'}</span>
        </div>
      </div>

      {/* 主色调预览 */}
      <div className="flex gap-1 mt-2">
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: theme.ui.primary }}
          title="主色调"
        />
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: theme.colors.keyword }}
          title="关键字"
        />
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: theme.colors.string }}
          title="字符串"
        />
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: theme.colors.function }}
          title="函数"
        />
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: theme.colors.comment }}
          title="注释"
        />
      </div>
    </button>
  )
}

/**
 * ThemeSettings 组件
 */
export function ThemeSettings() {
  const { themeId, setTheme } = useTheme()

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h3 className="text-base sm:text-lg font-medium text-gray-200 mb-1 sm:mb-2">选择主题</h3>
        <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4">
          选择一个预设主题来自定义编辑器的外观
        </p>
      </div>

      {/* 主题网格 - 响应式布局 */}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {themeList.map((t) => (
          <ThemePreviewCard
            key={t.id}
            themeId={t.id}
            isSelected={themeId === t.id}
            onSelect={() => setTheme(t.id)}
          />
        ))}
      </div>

      {/* 当前主题信息 */}
      <div className="p-3 sm:p-4 bg-gray-700/50 rounded-lg">
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: themes[themeId].ui.primary }}
          >
            <span className="text-white font-bold text-base sm:text-lg">
              {themes[themeId].name.charAt(0)}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-200 truncate">
              当前主题：{themes[themeId].name}
            </p>
            <p className="text-xs text-gray-400">
              {themes[themeId].type === 'light' ? '浅色主题' : '深色主题'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ThemeSettings
