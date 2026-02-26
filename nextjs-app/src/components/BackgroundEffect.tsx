'use client'

export default function BackgroundEffect() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#020202]">
      {/* Gradiente Superior Izquierdo - Azul Profundo */}
      <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] bg-blue-900/10 rounded-full blur-[120px] mix-blend-screen opacity-40 animate-pulse-slow" />
      
      {/* Gradiente Inferior Derecho - Violeta/Púrpura */}
      <div className="absolute -bottom-[20%] -right-[10%] w-[70vw] h-[70vw] bg-purple-900/10 rounded-full blur-[120px] mix-blend-screen opacity-40 animate-pulse-slow delay-1000" />
      
      {/* Luz Cenital Sutil */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100vw] h-[50vh] bg-gradient-to-b from-white/[0.02] to-transparent blur-3xl" />
      
      {/* Textura de Ruido Sutil */}
      <div className="absolute inset-0 bg-[radial-gradient(transparent_0%,#000_100%)] opacity-80" />
    </div>
  )
}
