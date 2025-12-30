/**
 * EnhancedEditor Component
 * 增强版 Monaco 编辑器组件
 * 
 * 功能：
 * - 应用自定义主题
 * - 应用编辑器设置
 * - 支持自定义背景
 * - 主题切换过渡动画
 */

import { useCallback, useEffect, useRef, useMemo, useState } from 'react'
import Editor, { type OnMount, type OnChange, type BeforeMount, loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'

// 配置 Monaco loader 使用本地实例，避免从 CDN 加载
loader.config({ monaco })
import { useEditorSettingsStore } from '../../stores/editorSettingsStore'
import { useTheme } from '../../hooks/useTheme'
import { themes } from './themes'
import type { SupportedLanguage } from '../../types'
import type { EditorTheme } from '../../types/editor'
import { getMonacoLanguage } from '../common'

/**
 * 将 EditorTheme 转换为 Monaco 主题定义
 */
function createMonacoThemeData(theme: EditorTheme): any {
  return {
    base: theme.type === 'light' ? 'vs' : 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: theme.colors.keyword.replace('#', '') },
      { token: 'string', foreground: theme.colors.string.replace('#', '') },
      { token: 'number', foreground: theme.colors.number.replace('#', '') },
      { token: 'comment', foreground: theme.colors.comment.replace('#', ''), fontStyle: 'italic' },
      { token: 'function', foreground: theme.colors.function.replace('#', '') },
      { token: 'variable', foreground: theme.colors.variable.replace('#', '') },
      { token: 'type', foreground: theme.colors.type.replace('#', '') },
      { token: 'operator', foreground: theme.colors.operator.replace('#', '') },
      { token: 'class', foreground: theme.colors.class.replace('#', '') },
      { token: 'constant', foreground: theme.colors.constant.replace('#', '') },
      { token: 'identifier', foreground: theme.colors.variable.replace('#', '') },
      { token: 'delimiter', foreground: theme.colors.operator.replace('#', '') },
      { token: 'tag', foreground: theme.colors.keyword.replace('#', '') },
      { token: 'attribute.name', foreground: theme.colors.variable.replace('#', '') },
      { token: 'attribute.value', foreground: theme.colors.string.replace('#', '') },
    ],
    colors: {
      'editor.background': theme.colors['editor.background'],
      'editor.foreground': theme.colors['editor.foreground'],
      'editor.lineHighlightBackground': theme.colors['editor.lineHighlightBackground'],
      'editor.selectionBackground': theme.colors['editor.selectionBackground'],
      'editorCursor.foreground': theme.colors['editorCursor.foreground'],
      'editorLineNumber.foreground': theme.colors['editorLineNumber.foreground'],
      'editorLineNumber.activeForeground': theme.colors['editorLineNumber.activeForeground'],
      'editorIndentGuide.background': theme.colors['editorIndentGuide.background'],
      'editorIndentGuide.activeBackground': theme.colors['editorIndentGuide.activeBackground'],
      'editorWhitespace.foreground': theme.colors['editorWhitespace.foreground'],
    },
  }
}

// 跟踪已注册的主题
const registeredThemes = new Set<string>()

/**
 * EnhancedEditor Props
 */
export interface EnhancedEditorProps {
  /** 编辑器内容 */
  value: string
  /** 内容变化回调 */
  onChange: (value: string) => void
  /** 编程语言 */
  language: SupportedLanguage
  /** 是否只读 */
  readOnly?: boolean
  /** 编辑器挂载回调 */
  onMount?: (editor: any) => void
  /** 自定义高度 */
  height?: string
  /** 自定义类名 */
  className?: string
}

/**
 * 获取背景样式
 */
