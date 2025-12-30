/**
 * 编辑器主题定义
 * 包含 Claude、ChatGPT、Gemini、VS Code、GitHub、Dracula 等预设主题
 */

import type { EditorTheme, ThemeId } from '../../../types/editor'

/**
 * Claude 主题 - 温暖橙色调
 */
export const claudeTheme: EditorTheme = {
  id: 'claude',
  name: 'Claude',
  type: 'dark',
  colors: {
    'editor.background': '#2d2a2e',
    'editor.foreground': '#fcfcfa',
    'editor.lineHighlightBackground': '#3d3a3e',
    'editor.selectionBackground': '#da775644',
    'editorCursor.foreground': '#da7756',
    'editorLineNumber.foreground': '#727072',
    'editorLineNumber.activeForeground': '#da7756',
    'editorIndentGuide.background': '#3d3a3e',
    'editorIndentGuide.activeBackground': '#5d5a5e',
    'editorWhitespace.foreground': '#3d3a3e',
    keyword: '#da7756',
    string: '#a9dc76',
    number: '#ab9df2',
    comment: '#727072',
    function: '#78dce8',
    variable: '#fcfcfa',
    type: '#ffd866',
    operator: '#ff6188',
    class: '#ffd866',
    constant: '#ab9df2',
  },
  ui: {
    primary: '#da7756',
    primaryHover: '#e8896a',
    background: '#1a1819',
    surface: '#2d2a2e',
    surfaceHover: '#3d3a3e',
    text: '#fcfcfa',
    textSecondary: '#c1c0c0',
    textMuted: '#727072',
    border: '#3d3a3e',
    borderHover: '#5d5a5e',
    success: '#a9dc76',
    error: '#ff6188',
    warning: '#ffd866',
  },
}

/**
 * ChatGPT 主题 - 绿色调，深色背景
 */
export const chatgptTheme: EditorTheme = {
  id: 'chatgpt',
  name: 'ChatGPT',
  type: 'dark',
  colors: {
    'editor.background': '#343541',
    'editor.foreground': '#ececf1',
    'editor.lineHighlightBackground': '#40414f',
    'editor.selectionBackground': '#10a37f44',
    'editorCursor.foreground': '#10a37f',
    'editorLineNumber.foreground': '#6e6e80',
    'editorLineNumber.activeForeground': '#10a37f',
    'editorIndentGuide.background': '#40414f',
    'editorIndentGuide.activeBackground': '#565869',
    'editorWhitespace.foreground': '#40414f',
    keyword: '#10a37f',
    string: '#98c379',
    number: '#d19a66',
    comment: '#6e6e80',
    function: '#61afef',
    variable: '#ececf1',
    type: '#e5c07b',
    operator: '#56b6c2',
    class: '#e5c07b',
    constant: '#d19a66',
  },
  ui: {
    primary: '#10a37f',
    primaryHover: '#1a7f64',
    background: '#202123',
    surface: '#343541',
    surfaceHover: '#40414f',
    text: '#ececf1',
    textSecondary: '#c5c5d2',
    textMuted: '#6e6e80',
    border: '#40414f',
    borderHover: '#565869',
    success: '#10a37f',
    error: '#ef4444',
    warning: '#f59e0b',
  },
}


/**
 * Gemini 主题 - 蓝紫渐变，Google 风格
 */
