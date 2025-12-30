/**
 * Editor Settings Store Tests
 * 测试设置持久化、主题切换、背景图片存储
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useEditorSettingsStore, getEditorSettings } from './editorSettingsStore'
import {
  DEFAULT_EDITOR_SETTINGS,
} from '../types/editor'

describe('editorSettingsStore', () => {
  beforeEach(() => {
    // Reset store to defaults before each test
    useEditorSettingsStore.getState().resetToDefaults()
    localStorage.clear()
  })

  describe('Settings Persistence', () => {
    it('should initialize with default settings', () => {
      const settings = getEditorSettings()
      expect(settings.theme).toBe(DEFAULT_EDITOR_SETTINGS.theme)
      expect(settings.fontSize).toBe(DEFAULT_EDITOR_SETTINGS.fontSize)
      expect(settings.fontFamily).toBe(DEFAULT_EDITOR_SETTINGS.fontFamily)
    })

    it('should persist theme changes to localStorage', () => {
      const store = useEditorSettingsStore.getState()
      store.setTheme('claude')

      // Verify state updated
      expect(useEditorSettingsStore.getState().theme).toBe('claude')
    })

    it('should persist font settings', () => {
      const store = useEditorSettingsStore.getState()
      store.setFontSize(18)
      store.setFontFamily('JetBrains Mono')
      store.setLineHeight(1.8)
      store.setFontLigatures(false)

      const settings = getEditorSettings()
      expect(settings.fontSize).toBe(18)
      expect(settings.fontFamily).toBe('JetBrains Mono')
      expect(settings.lineHeight).toBe(1.8)
      expect(settings.fontLigatures).toBe(false)
    })

    it('should persist behavior settings', () => {
      const store = useEditorSettingsStore.getState()
      store.setTabSize(2)
      store.setWordWrap('off')
      store.setLineNumbers('relative')
      store.setMinimap(true)
      store.setBracketMatching(false)
      store.setLineHighlight(false)
      store.setCursorStyle('block')

      const settings = getEditorSettings()
      expect(settings.tabSize).toBe(2)
      expect(settings.wordWrap).toBe('off')
      expect(settings.lineNumbers).toBe('relative')
      expect(settings.minimap).toBe(true)
      expect(settings.bracketMatching).toBe(false)
      expect(settings.lineHighlight).toBe(false)
      expect(settings.cursorStyle).toBe('block')
    })

    it('should reset to defaults', () => {
      const store = useEditorSettingsStore.getState()
      store.setTheme('claude')
      store.setFontSize(20)
      store.setMinimap(true)

      store.resetToDefaults()

      const settings = getEditorSettings()
      expect(settings.theme).toBe(DEFAULT_EDITOR_SETTINGS.theme)
      expect(settings.fontSize).toBe(DEFAULT_EDITOR_SETTINGS.fontSize)
      expect(settings.minimap).toBe(DEFAULT_EDITOR_SETTINGS.minimap)
    })
  })

  describe('Theme Switching', () => {
    it('should switch to Claude theme', () => {
      const store = useEditorSettingsStore.getState()
      store.setTheme('claude')
      expect(useEditorSettingsStore.getState().theme).toBe('claude')
    })

    it('should switch to ChatGPT theme', () => {
      const store = useEditorSettingsStore.getState()
      store.setTheme('chatgpt')
      expect(useEditorSettingsStore.getState().theme).toBe('chatgpt')
    })

    it('should switch to Gemini theme', () => {
      const store = useEditorSettingsStore.getState()
      store.setTheme('gemini')
      expect(useEditorSettingsStore.getState().theme).toBe('gemini')
    })

    it('should switch to VS Code Dark theme', () => {
      const store = useEditorSettingsStore.getState()
      store.setTheme('vscode-dark')
      expect(useEditorSettingsStore.getState().theme).toBe('vscode-dark')
    })

    it('should switch to VS Code Light theme', () => {
      const store = useEditorSettingsStore.getState()
      store.setTheme('vscode-light')
      expect(useEditorSettingsStore.getState().theme).toBe('vscode-light')
    })

    it('should switch to GitHub Dark theme', () => {
      const store = useEditorSettingsStore.getState()
      store.setTheme('github-dark')
      expect(useEditorSettingsStore.getState().theme).toBe('github-dark')
    })

    it('should switch to Dracula theme', () => {
      const store = useEditorSettingsStore.getState()
      store.setTheme('dracula')
      expect(useEditorSettingsStore.getState().theme).toBe('dracula')
    })
  })

  describe('Background Image Storage', () => {
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

    it('should store background image', () => {
      const store = useEditorSettingsStore.getState()
      store.setBackgroundImage(testImageBase64)

      expect(useEditorSettingsStore.getState().backgroundImage).toBe(testImageBase64)
    })

    it('should store background opacity', () => {
      const store = useEditorSettingsStore.getState()
      store.setBackgroundOpacity(50)

      expect(useEditorSettingsStore.getState().backgroundOpacity).toBe(50)
    })

    it('should clamp background opacity to valid range', () => {
      const store = useEditorSettingsStore.getState()
      
      store.setBackgroundOpacity(150)
      expect(useEditorSettingsStore.getState().backgroundOpacity).toBe(100)

      store.setBackgroundOpacity(-10)
      expect(useEditorSettingsStore.getState().backgroundOpacity).toBe(0)
    })

    it('should store background blur', () => {
      const store = useEditorSettingsStore.getState()
      store.setBackgroundBlur(10)

      expect(useEditorSettingsStore.getState().backgroundBlur).toBe(10)
    })

    it('should clamp background blur to valid range', () => {
      const store = useEditorSettingsStore.getState()
      
      store.setBackgroundBlur(30)
      expect(useEditorSettingsStore.getState().backgroundBlur).toBe(20)

      store.setBackgroundBlur(-5)
      expect(useEditorSettingsStore.getState().backgroundBlur).toBe(0)
    })

    it('should store background position', () => {
      const store = useEditorSettingsStore.getState()
      store.setBackgroundPosition('tile')

      expect(useEditorSettingsStore.getState().backgroundPosition).toBe('tile')
    })

    it('should store overlay settings', () => {
      const store = useEditorSettingsStore.getState()
      store.setOverlayColor('#ff0000')
      store.setOverlayOpacity(30)

      expect(useEditorSettingsStore.getState().overlayColor).toBe('#ff0000')
      expect(useEditorSettingsStore.getState().overlayOpacity).toBe(30)
    })

    it('should remove background and reset related settings', () => {
      const store = useEditorSettingsStore.getState()
      store.setBackgroundImage(testImageBase64)
      store.setBackgroundOpacity(50)
      store.setBackgroundBlur(10)
      store.setOverlayOpacity(20)

      store.removeBackground()

      const settings = getEditorSettings()
      expect(settings.backgroundImage).toBeNull()
      expect(settings.backgroundOpacity).toBe(100)
      expect(settings.backgroundBlur).toBe(0)
      expect(settings.overlayOpacity).toBe(0)
    })
  })

  describe('Import/Export', () => {
    it('should export settings correctly', () => {
      const store = useEditorSettingsStore.getState()
      store.setTheme('claude')
      store.setFontSize(16)

      const exported = store.exportSettings()

      expect(exported.version).toBe(1)
      expect(exported.exportedAt).toBeDefined()
      expect(exported.settings.theme).toBe('claude')
      expect(exported.settings.fontSize).toBe(16)
    })

    it('should import valid settings', () => {
      const store = useEditorSettingsStore.getState()
      const importData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        settings: {
          ...DEFAULT_EDITOR_SETTINGS,
          theme: 'dracula' as const,
          fontSize: 18,
        },
      }

      const success = store.importSettings(importData)

      expect(success).toBe(true)
      expect(useEditorSettingsStore.getState().theme).toBe('dracula')
      expect(useEditorSettingsStore.getState().fontSize).toBe(18)
    })

    it('should reject invalid settings version', () => {
      const store = useEditorSettingsStore.getState()
      const importData = {
        version: 999,
        exportedAt: new Date().toISOString(),
        settings: DEFAULT_EDITOR_SETTINGS,
      }

      const success = store.importSettings(importData)

      expect(success).toBe(false)
    })

    it('should reject settings with invalid values', () => {
      const store = useEditorSettingsStore.getState()
      const importData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        settings: {
          ...DEFAULT_EDITOR_SETTINGS,
          fontSize: 100, // Invalid: out of range
        },
      }

      const success = store.importSettings(importData)

      expect(success).toBe(false)
    })
  })

  describe('AI Completion Settings', () => {
    it('should toggle AI completion', () => {
      const store = useEditorSettingsStore.getState()
      
      // Default should be enabled
      expect(useEditorSettingsStore.getState().aiCompletionEnabled).toBe(true)

      store.setAICompletionEnabled(false)
      expect(useEditorSettingsStore.getState().aiCompletionEnabled).toBe(false)

      store.setAICompletionEnabled(true)
      expect(useEditorSettingsStore.getState().aiCompletionEnabled).toBe(true)
    })
  })

  describe('Font Size Validation', () => {
    it('should clamp font size to valid range', () => {
      const store = useEditorSettingsStore.getState()
      
      store.setFontSize(30)
      expect(useEditorSettingsStore.getState().fontSize).toBe(24)

      store.setFontSize(8)
      expect(useEditorSettingsStore.getState().fontSize).toBe(12)
    })
  })

  describe('Line Height Validation', () => {
    it('should clamp line height to valid range', () => {
      const store = useEditorSettingsStore.getState()
      
      store.setLineHeight(3.0)
      expect(useEditorSettingsStore.getState().lineHeight).toBe(2.0)

      store.setLineHeight(0.5)
      expect(useEditorSettingsStore.getState().lineHeight).toBe(1.0)
    })
  })
})
