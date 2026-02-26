'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import MaintenanceScreen from './MaintenanceScreen'

// Carga instantánea de componentes críticos
import Header from './Header'
import Navbar from './Navbar'
import Footer from './Footer'

export default function ClientLayout({ 
  children, 
  initialConfig 
}: { 
  children: React.ReactNode,
  initialConfig?: any 
}) {
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [theme, setTheme] = useState('dark')
  
  // Maintenance State
  const [isMaintenance, setIsMaintenance] = useState(false)
  const [bypassMaintenance, setBypassMaintenance] = useState(false)

  const pathname = usePathname()
  const isAdmin = pathname?.startsWith('/panel')
  const isCheckout = pathname === '/checkout'
  const isPayment = pathname === '/payment'
  const isCart = pathname === '/cart'
  const isProductDetail = pathname?.startsWith('/productos/')

  const isLegal = pathname?.startsWith('/legales') || pathname?.startsWith('/terminos') || pathname?.startsWith('/privacidad')

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  // Efecto para actualizar título según la ruta
  useEffect(() => {
    if (pathname === '/') {
      document.title = 'URBAN'
    }
  }, [pathname])

  useEffect(() => {
    // Carga instantánea sin delays
    setMounted(true)
    setIsLoading(false)

    // Check Bypass
    const isBypassed = localStorage.getItem('maintenance_bypass') === 'true'
    setBypassMaintenance(isBypassed)

    // Aplicar tema oscuro
    document.documentElement.setAttribute('data-theme', 'dark')

    // Cargar configuración desde API local
    const updateConfig = async () => {
      try {
        const res = await fetch('/api/config')
        const data = await res.json()
        
        if (data) {
          // Check maintenance mode
          // Only enable if explicitly true string or boolean
          const maintenanceActive = data.maintenance_mode === 'true' || data.maintenance_mode === true
          setIsMaintenance(maintenanceActive)
        }
      } catch (error) {
        console.error('Error loading config:', error)
      }
    }

    const init = async () => {
      await updateConfig()
    }

    init()
    
    // Revelar elementos al hacer scroll
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
        }
      })
    }, observerOptions)

    const revealElements = document.querySelectorAll('.reveal')
    revealElements.forEach(el => observer.observe(el))

    // Re-observar cuando cambie el pathname
    const observerInterval = setInterval(() => {
      const newItems = document.querySelectorAll('.reveal:not(.observed)')
      newItems.forEach(el => {
        el.classList.add('observed')
        observer.observe(el)
      })
    }, 1000)

    window.addEventListener('config-updated', updateConfig)
    window.addEventListener('storage', (e) => {
      if (e.key === 'config-updated') updateConfig()
    })
    
    return () => {
      window.removeEventListener('config-updated', updateConfig)
      window.removeEventListener('storage', updateConfig)
      observer.disconnect()
      clearInterval(observerInterval)
    }
  }, [pathname])

  // Handle unlock from MaintenanceScreen
  const handleUnlock = () => {
    localStorage.setItem('maintenance_bypass', 'true')
    setBypassMaintenance(true)
    setIsMaintenance(false) // Or just let the re-render handle it via bypass check, but clearing state helps instant feedback
    window.location.reload()
  }

  // Show Maintenance Screen if active, not bypassed, and NOT in admin
  if (isMaintenance && !bypassMaintenance && !isAdmin) {
    return <MaintenanceScreen onUnlock={handleUnlock} />
  }

  return (
    <>
      {!isAdmin && !isCheckout && !isPayment && !isCart && (
        <Header theme={theme} toggleTheme={toggleTheme} initialConfig={initialConfig} />
      )}
      <main className="min-h-screen">{children}</main>
      {!isAdmin && !isCheckout && !isPayment && !isCart && !isProductDetail && !isLegal && <Footer />}
    </>
  )
}
