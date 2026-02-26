
'use client'

import { useState, useEffect, useRef } from 'react'
import { gifPersistence } from '@/lib/gif-persistence'

interface GifIconProps {
  src: string
  alt: string
  className?: string
  fallbackSrc?: string
}

export default function GifIcon({ src, alt, className, fallbackSrc }: GifIconProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const mountedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    let currentObjectUrl: string | null = null;

    const loadGif = async () => {
      try {
        // Try to get from persistent storage first
        const blob = await gifPersistence.getGif(src)
        
        if (blob) {
          currentObjectUrl = URL.createObjectURL(blob)
          if (mountedRef.current) {
            setObjectUrl(currentObjectUrl)
          }
        } else {
          // If not in storage, fetch it
          try {
            const response = await fetch(src)
            if (!response.ok) throw new Error('Network error')
            
            const newBlob = await response.blob()
            
            // Save for next time
            gifPersistence.saveGif(src, newBlob).catch(err => 
              console.warn('Failed to save gif to persistence:', err)
            )
            
            currentObjectUrl = URL.createObjectURL(newBlob)
            if (mountedRef.current) {
              setObjectUrl(currentObjectUrl)
            }
          } catch (fetchError) {
            console.warn(`Failed to fetch gif ${src}:`, fetchError)
            // If fetch fails, we might just rely on the browser to load it via normal img tag
            // or show fallback if we are completely offline and it's not in cache.
            // But here we set error to true to trigger fallback logic if needed
            // However, we can also fall back to just setting the src directly 
            // and letting the browser handle it (maybe it's in disk cache but fetch failed?)
            if (mountedRef.current) {
               // Use original src as fallback if blob fetch fails, 
               // hoping browser cache handles it or it's a temporary glitch
               // But if we are offline and it's not in cache, this will fail too.
               setObjectUrl(src) 
            }
          }
        }
      } catch (e) {
        console.error('Error in GifIcon loading:', e)
        if (mountedRef.current) {
          setObjectUrl(src) // Fallback to normal URL
        }
      }
    }

    loadGif()

    return () => {
      mountedRef.current = false
      if (currentObjectUrl && currentObjectUrl.startsWith('blob:')) {
        URL.revokeObjectURL(currentObjectUrl)
      }
    }
  }, [src])

  const handleError = () => {
    setError(true)
  }

  if (error) {
    if (fallbackSrc) {
       return <img src={fallbackSrc} alt={alt} className={className} />
    }
    // Simple text fallback or empty if no fallback image
    return <span className={`inline-block bg-gray-200 rounded-full ${className}`} style={{ width: '20px', height: '20px' }} title={alt}></span>
  }

  // If we have an object URL (blob) or fell back to src
  if (objectUrl) {
    return (
      <img 
        src={objectUrl} 
        alt={alt} 
        className={className} 
        onError={handleError}
      />
    )
  }

  // Loading state - maybe show a placeholder or nothing
  // For small icons, showing nothing is usually better than a layout shift or spinner
  // But we can show a small placeholder
  return <span className={`inline-block animate-pulse bg-white/10 rounded-full ${className}`}></span>
}
