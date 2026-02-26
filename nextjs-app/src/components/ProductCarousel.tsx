'use client'

import React, { useRef, useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ProductCard from './ProductCard'
import { Producto } from '@/lib/supabase'

interface ProductCarouselProps {
  products: Producto[]
}

export default function ProductCarousel({ products }: ProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showLeft, setShowLeft] = useState(false)
  const [showRight, setShowRight] = useState(true)

  const checkScroll = () => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setShowLeft(scrollLeft > 0)
    setShowRight(scrollLeft < scrollWidth - clientWidth - 10) // tolerance
  }

  useEffect(() => {
    checkScroll()
    window.addEventListener('resize', checkScroll)
    return () => window.removeEventListener('resize', checkScroll)
  }, [products])

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const container = scrollRef.current
    const scrollAmount = container.clientWidth * 0.8
    const targetScroll = container.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount)
    
    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    })
  }

  return (
    <div className="relative group/carousel">
      {/* Left Arrow */}
      {showLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 bg-black/80 text-white border border-white/10 rounded-full flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 hover:bg-black hover:scale-110 -ml-5 hidden md:flex"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Right Arrow */}
      {showRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 bg-black/80 text-white border border-white/10 rounded-full flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 hover:bg-black hover:scale-110 -mr-5 hidden md:flex"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Scroll Container */}
      <div 
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex overflow-x-auto gap-3 md:gap-6 pb-4 pt-2 px-1 scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product) => (
          <div 
            key={product.id} 
            className="min-w-[160px] md:min-w-[280px] w-[45%] md:w-[280px] snap-start flex-shrink-0"
          >
            <ProductCard producto={product} />
          </div>
        ))}
      </div>
    </div>
  )
}
