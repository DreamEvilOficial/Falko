'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export function usePageTransition() {
  const [isNavigating, setIsNavigating] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    setIsNavigating(false)
  }, [pathname])

  const navigateWithTransition = (href: string) => {
    setIsNavigating(true)
    
    // Prefetch inmediato
    router.prefetch(href)
    
    // Navegación optimizada
    setTimeout(() => {
      router.push(href)
    }, 50)
  }

  return {
    isNavigating,
    navigateWithTransition
  }
}