import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  EditorSettings,
  EditorSettingsExport,
  EditorSettingsStorage,
  ThemeId,
  FontFamily,
  TabSize,
  CursorStyle,
  BackgroundPosition,
  LineNumbersMode,
  WordWrapMode,
} from '../types/editor'
import {
  DEFAULT_EDITOR_SETTINGS,
  STORAGE_KEY_SETTINGS,
  STORAGE_KEY_BACKGROUND,
  SETTINGS_VERSION,
} from '../types/editor'

interface EditorSettingsState extends EditorSettings {
  // Actions - Theme
  setTheme: (theme: ThemeId) => void

  // Actions - Font
  setFontFamily: (fontFamily: FontFamily) => void
  setFontSize: (fontSize: number) => void
  setLineHeight: (lineHeight: number) => void
  setFontLigatures: (enabled: boolean) => void

  // Actions - Behavior
  setTabSize: (tabSize: TabSize) => void
  setWordWrap: (wordWrap: WordWrapMode) => void
  setLineNumbers: (lineNumbers: LineNumbersMode) => void
  setMinimap: (enabled: boolean) => void
  setBracketMatching: (enabled: boolean) => void
  setLineHighlight: (enabled: boolean) => void
  setCursorStyle: (cursorStyle: CursorStyle) => void

  // Actions - AI
  setAICompletionEnabled: (enabled: boolean) => void

  // Actions - Background
  setBackgroundImage: (image: string | null) => void
  setBackgroundOpacity: (opacity: number) => void
  setBackgroundBlur: (blur: number) => void
  setBackgroundPosition: (position: BackgroundPosition) => void
  setOverlayColor: (color: string) => void
  setOverlayOpacity: (opacity: number) => void
  removeBackground: () => void


  // Actions - Bulk operations
  updateSettings: (settings: Partial<EditorSettings>) => void
  resetToDefaults: () => void

  // Actions - Import/Export
  exportSettings: () => EditorSettingsExport
  importSettings: (data: EditorSettingsExport) => boolean
}

/**
 * 验证设置数据的有效性
 */
function validateSettings(settings: Partial<EditorSettings>): boolean {
  // 验证字体大小范围
  if (settings.fontSize !== undefined) {
    if (settings.fontSize < 12 || settings.fontSize > 24) return false
  }

  // 验证行高范围
  if (settings.lineHeight !== undefined) {
    if (settings.lineHeight < 1.0 || settings.lineHeight > 2.0) return false
  }

  // 验证背景透明度范围
  if (settings.backgroundOpacity !== undefined) {
    if (settings.backgroundOpacity < 0 || settings.backgroundOpacity > 100) return false
  }

  // 验证背景模糊度范围
  if (settings.backgroundBlur !== undefined) {
    if (settings.backgroundBlur < 0 || settings.backgroundBlur > 20) return false
  }

  // 验证叠加层透明度范围
  if (settings.overlayOpacity !== undefined) {
    if (settings.overlayOpacity < 0 || settings.overlayOpacity > 100) return false
  }

  return true
}

/**
 * 限制数值在指定范围内
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * 自定义存储，用于分离背景图片存储
 */
const customStorage = {
  getItem: (name: string): string | null => {
    try {
      const settingsStr = localStorage.getItem(name)
      if (!settingsStr) return null

      const storage: EditorSettingsStorage = JSON.parse(settingsStr)

      // 从单独的 key 读取背景图片
      const backgroundImage = localStorage.getItem(STORAGE_KEY_BACKGROUND)
      if (backgroundImage && storage.settings) {
        storage.settings.backgroundImage = backgroundImage
      }

      return JSON.stringify({ state: storage.settings })
    } catch {
      return null
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      const parsed = JSON.parse(value)
      const settings: EditorSettings = parsed.state

      // 分离背景图片存储
      const backgroundImage = settings.backgroundImage
      const settingsWithoutBg = { ...settings, backgroundImage: null }

      const storage: EditorSettingsStorage = {
        version: SETTINGS_VERSION,
        settings: settingsWithoutBg,
        lastUpdated: Date.now(),
      }

      localStorage.setItem(name, JSON.stringify(storage))

      // 单独存储背景图片
      if (backgroundImage) {
        localStorage.setItem(STORAGE_KEY_BACKGROUND, backgroundImage)
      } else {
        localStorage.removeItem(STORAGE_KEY_BACKGROUND)
      }
    } catch (error) {
      console.error('Failed to save editor settings:', error)
    }
  },
  removeItem: (name: string): void => {
    localStorage.removeItem(name)
    localStorage.removeItem(STORAGE_KEY_BACKGROUND)
  },
}


