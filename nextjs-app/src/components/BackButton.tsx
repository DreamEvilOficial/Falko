'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function BackButton() {
  const router = useRouter()

  return (
    <button
      onClick={() => router.back()}
      className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 group"
    >
      <div className="p-2 rounded-full border border-gray-800 group-hover:border-gray-600">
        <ArrowLeft className="w-5 h-5" />
      </div>
      <span className="text-sm font-medium">Volver</span>
    </button>
  )
}
