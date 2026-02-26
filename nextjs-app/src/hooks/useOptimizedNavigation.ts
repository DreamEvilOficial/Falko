'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

export function useOptimizedNavigation() {
  const router = useRouter()

  // Prefetch común de páginas importantes
  const prefetchMainPages = useCallback(() => {
    router.prefetch('/')
    router.prefetch('/productos')
    router.prefetch('/cart')
    router.prefetch('/contacto')
  }, [router])

  // Navegación instantánea sin delays
  const navigate = useCallback((href: string) => {
    // Prefetch y navegación instantánea
    router.prefetch(href)
    router.push(href)
  }, [router])

  return {
    navigate,
    prefetchMainPages,
    router
  }
}