function getBackgroundStyles(settings: {
  backgroundImage: string | null
  backgroundOpacity: number
  backgroundBlur: number
  backgroundPosition: string
  overlayColor: string
  overlayOpacity: number
}): React.CSSProperties {
  if (!settings.backgroundImage) {
    return {}
  }

  // 背景位置映射
  const positionMap: Record<string, string> = {
    center: 'center center',
    tile: 'left top',
    stretch: 'center center',
    fit: 'center center',
  }

  // 背景大小映射
  const sizeMap: Record<string, string> = {
    center: 'auto',
    tile: 'auto',
    stretch: '100% 100%',
    fit: 'contain',
  }

  // 背景重复映射
  const repeatMap: Record<string, string> = {
    center: 'no-repeat',
    tile: 'repeat',
    stretch: 'no-repeat',
    fit: 'no-repeat',
  }

  return {
    backgroundImage: `url(${settings.backgroundImage})`,
    backgroundPosition: positionMap[settings.backgroundPosition] || 'center center',
    backgroundSize: sizeMap[settings.backgroundPosition] || 'auto',
    backgroundRepeat: repeatMap[settings.backgroundPosition] || 'no-repeat',
    filter: settings.backgroundBlur > 0 ? `blur(${settings.backgroundBlur}px)` : undefined,
  }
}

/**
 * EnhancedEditor 组件
 */
