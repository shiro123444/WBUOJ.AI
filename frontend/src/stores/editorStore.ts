/**
 * Editor Store - 管理编辑器的代码、语言和主题状态
 * 
 * 整合 editorSettingsStore 的主题设置，提供统一的编辑器状态管理
 */

import { create } from 'zustand'
import type { SupportedLanguage } from '../types'
import type { EditorTheme } from '../types/editor'
import { getTheme } from '../components/editor/themes'
import { useEditorSettingsStore } from './editorSettingsStore'

interface EditorState {
  // Code state
  code: string
  language: SupportedLanguage
  
  // Computed theme (from settings)
  currentTheme: EditorTheme
  
  // Actions
  setCode: (code: string) => void
  setLanguage: (language: SupportedLanguage) => void
  
  // Sync theme from settings
  syncTheme: () => void
}

export const useEditorStore = create<EditorState>()((set) => {
  // Get initial theme from settings
  const initialThemeId = useEditorSettingsStore.getState().theme
  const initialTheme = getTheme(initialThemeId)

  return {
    code: '',
    language: 'cpp',
    currentTheme: initialTheme,

    setCode: (code: string) => set({ code }),
    
    setLanguage: (language: SupportedLanguage) => set({ language }),
    
    syncTheme: () => {
      const themeId = useEditorSettingsStore.getState().theme
      const theme = getTheme(themeId)
      set({ currentTheme: theme })
    },
  }
})

// Subscribe to theme changes from settings store
useEditorSettingsStore.subscribe((state, prevState) => {
  if (state.theme !== prevState.theme) {
    const theme = getTheme(state.theme)
    useEditorStore.setState({ currentTheme: theme })
  }
})

export default useEditorStore