export const useEditorSettingsStore = create<EditorSettingsState>()(
  persist(
    (set, get) => ({
      // Initial state from defaults
      ...DEFAULT_EDITOR_SETTINGS,

      // Theme actions
      setTheme: (theme: ThemeId) => set({ theme }),

      // Font actions
      setFontFamily: (fontFamily: FontFamily) => set({ fontFamily }),
      setFontSize: (fontSize: number) => set({ fontSize: clamp(fontSize, 12, 24) }),
      setLineHeight: (lineHeight: number) => set({ lineHeight: clamp(lineHeight, 1.0, 2.0) }),
      setFontLigatures: (fontLigatures: boolean) => set({ fontLigatures }),

      // Behavior actions
      setTabSize: (tabSize: TabSize) => set({ tabSize }),
      setWordWrap: (wordWrap: WordWrapMode) => set({ wordWrap }),
      setLineNumbers: (lineNumbers: LineNumbersMode) => set({ lineNumbers }),
      setMinimap: (minimap: boolean) => set({ minimap }),
      setBracketMatching: (bracketMatching: boolean) => set({ bracketMatching }),
      setLineHighlight: (lineHighlight: boolean) => set({ lineHighlight }),
      setCursorStyle: (cursorStyle: CursorStyle) => set({ cursorStyle }),

      // AI actions
      setAICompletionEnabled: (aiCompletionEnabled: boolean) => set({ aiCompletionEnabled }),

      // Background actions
      setBackgroundImage: (backgroundImage: string | null) => set({ backgroundImage }),
      setBackgroundOpacity: (backgroundOpacity: number) =>
        set({ backgroundOpacity: clamp(backgroundOpacity, 0, 100) }),
      setBackgroundBlur: (backgroundBlur: number) =>
        set({ backgroundBlur: clamp(backgroundBlur, 0, 20) }),
      setBackgroundPosition: (backgroundPosition: BackgroundPosition) =>
        set({ backgroundPosition }),
      setOverlayColor: (overlayColor: string) => set({ overlayColor }),
      setOverlayOpacity: (overlayOpacity: number) =>
        set({ overlayOpacity: clamp(overlayOpacity, 0, 100) }),
      removeBackground: () =>
        set({
          backgroundImage: null,
          backgroundOpacity: 100,
          backgroundBlur: 0,
          backgroundPosition: 'center',
          overlayColor: '#000000',
          overlayOpacity: 0,
        }),

      // Bulk operations
      updateSettings: (settings: Partial<EditorSettings>) => {
        if (validateSettings(settings)) {
          set(settings)
        }
      },
      resetToDefaults: () => set(DEFAULT_EDITOR_SETTINGS),

      // Import/Export
      exportSettings: (): EditorSettingsExport => {
        const state = get()
        const settings: EditorSettings = {
          theme: state.theme,
          fontFamily: state.fontFamily,
          fontSize: state.fontSize,
          lineHeight: state.lineHeight,
          fontLigatures: state.fontLigatures,
          tabSize: state.tabSize,
          wordWrap: state.wordWrap,
          lineNumbers: state.lineNumbers,
          minimap: state.minimap,
          bracketMatching: state.bracketMatching,
          lineHighlight: state.lineHighlight,
          cursorStyle: state.cursorStyle,
          aiCompletionEnabled: state.aiCompletionEnabled,
          backgroundImage: state.backgroundImage,
          backgroundOpacity: state.backgroundOpacity,
          backgroundBlur: state.backgroundBlur,
          backgroundPosition: state.backgroundPosition,
          overlayColor: state.overlayColor,
          overlayOpacity: state.overlayOpacity,
        }

        return {
          version: SETTINGS_VERSION,
          exportedAt: new Date().toISOString(),
          settings,
        }
      },

      importSettings: (data: EditorSettingsExport): boolean => {
        try {
          // 验证版本
          if (typeof data.version !== 'number' || data.version > SETTINGS_VERSION) {
            console.error('Unsupported settings version')
            return false
          }

          // 验证设置数据
          if (!data.settings || typeof data.settings !== 'object') {
            console.error('Invalid settings data')
            return false
          }

          // 验证设置值
          if (!validateSettings(data.settings)) {
            console.error('Settings validation failed')
            return false
          }

          // 合并默认值以确保所有字段都存在
          const mergedSettings: EditorSettings = {
            ...DEFAULT_EDITOR_SETTINGS,
            ...data.settings,
          }

          set(mergedSettings)
          return true
        } catch (error) {
          console.error('Failed to import settings:', error)
          return false
        }
      },
    }),
    {
      name: STORAGE_KEY_SETTINGS,
      storage: createJSONStorage(() => customStorage),
    }
  )
)

/**
 * 获取当前设置的纯对象（不包含 actions）
 */
export function getEditorSettings(): EditorSettings {
  const state = useEditorSettingsStore.getState()
  return {
    theme: state.theme,
    fontFamily: state.fontFamily,
    fontSize: state.fontSize,
    lineHeight: state.lineHeight,
    fontLigatures: state.fontLigatures,
    tabSize: state.tabSize,
    wordWrap: state.wordWrap,
    lineNumbers: state.lineNumbers,
    minimap: state.minimap,
    bracketMatching: state.bracketMatching,
    lineHighlight: state.lineHighlight,
    cursorStyle: state.cursorStyle,
    aiCompletionEnabled: state.aiCompletionEnabled,
    backgroundImage: state.backgroundImage,
    backgroundOpacity: state.backgroundOpacity,
    backgroundBlur: state.backgroundBlur,
    backgroundPosition: state.backgroundPosition,
    overlayColor: state.overlayColor,
    overlayOpacity: state.overlayOpacity,
  }
}
