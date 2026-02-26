'use client'

import { useEffect, useRef, useState } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize2, Minimize2, X, Music2, ChevronDown, Shuffle } from 'lucide-react'

type Track = { url: string; title?: string }

function getYouTubeId(url: string) {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1)
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v')
      if (v) return v
      const parts = u.pathname.split('/')
      const idx = parts.findIndex((p) => p === 'embed')
      if (idx >= 0 && parts[idx + 1]) return parts[idx + 1]
    }
  } catch {}
  const m = url.match(/(?:v=|\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{6,})/)
  return m ? m[1] : ''
}

export default function MusicPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tracks, setTracks] = useState<Track[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [volume, setVolume] = useState(30)
  const [muted, setMuted] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false) // Default false: no autoplay
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const [isHovered, setIsHovered] = useState(false)

  const [isDarkMode, setIsDarkMode] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [shouldLoad, setShouldLoad] = useState(false)
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message} (${err.name})`);
      });
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Optimize: Only load iframe when user interacts (expands panel)
  useEffect(() => {
    if (isExpanded && !shouldLoad) {
      setShouldLoad(true)
    }
  }, [isExpanded, shouldLoad])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/config')
        const data = await res.json()
        let parsed: Track[] = []
        if (Array.isArray(data.music_tracks)) parsed = data.music_tracks
        else if (typeof data.music_tracks === 'string') {
          try {
            const tmp = JSON.parse(data.music_tracks)
            if (Array.isArray(tmp)) parsed = tmp
          } catch {}
        }
        setTracks(parsed.filter((t) => t && typeof t.url === 'string' && t.url.trim().length > 0))
      } catch {}
    }
    load()
    window.addEventListener('config-updated', load)
    return () => window.removeEventListener('config-updated', load)
  }, [])

  useEffect(() => {
    const id = getYouTubeId(tracks[currentIndex]?.url || '')
    if (!id || !iframeRef.current) return
    if (!initialized) setInitialized(true)
  }, [tracks, currentIndex, initialized])

  useEffect(() => {
    if (!initialized) return
    // Removed auto-play on init
  }, [initialized])

  useEffect(() => {
    if (!iframeRef.current) return
    const v = muted ? 0 : volume
    iframeRef.current.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func: 'setVolume', args: [v] }),
      '*',
    )
  }, [volume, muted])

  // Initialize with audio enabled after interaction
  useEffect(() => {
    const handler = () => {
      setMuted(false)
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: 'unMute', args: [] }),
        '*',
      )
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: 'setVolume', args: [30] }),
        '*',
      )
      setVolume(30)
      document.removeEventListener('pointerdown', handler)
    }
    document.addEventListener('pointerdown', handler, { once: true })
    return () => document.removeEventListener('pointerdown', handler)
  }, [initialized])

  function play() {
    setIsPlaying(true)
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
      '*',
    )
  }
  function pause() {
    setIsPlaying(false)
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }),
      '*',
    )
  }
  function togglePlay() {
    if (isPlaying) pause()
    else play()
  }
  function next() {
    if (tracks.length === 0) return
    setCurrentIndex((p) => (p + 1) % tracks.length)
  }
  function prev() {
    if (tracks.length === 0) return
    setCurrentIndex((p) => (p - 1 + tracks.length) % tracks.length)
  }

  function playRandomTrack() {
    if (tracks.length === 0) return
    const randomIndex = Math.floor(Math.random() * tracks.length)
    setCurrentIndex(randomIndex)
    setTimeout(() => play(), 100)
  }

  function toggleMute() {
    setMuted((m) => !m)
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func: muted ? 'unMute' : 'mute', args: [] }),
      '*',
    )
  }

  const currentId = getYouTubeId(tracks[currentIndex]?.url || '')
  const src = shouldLoad && currentId
    ? `https://www.youtube.com/embed/${currentId}?autoplay=${isPlaying ? 1 : 0}&enablejsapi=1&playsinline=1&origin=${encodeURIComponent(
        typeof window !== 'undefined' ? window.location.origin : '',
      )}`
    : ''

  return (
    <div
      ref={containerRef}
      className={`fixed bottom-6 right-6 z-[9999] transition-all duration-500 ease-spring ${
        !open ? 'opacity-0 pointer-events-none translate-y-10 scale-95' : 'opacity-100 scale-100'
      } ${
        isFullscreen ? 'inset-0 w-full h-full rounded-none bottom-0 right-0' : (isExpanded ? 'w-[320px]' : 'w-[60px] h-[60px] hover:w-[320px]')
      }`}
      onClick={() => { if (!isExpanded && !isFullscreen) setIsExpanded(true) }}
      role="region"
      aria-label="Reproductor de música"
    >
      <div className={`relative ${isDarkMode ? 'bg-black/80 border-white/10' : 'bg-white/90 border-black/10'} backdrop-blur-xl border rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 ${
        isFullscreen ? 'w-full h-full rounded-none border-0' : (isExpanded ? 'h-auto p-4' : 'h-[60px] flex items-center justify-center cursor-pointer')
      }`}>
        
        {/* Minimized State Icon */}
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
           <Music2 className={`w-6 h-6 ${isDarkMode ? 'text-white' : 'text-black'} animate-pulse`} aria-hidden="true" />
           <span className="sr-only">Expandir reproductor de música</span>
        </div>

        {/* Expanded Content */}
        <div className={`transition-opacity duration-300 ${isExpanded ? 'opacity-100 delay-100' : 'opacity-0 pointer-events-none absolute inset-0'}`}>
            
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/60' : 'text-black/60'} truncate`}>
                  {tracks[currentIndex]?.title || 'Reproductor'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                 <button onClick={toggleFullscreen} className={`${isDarkMode ? 'text-white/40 hover:text-white' : 'text-black/40 hover:text-black'} transition-colors`} title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"} aria-label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}>
                   {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                 </button>
                 <button onClick={() => setIsExpanded(false)} className={`${isDarkMode ? 'text-white/40 hover:text-white' : 'text-black/40 hover:text-black'} transition-colors md:hidden`} title="Minimizar" aria-label="Minimizar reproductor">
                   <ChevronDown className="w-4 h-4" />
                 </button>
                 <button onClick={() => setIsDarkMode(!isDarkMode)} className={`${isDarkMode ? 'text-white/40 hover:text-white' : 'text-black/40 hover:text-black'} transition-colors`} title="Cambiar Tema" aria-label={`Cambiar a modo ${isDarkMode ? 'claro' : 'oscuro'}`}>
                   {isDarkMode ? <div className="w-3 h-3 rounded-full bg-white/20" /> : <div className="w-3 h-3 rounded-full bg-black/20" />}
                 </button>
                 <button onClick={onClose} className={`${isDarkMode ? 'text-white/40 hover:text-white' : 'text-black/40 hover:text-black'} transition-colors`} title="Cerrar" aria-label="Cerrar reproductor">
                   <X className="w-4 h-4" />
                 </button>
              </div>
            </div>

            {/* Video Area */}
            <div className={`relative w-full ${isFullscreen ? 'h-[calc(100vh-100px)]' : 'aspect-video'} ${isDarkMode ? 'bg-black' : 'bg-gray-100'} rounded-xl overflow-hidden border ${isDarkMode ? 'border-white/10' : 'border-black/10'} shadow-inner group transition-all duration-500`}>
              {!initialized && shouldLoad && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`w-8 h-8 border-2 border-t-transparent rounded-full animate-spin ${isDarkMode ? 'border-white' : 'border-black'}`} />
                </div>
              )}
              {src && <iframe ref={iframeRef} src={src} allow="autoplay" loading="lazy" className="w-full h-full pointer-events-none" title="Reproductor de video" />}
              
              {/* Overlay Controls (Hover or Fullscreen) */}
              <div className={`absolute inset-0 bg-black/40 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm ${
                isFullscreen ? 'opacity-0 hover:opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}>
                 <button onClick={prev} className="p-2 text-white hover:scale-110 transition" aria-label="Anterior canción"><SkipBack className="w-5 h-5" /></button>
                 <button onClick={isPlaying ? pause : play} className={`p-3 rounded-full hover:scale-110 transition backdrop-blur-md ${isPlaying ? 'bg-white text-black' : 'bg-white/20 text-white'}`} aria-label={isPlaying ? "Pausar" : "Reproducir"}>
                   {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                 </button>
                 <button onClick={next} className="p-2 text-white hover:scale-110 transition" aria-label="Siguiente canción"><SkipForward className="w-5 h-5" /></button>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="mt-4 flex flex-col gap-3">
              {/* Playback Controls - Always Visible */}
              <div className="flex items-center justify-center gap-4">
                 <button 
                   onClick={playRandomTrack} 
                   className={`p-2 rounded-full hover:bg-white/10 transition ${isDarkMode ? 'text-white/40 hover:text-white' : 'text-black/40 hover:text-black'}`} 
                   title="Aleatorio" 
                   aria-label="Reproducir aleatorio"
                 >
                   <Shuffle className="w-4 h-4" />
                 </button>

                 <button onClick={prev} className={`p-2 rounded-full hover:bg-white/10 transition ${isDarkMode ? 'text-white' : 'text-black'}`} title="Anterior" aria-label="Anterior canción">
                   <SkipBack className="w-5 h-5 fill-current" />
                 </button>
                 <button 
                   onClick={togglePlay} 
                   className={`p-3 rounded-full transition-all hover:scale-105 shadow-lg ${
                     isDarkMode ? 'bg-white text-black hover:bg-white/90' : 'bg-black text-white hover:bg-black/90'
                   }`} 
                   title={isPlaying ? "Pausar" : "Reproducir"}
                   aria-label={isPlaying ? "Pausar" : "Reproducir"}
                 >
                   {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                 </button>
                 <button onClick={next} className={`p-2 rounded-full hover:bg-white/10 transition ${isDarkMode ? 'text-white' : 'text-black'}`} title="Siguiente" aria-label="Siguiente canción">
                   <SkipForward className="w-5 h-5 fill-current" />
                 </button>
                 
                 <div className="w-8" /> {/* Spacer to balance layout if needed, or just leave it centered */}
              </div>

              {/* Volume & Additional */}
              <div className="flex items-center gap-3">
               <button onClick={toggleMute} className={`${isDarkMode ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black'} transition`} aria-label={muted ? "Activar sonido" : "Silenciar"}>
                 {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
               </button>
               
               <div className={`flex-1 h-6 flex items-center group/vol cursor-pointer relative`}>
                 <div className={`w-full h-1 ${isDarkMode ? 'bg-white/10' : 'bg-black/10'} rounded-full overflow-hidden relative`}>
                   <div 
                     className={`h-full ${isDarkMode ? 'bg-white' : 'bg-black'} group-hover/vol:bg-accent transition-all`}
                     style={{ width: `${volume}%` }}
                   />
                 </div>
                 <input
                    type="range"
                    min={0}
                    max={100}
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="absolute inset-0 opacity-0 cursor-pointer h-full z-10"
                    aria-label="Control de volumen"
                  />
               </div>
               
               <span className={`text-[9px] font-mono ${isDarkMode ? 'text-white/40' : 'text-black/40'}`} aria-hidden="true">{volume}%</span>
              </div>
            </div>

            {/* Track List (Optional/Collapsible) */}
            {tracks.length > 1 && (
              <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-white/5' : 'border-black/5'}`}>
                <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide" role="list" aria-label="Lista de canciones">
                  {tracks.map((t, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentIndex(i)}
                      className={`flex-shrink-0 w-2 h-2 rounded-full transition-all ${
                        i === currentIndex ? (isDarkMode ? 'bg-white scale-125' : 'bg-black scale-125') : (isDarkMode ? 'bg-white/20 hover:bg-white/40' : 'bg-black/20 hover:bg-black/40')
                      }`}
                      aria-label={`Reproducir canción ${i + 1}`}
                      aria-current={i === currentIndex ? 'true' : 'false'}
                    />
                  ))}
                </div>
              </div>
            )}
        </div>
      </div>

      <style jsx global>{`
        .ease-spring {
          transition-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
      `}</style>
    </div>
  )
}
