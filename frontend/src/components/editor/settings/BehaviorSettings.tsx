/**
 * BehaviorSettings Component
 * 行为设置组件
 *
 * 功能：
 * - Tab 大小选择（2/4/8）
 * - 自动换行开关
 * - 行号显示开关
 * - Minimap 开关
 * - 括号匹配开关
 * - 当前行高亮开关
 * - 光标样式选择
 * - AI 补全开关
 */

import { useEditorSettingsStore } from '../../../stores/editorSettingsStore'
import { TAB_SIZE_OPTIONS, CURSOR_STYLE_OPTIONS } from '../../../types/editor'
import type { TabSize, CursorStyle, WordWrapMode, LineNumbersMode } from '../../../types/editor'

/**
 * 开关组件
 */
function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-gray-200">{label}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}

/**
 * 选择器组件
 */
function Selector<T extends string | number>({
  label,
  description,
  value,
  options,
  onChange,
}: {
  label: string
  description?: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm font-medium text-gray-200">{label}</p>
          {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="flex gap-2">
        {options.map((option) => (
          <button
            key={String(option.value)}
            onClick={() => onChange(option.value)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              value === option.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * BehaviorSettings 组件
 */
export function BehaviorSettings() {
  // 获取状态
  const tabSize = useEditorSettingsStore((state) => state.tabSize)
  const wordWrap = useEditorSettingsStore((state) => state.wordWrap)
  const lineNumbers = useEditorSettingsStore((state) => state.lineNumbers)
  const minimap = useEditorSettingsStore((state) => state.minimap)
  const bracketMatching = useEditorSettingsStore((state) => state.bracketMatching)
  const lineHighlight = useEditorSettingsStore((state) => state.lineHighlight)
  const cursorStyle = useEditorSettingsStore((state) => state.cursorStyle)
  const aiCompletionEnabled = useEditorSettingsStore((state) => state.aiCompletionEnabled)

  // 获取 actions
  const setTabSize = useEditorSettingsStore((state) => state.setTabSize)
  const setWordWrap = useEditorSettingsStore((state) => state.setWordWrap)
  const setLineNumbers = useEditorSettingsStore((state) => state.setLineNumbers)
  const setMinimap = useEditorSettingsStore((state) => state.setMinimap)
  const setBracketMatching = useEditorSettingsStore((state) => state.setBracketMatching)
  const setLineHighlight = useEditorSettingsStore((state) => state.setLineHighlight)
  const setCursorStyle = useEditorSettingsStore((state) => state.setCursorStyle)
  const setAICompletionEnabled = useEditorSettingsStore((state) => state.setAICompletionEnabled)

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h3 className="text-base sm:text-lg font-medium text-gray-200 mb-3 sm:mb-4">编辑器行为</h3>
      </div>

      {/* 缩进设置 */}
      <div className="p-3 sm:p-4 bg-gray-700/50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-300 mb-2 sm:mb-3">缩进</h4>
        <Selector
          label="Tab 大小"
          description="按 Tab 键时插入的空格数"
          value={tabSize}
          options={TAB_SIZE_OPTIONS}
          onChange={(v) => setTabSize(v as TabSize)}
        />
      </div>

      {/* 显示设置 */}
      <div className="p-3 sm:p-4 bg-gray-700/50 rounded-lg divide-y divide-gray-600">
        <h4 className="text-sm font-medium text-gray-300 mb-2 sm:mb-3">显示</h4>

        <Toggle
          label="自动换行"
          description="长行自动换行显示"
          checked={wordWrap === 'on'}
          onChange={(checked) => setWordWrap(checked ? 'on' : 'off' as WordWrapMode)}
        />

        <Toggle
          label="显示行号"
          description="在编辑器左侧显示行号"
          checked={lineNumbers === 'on'}
          onChange={(checked) => setLineNumbers(checked ? 'on' : 'off' as LineNumbersMode)}
        />

        <Toggle
          label="显示 Minimap"
          description="在编辑器右侧显示代码缩略图"
          checked={minimap}
          onChange={setMinimap}
        />

        <Toggle
          label="括号匹配高亮"
          description="高亮显示匹配的括号"
          checked={bracketMatching}
          onChange={setBracketMatching}
        />

        <Toggle
          label="当前行高亮"
          description="高亮显示光标所在行"
          checked={lineHighlight}
          onChange={setLineHighlight}
        />
      </div>

      {/* 光标设置 */}
      <div className="p-3 sm:p-4 bg-gray-700/50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-300 mb-2 sm:mb-3">光标</h4>
        <Selector
          label="光标样式"
          description="编辑器光标的显示样式"
          value={cursorStyle}
          options={CURSOR_STYLE_OPTIONS}
          onChange={(v) => setCursorStyle(v as CursorStyle)}
        />

        {/* 光标预览 */}
        <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-gray-900 rounded-lg">
          <p className="text-xs text-gray-500 mb-2">预览</p>
          <div className="flex items-center gap-1 font-mono text-gray-200 text-sm sm:text-base">
            <span>Hello</span>
            <span
              className={`inline-block bg-blue-400 ${
                cursorStyle === 'line'
                  ? 'w-0.5 h-5'
                  : cursorStyle === 'block'
                  ? 'w-2.5 h-5 opacity-50'
                  : 'w-2.5 h-0.5 self-end'
              }`}
            />
            <span>World</span>
          </div>
        </div>
      </div>

      {/* AI 设置 */}
      <div className="p-3 sm:p-4 bg-gray-700/50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-300 mb-2 sm:mb-3">AI 功能</h4>
        <Toggle
          label="AI 智能补全"
          description="在编写代码时获得 AI 智能补全建议"
          checked={aiCompletionEnabled}
          onChange={setAICompletionEnabled}
        />
      </div>
    </div>
  )
}

export default BehaviorSettings
