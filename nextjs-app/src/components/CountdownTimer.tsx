'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

export default function CountdownTimer({ targetDate, onExpire }: { targetDate: string, onExpire?: () => void }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [isExpired, setIsExpired] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const calculateTimeLeft = () => {
      // Handle potential different date formats
      let dateStr = targetDate
      // Ensure ISO format compatibility (replace space with T if needed for Safari/others)
      if (dateStr && typeof dateStr === 'string' && dateStr.includes(' ') && !dateStr.includes('T')) {
          dateStr = dateStr.replace(' ', 'T')
      }

      const target = new Date(dateStr).getTime()
      
      // Safety check for invalid dates
      if (isNaN(target)) {
          console.error('[CountdownTimer] Invalid date:', targetDate)
          return // Keep locked if date is invalid
      }

      const now = new Date().getTime()
      const difference = target - now
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        })
        setIsExpired(false)
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        if (!isExpired) {
             setIsExpired(true)
             if (onExpire) onExpire()
        }
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [targetDate])

  if (!mounted) return null

  if (isExpired) {
    return (
      <div className="text-center animate-in fade-in zoom-in duration-500">
        <span className="text-green-500 font-black text-lg tracking-[0.2em] uppercase drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]">
          ¡DESBLOQUEADO!
        </span>
      </div>
    )
  }

  return (
    <div className="w-full text-center">
      <div className="flex items-center justify-center gap-2 mb-2 text-white/60 text-[10px] font-bold uppercase tracking-[0.2em]">
        <Clock className="w-3 h-3" /> Lanzamiento en
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'DÍAS', value: timeLeft.days },
          { label: 'HRS', value: timeLeft.hours },
          { label: 'MIN', value: timeLeft.minutes },
          { label: 'SEG', value: timeLeft.seconds }
        ].map((item, i) => (
          <div key={i} className="flex flex-col items-center bg-white/5 rounded-xl p-2 border border-white/5 backdrop-blur-sm">
            <span className="text-xl md:text-2xl font-black text-white leading-none font-mono tabular-nums">
              {String(item.value).padStart(2, '0')}
            </span>
            <span className="text-[8px] font-bold text-white/40 mt-1 tracking-wider">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
