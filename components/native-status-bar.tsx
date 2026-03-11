'use client'

import { useEffect } from 'react'

export function NativeStatusBar() {
  useEffect(() => {
    const setupStatusBar = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core')
        if (Capacitor.isNativePlatform()) {
          const { StatusBar, Style } = await import('@capacitor/status-bar')
          await StatusBar.setStyle({ style: Style.Light })
          await StatusBar.setBackgroundColor({ color: '#228B22' })
        }
      } catch {
        // Not in native context, ignore
      }
    }
    setupStatusBar()
  }, [])

  return null
}
