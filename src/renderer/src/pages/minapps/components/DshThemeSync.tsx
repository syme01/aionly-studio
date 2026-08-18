import { useTheme } from '@renderer/context/ThemeProvider'
import { ThemeMode } from '@renderer/types'
import type { WebviewTag } from 'electron'
import type { FC } from 'react'
import { useEffect } from 'react'

/** DeepSeek Harness 小程序 webview 的 data-minapp-id（同 DeepSeekHarnessButton 的 app.id） */
export const DSH_MINAPP_ID = 'deepseek-harness'

/** dsh Web UI 的暗色样式由 body[data-ds-dark-theme] 属性驱动（CSS 变量整体切换） */
const APPLY_THEME_SCRIPT = `(function (dark) {
  if (!document.body) return
  if (dark) document.body.setAttribute('data-ds-dark-theme', '')
  else document.body.removeAttribute('data-ds-dark-theme')
})`

let currentDark = false
let observer: MutationObserver | null = null
let syncScheduled = false
const boundWebviews = new WeakSet<WebviewTag>()

const applyThemeToWebview = (wv: WebviewTag, dark: boolean) => {
  wv.executeJavaScript(`${APPLY_THEME_SCRIPT}(${dark})`).catch(() => {
    // 页面导航中执行失败可忽略，dom-ready 后会重试
  })
}

/** 页面每次（重）加载后重新应用，覆盖 dsh 自身跟随系统主题的判定 */
const bindWebview = (wv: WebviewTag) => {
  if (boundWebviews.has(wv)) return
  boundWebviews.add(wv)
  wv.addEventListener('dom-ready', () => applyThemeToWebview(wv, currentDark))
}

/** 将明暗主题应用到所有打开的 DeepSeek Harness webview */
export const syncDshTheme = (dark: boolean) => {
  currentDark = dark
  document.querySelectorAll<WebviewTag>(`webview[data-minapp-id="${DSH_MINAPP_ID}"]`).forEach((wv) => {
    bindWebview(wv)
    applyThemeToWebview(wv, dark)
  })
}

const scheduleSync = () => {
  if (syncScheduled) return
  syncScheduled = true
  requestAnimationFrame(() => {
    syncScheduled = false
    syncDshTheme(currentDark)
  })
}

/**
 * 跟随应用主题切换，把明暗同步进 DeepSeek Harness 小程序 webview。
 * 挂载在应用根部，覆盖小程序弹窗与标签页两种打开方式。
 */
export const DshThemeSync: FC = () => {
  const { theme } = useTheme()

  // 监听 webview 的创建（打开小程序时才存在）
  useEffect(() => {
    if (observer) return
    observer = new MutationObserver(scheduleSync)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => {
      observer?.disconnect()
      observer = null
    }
  }, [])

  // 应用主题变化时同步
  useEffect(() => {
    syncDshTheme(theme === ThemeMode.dark)
  }, [theme])

  return null
}