export const geminiTheme: EditorTheme = {
  id: 'gemini',
  name: 'Gemini',
  type: 'dark',
  colors: {
    'editor.background': '#1e1f22',
    'editor.foreground': '#e3e3e8',
    'editor.lineHighlightBackground': '#2b2d31',
    'editor.selectionBackground': '#8b5cf644',
    'editorCursor.foreground': '#8b5cf6',
    'editorLineNumber.foreground': '#5c5f66',
    'editorLineNumber.activeForeground': '#8b5cf6',
    'editorIndentGuide.background': '#2b2d31',
    'editorIndentGuide.activeBackground': '#3f4147',
    'editorWhitespace.foreground': '#2b2d31',
    keyword: '#8b5cf6',
    string: '#34d399',
    number: '#f472b6',
    comment: '#5c5f66',
    function: '#60a5fa',
    variable: '#e3e3e8',
    type: '#fbbf24',
    operator: '#f472b6',
    class: '#fbbf24',
    constant: '#f472b6',
  },
  ui: {
    primary: '#8b5cf6',
    primaryHover: '#7c3aed',
    background: '#131416',
    surface: '#1e1f22',
    surfaceHover: '#2b2d31',
    text: '#e3e3e8',
    textSecondary: '#b4b4bb',
    textMuted: '#5c5f66',
    border: '#2b2d31',
    borderHover: '#3f4147',
    success: '#34d399',
    error: '#f87171',
    warning: '#fbbf24',
  },
}

/**
 * VS Code Dark 主题 - 经典深色
 */
export const vscodeDarkTheme: EditorTheme = {
  id: 'vscode-dark',
  name: 'VS Code Dark',
  type: 'dark',
  colors: {
    'editor.background': '#1e1e1e',
    'editor.foreground': '#d4d4d4',
    'editor.lineHighlightBackground': '#2a2d2e',
    'editor.selectionBackground': '#264f78',
    'editorCursor.foreground': '#aeafad',
    'editorLineNumber.foreground': '#858585',
    'editorLineNumber.activeForeground': '#c6c6c6',
    'editorIndentGuide.background': '#404040',
    'editorIndentGuide.activeBackground': '#707070',
    'editorWhitespace.foreground': '#3b3b3b',
    keyword: '#569cd6',
    string: '#ce9178',
    number: '#b5cea8',
    comment: '#6a9955',
    function: '#dcdcaa',
    variable: '#9cdcfe',
    type: '#4ec9b0',
    operator: '#d4d4d4',
    class: '#4ec9b0',
    constant: '#4fc1ff',
  },
  ui: {
    primary: '#007acc',
    primaryHover: '#0098ff',
    background: '#181818',
    surface: '#1e1e1e',
    surfaceHover: '#2a2d2e',
    text: '#d4d4d4',
    textSecondary: '#a0a0a0',
    textMuted: '#858585',
    border: '#3c3c3c',
    borderHover: '#505050',
    success: '#4ec9b0',
    error: '#f14c4c',
    warning: '#cca700',
  },
}

/**
 * VS Code Light 主题 - 经典浅色
 */
export const vscodeLightTheme: EditorTheme = {
  id: 'vscode-light',
  name: 'VS Code Light',
  type: 'light',
  colors: {
    'editor.background': '#ffffff',
    'editor.foreground': '#000000',
    'editor.lineHighlightBackground': '#f3f3f3',
    'editor.selectionBackground': '#add6ff',
    'editorCursor.foreground': '#000000',
    'editorLineNumber.foreground': '#237893',
    'editorLineNumber.activeForeground': '#0b216f',
    'editorIndentGuide.background': '#d3d3d3',
    'editorIndentGuide.activeBackground': '#939393',
    'editorWhitespace.foreground': '#d3d3d3',
    keyword: '#0000ff',
    string: '#a31515',
    number: '#098658',
    comment: '#008000',
    function: '#795e26',
    variable: '#001080',
    type: '#267f99',
    operator: '#000000',
    class: '#267f99',
    constant: '#0070c1',
  },
  ui: {
    primary: '#007acc',
    primaryHover: '#0098ff',
    background: '#f3f3f3',
    surface: '#ffffff',
    surfaceHover: '#f3f3f3',
    text: '#000000',
    textSecondary: '#616161',
    textMuted: '#6e7681',
    border: '#e5e5e5',
    borderHover: '#c8c8c8',
    success: '#267f99',
    error: '#d32f2f',
    warning: '#bf8803',
  },
}


/**
 * GitHub Dark 主题
 */
