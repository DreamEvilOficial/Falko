'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface OptimizedLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  onClick?: () => void
  prefetch?: boolean
  onMouseEnter?: () => void
}

export default function OptimizedLink({ 
  href, 
  children, 
  className, 
  onClick, 
  prefetch = true,
  onMouseEnter
}: OptimizedLinkProps) {
  const router = useRouter()

  // Prefetch automático en hover para navegación ultra-rápida
  const handleMouseEnter = () => {
    if (prefetch) {
      router.prefetch(href)
    }
    onMouseEnter?.()
  }

  // Navegación con optimización
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    onClick?.()
    
    // Prefetch si no se ha hecho ya
    if (prefetch) {
      router.prefetch(href)
    }
    
    // Navegación con pequeño delay para permitir prefetch
    setTimeout(() => {
      router.push(href)
    }, 30)
  }

  return (
    <a 
      href={href}
      className={className}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
    >
      {children}
    </a>
  )
}