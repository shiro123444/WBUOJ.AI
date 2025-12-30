/**
 * useTheme Hook
 * 管理编辑器主题的切换、注册和持久化
 */

import { useCallback, useEffect, useRef } from 'react'
import * as monaco from 'monaco-editor'
import { useEditorSettingsStore } from '../stores/editorSettingsStore'
import { themes, getTheme } from '../components/editor/themes'
import type { ThemeId, EditorTheme } from '../types/editor'

// 跟踪已注册的主题
const registeredThemes = new Set<string>()

/**
 * 将 EditorTheme 转换为 Monaco 主题定义
 */
function createMonacoThemeData(theme: EditorTheme): monaco.editor.IStandaloneThemeData {
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
      // 额外的 token 规则
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

/**
 * 注册主题到 Monaco Editor
 */
function registerMonacoTheme(theme: EditorTheme): void {
  if (registeredThemes.has(theme.id)) {
    return
  }

  try {
    const themeData = createMonacoThemeData(theme)
    monaco.editor.defineTheme(theme.id, themeData)
    registeredThemes.add(theme.id)
  } catch (error) {
    console.error(`Failed to register theme ${theme.id}:`, error)
  }
}

/**
 * 注册所有预设主题
 */
export function registerAllThemes(): void {
  Object.values(themes).forEach(registerMonacoTheme)
}

/**
 * 应用 CSS 变量到文档
 */
function applyCSSVariables(theme: EditorTheme): void {
  const root = document.documentElement

  // 编辑器颜色
  root.style.setProperty('--editor-bg', theme.colors['editor.background'])
  root.style.setProperty('--editor-fg', theme.colors['editor.foreground'])
  root.style.setProperty('--editor-line-highlight', theme.colors['editor.lineHighlightBackground'])
  root.style.setProperty('--editor-selection', theme.colors['editor.selectionBackground'])
  root.style.setProperty('--editor-cursor', theme.colors['editorCursor.foreground'])

  // UI 颜色
  root.style.setProperty('--ui-primary', theme.ui.primary)
  root.style.setProperty('--ui-primary-hover', theme.ui.primaryHover)
  root.style.setProperty('--ui-background', theme.ui.background)
  root.style.setProperty('--ui-surface', theme.ui.surface)
  root.style.setProperty('--ui-surface-hover', theme.ui.surfaceHover)
  root.style.setProperty('--ui-text', theme.ui.text)
  root.style.setProperty('--ui-text-secondary', theme.ui.textSecondary)
  root.style.setProperty('--ui-text-muted', theme.ui.textMuted)
  root.style.setProperty('--ui-border', theme.ui.border)
  root.style.setProperty('--ui-border-hover', theme.ui.borderHover)
  root.style.setProperty('--ui-success', theme.ui.success)
  root.style.setProperty('--ui-error', theme.ui.error)
  root.style.setProperty('--ui-warning', theme.ui.warning)
}


/**
 * useTheme Hook
 * 提供主题切换和管理功能
 */
export function useTheme() {
  const themeId = useEditorSettingsStore((state) => state.theme)
  const setThemeId = useEditorSettingsStore((state) => state.setTheme)
  const isInitialized = useRef(false)

  // 获取当前主题对象
  const theme = getTheme(themeId)

  // 初始化：注册所有主题并应用当前主题
  useEffect(() => {
    if (!isInitialized.current) {
      registerAllThemes()
      isInitialized.current = true
    }
  }, [])

  // 当主题变化时应用 CSS 变量
  useEffect(() => {
    applyCSSVariables(theme)
  }, [theme])

  // 切换主题
  const setTheme = useCallback(
    (newThemeId: ThemeId) => {
      // 确保主题已注册
      const newTheme = getTheme(newThemeId)
      registerMonacoTheme(newTheme)

      // 更新 store（会自动持久化）
      setThemeId(newThemeId)
    },
    [setThemeId]
  )

  // 应用主题到 Monaco Editor 实例
  const applyThemeToEditor = useCallback(
    (_editor: monaco.editor.IStandaloneCodeEditor) => {
      try {
        // 确保主题已注册
        registerMonacoTheme(theme)
        // 设置编辑器主题（Monaco 全局设置）
        monaco.editor.setTheme(themeId)
      } catch (error) {
        console.error('Failed to apply theme to editor:', error)
      }
    },
    [theme, themeId]
  )

  // 获取主题的 Monaco 主题名称
  const getMonacoThemeName = useCallback(() => {
    return themeId
  }, [themeId])

  return {
    // 当前主题
    theme,
    themeId,

    // 主题操作
    setTheme,
    applyThemeToEditor,
    getMonacoThemeName,

    // 主题信息
    isDark: theme.type === 'dark',
    isLight: theme.type === 'light',
  }
}

/**
 * 获取主题的 Monaco 选项
 * 用于初始化编辑器时设置主题
 */
export function getThemeMonacoOptions(themeId: ThemeId): monaco.editor.IStandaloneEditorConstructionOptions {
  // 确保主题已注册
  const theme = getTheme(themeId)
  registerMonacoTheme(theme)

  return {
    theme: themeId,
  }
}

export default useTheme
