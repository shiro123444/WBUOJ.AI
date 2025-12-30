/**
 * FontSettings Component
 * 字体设置组件
 *
 * 功能：
 * - 字体选择器
 * - 字体大小滑块（12-24px）
 * - 行高滑块（1.0-2.0）
 * - 连字开关
 */

import { useEditorSettingsStore } from '../../../stores/editorSettingsStore'
import { FONT_OPTIONS } from '../../../types/editor'
import type { FontFamily } from '../../../types/editor'

/**
 * 滑块组件
 */
function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  onChange: (value: number) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-200">{label}</label>
        <span className="text-sm text-gray-400">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span>
          {min}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  )
}

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
    <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
      <div>
        <p className="text-sm font-medium text-gray-200">{label}</p>
        {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
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
 * FontSettings 组件
 */
export function FontSettings() {
  const fontFamily = useEditorSettingsStore((state) => state.fontFamily)
  const fontSize = useEditorSettingsStore((state) => state.fontSize)
  const lineHeight = useEditorSettingsStore((state) => state.lineHeight)
  const fontLigatures = useEditorSettingsStore((state) => state.fontLigatures)

  const setFontFamily = useEditorSettingsStore((state) => state.setFontFamily)
  const setFontSize = useEditorSettingsStore((state) => state.setFontSize)
  const setLineHeight = useEditorSettingsStore((state) => state.setLineHeight)
  const setFontLigatures = useEditorSettingsStore((state) => state.setFontLigatures)

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 字体选择 */}
      <div>
        <h3 className="text-base sm:text-lg font-medium text-gray-200 mb-3 sm:mb-4">字体设置</h3>

        <div className="space-y-3 sm:space-y-4">
          {/* 字体选择器 */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              字体
            </label>
            <div className="grid grid-cols-1 gap-2">
              {FONT_OPTIONS.map((font) => (
                <button
                  key={font.value}
                  onClick={() => setFontFamily(font.value as FontFamily)}
                  className={`flex items-center justify-between p-2.5 sm:p-3 rounded-lg border transition-all ${
                    fontFamily === font.value
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-600 hover:border-gray-500 bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <span
                      className="text-base sm:text-lg flex-shrink-0"
                      style={{ fontFamily: `'${font.value}', monospace` }}
                    >
                      Aa
                    </span>
                    <div className="text-left min-w-0">
                      <p className="text-sm font-medium text-gray-200 truncate">
                        {font.label}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{font.description}</p>
                    </div>
                  </div>
                  {fontFamily === font.value && (
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 字体大小 */}
      <div className="p-3 sm:p-4 bg-gray-700/50 rounded-lg">
        <Slider
          label="字体大小"
          value={fontSize}
          min={12}
          max={24}
          step={1}
          unit="px"
          onChange={setFontSize}
        />
      </div>

      {/* 行高 */}
      <div className="p-3 sm:p-4 bg-gray-700/50 rounded-lg">
        <Slider
          label="行高"
          value={lineHeight}
          min={1.0}
          max={2.0}
          step={0.1}
          unit=""
          onChange={setLineHeight}
        />
      </div>

      {/* 连字开关 */}
      <Toggle
        label="字体连字"
        description="启用编程字体的连字功能（如 => 显示为箭头）"
        checked={fontLigatures}
        onChange={setFontLigatures}
      />

      {/* 预览 */}
      <div className="p-3 sm:p-4 bg-gray-900 rounded-lg overflow-x-auto">
        <p className="text-xs text-gray-500 mb-2">预览</p>
        <pre
          className="text-gray-200 text-xs sm:text-sm"
          style={{
            fontFamily: `'${fontFamily}', monospace`,
            fontSize: `${Math.min(fontSize, 16)}px`,
            lineHeight: lineHeight,
            fontVariantLigatures: fontLigatures ? 'normal' : 'none',
          }}
        >
          {`const greet = (name) => {
  return \`Hello, \${name}!\`;
};

// 连字示例: => !== === <= >=`}
        </pre>
      </div>
    </div>
  )
}

export default FontSettings