export const githubDarkTheme: EditorTheme = {
  id: 'github-dark',
  name: 'GitHub Dark',
  type: 'dark',
  colors: {
    'editor.background': '#0d1117',
    'editor.foreground': '#c9d1d9',
    'editor.lineHighlightBackground': '#161b22',
    'editor.selectionBackground': '#3b5070',
    'editorCursor.foreground': '#58a6ff',
    'editorLineNumber.foreground': '#6e7681',
    'editorLineNumber.activeForeground': '#c9d1d9',
    'editorIndentGuide.background': '#21262d',
    'editorIndentGuide.activeBackground': '#30363d',
    'editorWhitespace.foreground': '#21262d',
    keyword: '#ff7b72',
    string: '#a5d6ff',
    number: '#79c0ff',
    comment: '#8b949e',
    function: '#d2a8ff',
    variable: '#ffa657',
    type: '#7ee787',
    operator: '#ff7b72',
    class: '#7ee787',
    constant: '#79c0ff',
  },
  ui: {
    primary: '#58a6ff',
    primaryHover: '#79b8ff',
    background: '#010409',
    surface: '#0d1117',
    surfaceHover: '#161b22',
    text: '#c9d1d9',
    textSecondary: '#8b949e',
    textMuted: '#6e7681',
    border: '#30363d',
    borderHover: '#484f58',
    success: '#3fb950',
    error: '#f85149',
    warning: '#d29922',
  },
}

/**
 * Dracula 主题 - 流行的紫色主题
 */
export const draculaTheme: EditorTheme = {
  id: 'dracula',
  name: 'Dracula',
  type: 'dark',
  colors: {
    'editor.background': '#282a36',
    'editor.foreground': '#f8f8f2',
    'editor.lineHighlightBackground': '#44475a',
    'editor.selectionBackground': '#44475a',
    'editorCursor.foreground': '#f8f8f2',
    'editorLineNumber.foreground': '#6272a4',
    'editorLineNumber.activeForeground': '#f8f8f2',
    'editorIndentGuide.background': '#3b3d4a',
    'editorIndentGuide.activeBackground': '#6272a4',
    'editorWhitespace.foreground': '#3b3d4a',
    keyword: '#ff79c6',
    string: '#f1fa8c',
    number: '#bd93f9',
    comment: '#6272a4',
    function: '#50fa7b',
    variable: '#f8f8f2',
    type: '#8be9fd',
    operator: '#ff79c6',
    class: '#8be9fd',
    constant: '#bd93f9',
  },
  ui: {
    primary: '#bd93f9',
    primaryHover: '#caa9fa',
    background: '#1e1f29',
    surface: '#282a36',
    surfaceHover: '#44475a',
    text: '#f8f8f2',
    textSecondary: '#bfbfbf',
    textMuted: '#6272a4',
    border: '#44475a',
    borderHover: '#6272a4',
    success: '#50fa7b',
    error: '#ff5555',
    warning: '#ffb86c',
  },
}

/**
 * 所有预设主题
 */
export const themes: Record<ThemeId, EditorTheme> = {
  claude: claudeTheme,
  chatgpt: chatgptTheme,
  gemini: geminiTheme,
  'vscode-dark': vscodeDarkTheme,
  'vscode-light': vscodeLightTheme,
  'github-dark': githubDarkTheme,
  dracula: draculaTheme,
}

/**
 * 主题列表（用于 UI 展示）
 */
export const themeList: { id: ThemeId; name: string; type: 'light' | 'dark' }[] = [
  { id: 'claude', name: 'Claude', type: 'dark' },
  { id: 'chatgpt', name: 'ChatGPT', type: 'dark' },
  { id: 'gemini', name: 'Gemini', type: 'dark' },
  { id: 'vscode-dark', name: 'VS Code Dark', type: 'dark' },
  { id: 'vscode-light', name: 'VS Code Light', type: 'light' },
  { id: 'github-dark', name: 'GitHub Dark', type: 'dark' },
  { id: 'dracula', name: 'Dracula', type: 'dark' },
]

/**
 * 获取主题
 */
export function getTheme(id: ThemeId): EditorTheme {
  return themes[id] || vscodeDarkTheme
}

/**
 * 获取默认主题
 */
export function getDefaultTheme(): EditorTheme {
  return vscodeDarkTheme
}
