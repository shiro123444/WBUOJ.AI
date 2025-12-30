/**
 * BackgroundSettings Component
 * 背景设置组件
 *
 * 功能：
 * - 图片上传（限制 2MB）
 * - 透明度滑块（0-100%）
 * - 模糊度滑块（0-20px）
 * - 位置选择（居中/平铺/拉伸/适应）
 * - 叠加层颜色和透明度
 * - 移除背景按钮
 */

import { useRef, useCallback, useState } from 'react'
import { PhotoIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useEditorSettingsStore } from '../../../stores/editorSettingsStore'
import { BACKGROUND_POSITION_OPTIONS } from '../../../types/editor'
import type { BackgroundPosition } from '../../../types/editor'

// 最大文件大小 2MB
const MAX_FILE_SIZE = 2 * 1024 * 1024

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
    </div>
  )
}

/**
 * BackgroundSettings 组件
 */
export function BackgroundSettings() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  // 获取状态
  const backgroundImage = useEditorSettingsStore((state) => state.backgroundImage)
  const backgroundOpacity = useEditorSettingsStore((state) => state.backgroundOpacity)
  const backgroundBlur = useEditorSettingsStore((state) => state.backgroundBlur)
  const backgroundPosition = useEditorSettingsStore((state) => state.backgroundPosition)
  const overlayColor = useEditorSettingsStore((state) => state.overlayColor)
  const overlayOpacity = useEditorSettingsStore((state) => state.overlayOpacity)

  // 获取 actions
  const setBackgroundImage = useEditorSettingsStore((state) => state.setBackgroundImage)
  const setBackgroundOpacity = useEditorSettingsStore((state) => state.setBackgroundOpacity)
  const setBackgroundBlur = useEditorSettingsStore((state) => state.setBackgroundBlur)
  const setBackgroundPosition = useEditorSettingsStore((state) => state.setBackgroundPosition)
  const setOverlayColor = useEditorSettingsStore((state) => state.setOverlayColor)
  const setOverlayOpacity = useEditorSettingsStore((state) => state.setOverlayOpacity)
  const removeBackground = useEditorSettingsStore((state) => state.removeBackground)

  // 处理文件选择
  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      setError(null)

      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        setError('请选择图片文件')
        return
      }

      // 验证文件大小
      if (file.size > MAX_FILE_SIZE) {
        setError('图片大小不能超过 2MB')
        return
      }

      // 读取文件为 Base64
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setBackgroundImage(result)
      }
      reader.onerror = () => {
        setError('读取文件失败')
      }
      reader.readAsDataURL(file)

      // 重置 input
      event.target.value = ''
    },
    [setBackgroundImage]
  )

  // 触发文件选择
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // 移除背景
  const handleRemoveBackground = useCallback(() => {
    if (confirm('确定要移除背景图片吗？')) {
      removeBackground()
      setError(null)
    }
  }, [removeBackground])

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h3 className="text-base sm:text-lg font-medium text-gray-200 mb-1 sm:mb-2">自定义背景</h3>
        <p className="text-xs sm:text-sm text-gray-400">
          上传自定义背景图片来个性化你的编码环境
        </p>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-red-400">
          <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
          <span className="text-xs sm:text-sm">{error}</span>
        </div>
      )}

      {/* 图片上传区域 */}
      <div className="p-3 sm:p-4 bg-gray-700/50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-300 mb-2 sm:mb-3">背景图片</h4>

        {backgroundImage ? (
          <div className="space-y-3 sm:space-y-4">
            {/* 预览 */}
            <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-900">
              <img
                src={backgroundImage}
                alt="背景预览"
                className="w-full h-full object-cover transition-all duration-300"
                style={{
                  opacity: backgroundOpacity / 100,
                  filter: backgroundBlur > 0 ? `blur(${backgroundBlur}px)` : undefined,
                }}
              />
              {overlayOpacity > 0 && (
                <div
                  className="absolute inset-0 transition-all duration-300"
                  style={{
                    backgroundColor: overlayColor,
                    opacity: overlayOpacity / 100,
                  }}
                />
              )}
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2">
              <button
                onClick={handleUploadClick}
                className="flex-1 inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-200 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"
              >
                <PhotoIcon className="h-4 w-4" />
                <span>更换图片</span>
              </button>
              <button
                onClick={handleRemoveBackground}
                className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-red-400 bg-red-900/30 hover:bg-red-900/50 rounded-lg transition-colors"
              >
                <TrashIcon className="h-4 w-4" />
                <span className="hidden xs:inline">移除</span>
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleUploadClick}
            className="w-full aspect-video flex flex-col items-center justify-center gap-2 sm:gap-3 border-2 border-dashed border-gray-600 hover:border-gray-500 rounded-lg transition-colors"
          >
            <PhotoIcon className="h-10 w-10 sm:h-12 sm:w-12 text-gray-500" />
            <div className="text-center px-4">
              <p className="text-xs sm:text-sm font-medium text-gray-300">点击上传背景图片</p>
              <p className="text-xs text-gray-500 mt-1">支持 JPG、PNG、GIF，最大 2MB</p>
            </div>
          </button>
        )}

        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* 背景设置（仅在有背景图片时显示） */}
      {backgroundImage && (
        <>
          {/* 透明度和模糊度 */}
          <div className="p-3 sm:p-4 bg-gray-700/50 rounded-lg space-y-3 sm:space-y-4">
            <h4 className="text-sm font-medium text-gray-300 mb-2 sm:mb-3">图片效果</h4>

            <Slider
              label="透明度"
              value={backgroundOpacity}
              min={0}
              max={100}
              step={5}
              unit="%"
              onChange={setBackgroundOpacity}
            />

            <Slider
              label="模糊度"
              value={backgroundBlur}
              min={0}
              max={20}
              step={1}
              unit="px"
              onChange={setBackgroundBlur}
            />
          </div>

          {/* 位置选择 */}
          <div className="p-3 sm:p-4 bg-gray-700/50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-300 mb-2 sm:mb-3">背景位置</h4>
            <div className="grid grid-cols-2 gap-2">
              {BACKGROUND_POSITION_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setBackgroundPosition(option.value as BackgroundPosition)}
                  className={`px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg transition-colors ${
                    backgroundPosition === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 叠加层设置 */}
          <div className="p-3 sm:p-4 bg-gray-700/50 rounded-lg space-y-3 sm:space-y-4">
            <h4 className="text-sm font-medium text-gray-300 mb-2 sm:mb-3">叠加层</h4>
            <p className="text-xs text-gray-400 -mt-2 mb-2 sm:mb-3">
              添加叠加层可以提高代码可读性
            </p>

            {/* 颜色选择 */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-200">叠加层颜色</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={overlayColor}
                  onChange={(e) => setOverlayColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer bg-transparent"
                />
                <span className="text-xs sm:text-sm text-gray-400 font-mono hidden xs:inline">{overlayColor}</span>
              </div>
            </div>

            <Slider
              label="叠加层透明度"
              value={overlayOpacity}
              min={0}
              max={100}
              step={5}
              unit="%"
              onChange={setOverlayOpacity}
            />
          </div>
        </>
      )}

      {/* 提示信息 */}
      <div className="p-3 sm:p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
        <p className="text-xs sm:text-sm text-blue-300">
          💡 提示：如果背景图片影响代码可读性，可以调整透明度或添加叠加层。
        </p>
      </div>
    </div>
  )
}

export default BackgroundSettings
