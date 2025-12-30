/**
 * Editor Enhancement Types
 * 编辑器增强功能的类型定义
 */

// 主题 ID 类型
export type ThemeId =
  | 'claude'
  | 'chatgpt'
  | 'gemini'
  | 'vscode-dark'
  | 'vscode-light'
  | 'github-dark'
  | 'dracula'

// 字体选项
export type FontFamily =
  | 'Fira Code'
  | 'JetBrains Mono'
  | 'Source Code Pro'
  | 'Consolas'
  | 'Monaco'
  | 'Menlo'
  | 'Ubuntu Mono'

// Tab 大小选项
export type TabSize = 2 | 4 | 8

// 光标样式
export type CursorStyle = 'line' | 'block' | 'underline'

// 背景位置
export type BackgroundPosition = 'center' | 'tile' | 'stretch' | 'fit'

// 行号显示模式
export type LineNumbersMode = 'on' | 'off' | 'relative'

// 自动换行模式
export type WordWrapMode = 'on' | 'off' | 'wordWrapColumn' | 'bounded'

/**
 * 编辑器设置接口
 */
export interface EditorSettings {
  // 主题
  theme: ThemeId

  // 字体设置
  fontFamily: FontFamily
  fontSize: number // 12-24
  lineHeight: number // 1.0-2.0
  fontLigatures: boolean

  // 编辑器行为
  tabSize: TabSize
  wordWrap: WordWrapMode
  lineNumbers: LineNumbersMode
  minimap: boolean
  bracketMatching: boolean
  lineHighlight: boolean
  cursorStyle: CursorStyle

  // AI 设置
  aiCompletionEnabled: boolean

  // 背景设置
  backgroundImage: string | null // Base64 或 URL
  backgroundOpacity: number // 0-100
  backgroundBlur: number // 0-20
  backgroundPosition: BackgroundPosition
  overlayColor: string // hex color
  overlayOpacity: number // 0-100
}

/**
 * 主题颜色定义
 */
export interface ThemeColors {
  // 编辑器颜色
  'editor.background': string
  'editor.foreground': string
  'editor.lineHighlightBackground': string
  'editor.selectionBackground': string
  'editorCursor.foreground': string
  'editorLineNumber.foreground': string
  'editorLineNumber.activeForeground': string
  'editorIndentGuide.background': string
  'editorIndentGuide.activeBackground': string
  'editorWhitespace.foreground': string

  // 语法高亮颜色
  keyword: string
  string: string
  number: string
  comment: string
  function: string
  variable: string
  type: string
  operator: string
  class: string
  constant: string
}

/**
 * UI 颜色定义
 */
export interface UIColors {
  primary: string
  primaryHover: string
  background: string
  surface: string
  surfaceHover: string
  text: string
  textSecondary: string
  textMuted: string
  border: string
  borderHover: string
  success: string
  error: string
  warning: string
}

/**
 * 编辑器主题接口
 */
export interface EditorTheme {
  id: ThemeId
  name: string
  type: 'light' | 'dark'
  colors: ThemeColors
  ui: UIColors
}

/**
 * 默认编辑器设置
 */
export const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
  // 主题
  theme: 'vscode-dark',

  // 字体
  fontFamily: 'Fira Code',
  fontSize: 14,
  lineHeight: 1.5,
  fontLigatures: true,

  // 行为
  tabSize: 4,
  wordWrap: 'on',
  lineNumbers: 'on',
  minimap: false,
  bracketMatching: true,
  lineHighlight: true,
  cursorStyle: 'line',

  // AI
  aiCompletionEnabled: true,

  // 背景
  backgroundImage: null,
  backgroundOpacity: 100,
  backgroundBlur: 0,
  backgroundPosition: 'center',
  overlayColor: '#000000',
  overlayOpacity: 0,
}

/**
 * 字体选项列表
 */
export const FONT_OPTIONS: { value: FontFamily; label: string; description: string }[] = [
  { value: 'Fira Code', label: 'Fira Code', description: '支持连字，推荐' },
  { value: 'JetBrains Mono', label: 'JetBrains Mono', description: 'JetBrains 出品' },
  { value: 'Source Code Pro', label: 'Source Code Pro', description: 'Adobe 出品' },
  { value: 'Consolas', label: 'Consolas', description: 'Windows 经典' },
  { value: 'Monaco', label: 'Monaco', description: 'macOS 经典' },
  { value: 'Menlo', label: 'Menlo', description: 'macOS 默认' },
  { value: 'Ubuntu Mono', label: 'Ubuntu Mono', description: 'Ubuntu 默认' },
]

/**
 * Tab 大小选项
 */
export const TAB_SIZE_OPTIONS: { value: TabSize; label: string }[] = [
  { value: 2, label: '2 空格' },
  { value: 4, label: '4 空格' },
  { value: 8, label: '8 空格' },
]

/**
 * 光标样式选项
 */
export const CURSOR_STYLE_OPTIONS: { value: CursorStyle; label: string }[] = [
  { value: 'line', label: '竖线' },
  { value: 'block', label: '方块' },
  { value: 'underline', label: '下划线' },
]

/**
 * 背景位置选项
 */
export const BACKGROUND_POSITION_OPTIONS: { value: BackgroundPosition; label: string }[] = [
  { value: 'center', label: '居中' },
  { value: 'tile', label: '平铺' },
  { value: 'stretch', label: '拉伸' },
  { value: 'fit', label: '适应' },
]

/**
 * 设置导出格式
 */
export interface EditorSettingsExport {
  version: number
  exportedAt: string
  settings: EditorSettings
}

/**
 * localStorage 存储格式
 */
export interface EditorSettingsStorage {
  version: number
  settings: EditorSettings
  lastUpdated: number
}

// 存储键名
export const STORAGE_KEY_SETTINGS = 'oj-editor-settings'
export const STORAGE_KEY_BACKGROUND = 'oj-editor-background'
export const SETTINGS_VERSION = 1
