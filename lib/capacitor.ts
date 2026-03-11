'use client'

import { Capacitor } from '@capacitor/core'

/**
 * Check if the app is running inside a native Capacitor container
 */
export const isNative = (): boolean => {
  return Capacitor.isNativePlatform()
}

/**
 * Get the current platform
 */
export const getPlatform = (): 'ios' | 'android' | 'web' => {
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web'
}

/**
 * Check if a specific plugin is available
 */
export const isPluginAvailable = (pluginName: string): boolean => {
  return Capacitor.isPluginAvailable(pluginName)
}