export function EnhancedEditor({
  value,
  onChange,
  language,
  readOnly = false,
  onMount,
  height = '100%',
  className = '',
}: EnhancedEditorProps) {
  // Refs
  const editorRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const monacoRef = useRef<any>(null)

  // 主题切换动画状态
  const [isThemeTransitioning, setIsThemeTransitioning] = useState(false)
  const prevThemeRef = useRef<string | null>(null)

  // 从 store 获取设置（使用选择器避免不必要的重渲染）
  const fontSize = useEditorSettingsStore((state) => state.fontSize)
  const fontFamily = useEditorSettingsStore((state) => state.fontFamily)
  const lineHeight = useEditorSettingsStore((state) => state.lineHeight)
  const fontLigatures = useEditorSettingsStore((state) => state.fontLigatures)
  const tabSize = useEditorSettingsStore((state) => state.tabSize)
  const wordWrap = useEditorSettingsStore((state) => state.wordWrap)
  const lineNumbers = useEditorSettingsStore((state) => state.lineNumbers)
  const minimap = useEditorSettingsStore((state) => state.minimap)
  const bracketMatching = useEditorSettingsStore((state) => state.bracketMatching)
  const lineHighlight = useEditorSettingsStore((state) => state.lineHighlight)
  const cursorStyle = useEditorSettingsStore((state) => state.cursorStyle)
  const backgroundImage = useEditorSettingsStore((state) => state.backgroundImage)
  const backgroundOpacity = useEditorSettingsStore((state) => state.backgroundOpacity)
  const backgroundBlur = useEditorSettingsStore((state) => state.backgroundBlur)
  const backgroundPosition = useEditorSettingsStore((state) => state.backgroundPosition)
  const overlayColor = useEditorSettingsStore((state) => state.overlayColor)
  const overlayOpacity = useEditorSettingsStore((state) => state.overlayOpacity)

  // 主题 Hook
  const { themeId } = useTheme()

  // 计算 Monaco 编辑器选项
  const editorOptions = useMemo((): any => {
    return {
      // 字体设置
      fontSize: fontSize,
      fontFamily: `'${fontFamily}', 'Consolas', 'Monaco', monospace`,
      lineHeight: lineHeight * fontSize,
      fontLigatures: fontLigatures,

      // 行为设置
      tabSize: tabSize,
      wordWrap: wordWrap,
      lineNumbers: lineNumbers,
      minimap: { enabled: minimap },
      matchBrackets: bracketMatching ? 'always' : 'never',
      renderLineHighlight: lineHighlight ? 'line' : 'none',
      cursorStyle: cursorStyle,

      // 其他设置
      readOnly,
      scrollBeyondLastLine: false,
      automaticLayout: true,
      selectOnLineNumbers: true,
      roundedSelection: false,
      contextmenu: true,
      folding: true,
      foldingStrategy: 'indentation',
      showFoldingControls: 'mouseover',
      autoClosingBrackets: 'always',
      autoClosingQuotes: 'always',
      formatOnPaste: true,
      formatOnType: true,
    }
  }, [
    fontSize,
    fontFamily,
    lineHeight,
    fontLigatures,
    tabSize,
    wordWrap,
    lineNumbers,
    minimap,
    bracketMatching,
    lineHighlight,
    cursorStyle,
    readOnly,
  ])

  // 编辑器挂载前处理 - 注册所有主题
  const handleBeforeMount: BeforeMount = useCallback(
    (monacoInstance) => {
      // 保存 Monaco 实例引用
      monacoRef.current = monacoInstance
      
      // 注册所有主题到 Monaco
      Object.values(themes).forEach((theme) => {
        if (!registeredThemes.has(theme.id)) {
          try {
            const themeData = createMonacoThemeData(theme)
            monacoInstance.editor.defineTheme(theme.id, themeData)
            registeredThemes.add(theme.id)
          } catch (error) {
            console.error(`Failed to register theme ${theme.id}:`, error)
          }
        }
      })
    },
    []
  )

  // 编辑器挂载处理
  const handleEditorMount: OnMount = useCallback(
    (editor, monacoInstance) => {
      editorRef.current = editor
      monacoRef.current = monacoInstance

      // 获取当前 store 中的主题（可能已经 hydrated）
      const currentTheme = useEditorSettingsStore.getState().theme
      
      // 应用当前主题
      monacoInstance.editor.setTheme(currentTheme)
      prevThemeRef.current = currentTheme

      // 调用外部回调
      onMount?.(editor)
    },
    [onMount]
  )

  // 内容变化处理
  const handleChange: OnChange = useCallback(
    (newValue) => {
      onChange(newValue || '')
    },
    [onChange]
  )

  // 当主题变化时更新编辑器（带过渡动画）
  useEffect(() => {
    if (monacoRef.current) {
      // 检测主题是否真的变化了（排除初始化）
      const isInitialLoad = prevThemeRef.current === null
      const themeChanged = prevThemeRef.current !== null && prevThemeRef.current !== themeId
      
      if (themeChanged) {
        // 触发过渡动画
        setIsThemeTransitioning(true)
        
        // 动画结束后移除过渡类
        const timer = setTimeout(() => {
          setIsThemeTransitioning(false)
        }, 300)
        
        // 应用新主题
        monacoRef.current.editor.setTheme(themeId)
        prevThemeRef.current = themeId
        
        return () => clearTimeout(timer)
      } else if (isInitialLoad) {
        // 初始化时也要应用主题
        monacoRef.current.editor.setTheme(themeId)
        prevThemeRef.current = themeId
      }
    }
  }, [themeId])

  // 当设置变化时更新编辑器选项
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions(editorOptions)
    }
  }, [editorOptions])

  // 背景设置
  const hasBackground = !!backgroundImage
  const backgroundStyles = useMemo(
    () =>
      getBackgroundStyles({
        backgroundImage: backgroundImage,
        backgroundOpacity: backgroundOpacity,
        backgroundBlur: backgroundBlur,
        backgroundPosition: backgroundPosition,
        overlayColor: overlayColor,
        overlayOpacity: overlayOpacity,
      }),
    [
      backgroundImage,
      backgroundOpacity,
      backgroundBlur,
      backgroundPosition,
      overlayColor,
      overlayOpacity,
    ]
  )

  return (
    <div
      ref={containerRef}
      className={`enhanced-editor-container relative ${isThemeTransitioning ? 'theme-transition' : ''} ${className}`}
      style={{ height }}
    >
      {/* 背景层 */}
      {hasBackground && (
        <>
          {/* 背景图片 */}
          <div
            className="absolute inset-0 z-0 pointer-events-none transition-all duration-300"
            style={{
              ...backgroundStyles,
              opacity: backgroundOpacity / 100,
            }}
          />
          {/* 叠加层 */}
          {overlayOpacity > 0 && (
            <div
              className="absolute inset-0 z-0 pointer-events-none transition-all duration-300"
              style={{
                backgroundColor: overlayColor,
                opacity: overlayOpacity / 100,
              }}
            />
          )}
        </>
      )}

      {/* Monaco Editor */}
      <div
        className={`relative z-10 h-full ${hasBackground ? 'bg-transparent' : ''}`}
        style={hasBackground ? { backgroundColor: 'transparent' } : undefined}
      >
        <Editor
          height="100%"
          language={getMonacoLanguage(language)}
          value={value}
          onChange={handleChange}
          beforeMount={handleBeforeMount}
          onMount={handleEditorMount}
          theme={themeId}
          options={editorOptions}
          loading={
            <div className="flex items-center justify-center h-full bg-gray-900">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-500"></div>
                <p className="mt-2 text-sm text-gray-400">加载编辑器...</p>
              </div>
            </div>
          }
        />
      </div>
    </div>
  )
}

export default EnhancedEditor
