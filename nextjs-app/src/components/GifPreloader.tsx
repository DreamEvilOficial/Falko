
'use client'

import { useEffect } from 'react'
import { gifPersistence } from '@/lib/gif-persistence'

const CRITICAL_GIFS = [
  '/discount-icon.gif?v=2',
  '/new-label.gif?v=2',
  '/fire.gif?v=2'
]

export default function GifPreloader() {
  useEffect(() => {
    // Prefetch critical gifs on mount (idle time)
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        CRITICAL_GIFS.forEach(url => {
          gifPersistence.prefetchGif(url)
        })
      })
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        CRITICAL_GIFS.forEach(url => {
          gifPersistence.prefetchGif(url)
        })
      }, 2000)
    }
  }, [])

  return null
}
