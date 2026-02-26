import { useState, useEffect } from 'react'
import NextImage from 'next/image'
import toast from 'react-hot-toast'
import { Save, Trash2, Plus, X } from 'lucide-react'

const DEFAULT_SHARE_DESCRIPTION =
  'Redefiniendo el Streetwear. Tu estilo, sin límites. Descubrí los últimos drops y armá tu fit.'

interface ConfigData {
  logo_url: string
  nombre_tienda: string
  lema_tienda: string
  brand_tagline?: string
  share_description?: string
  mercadopago_public_key: string
  mercadopago_access_token: string
  cvu: string
  alias: string
  titular_cuenta: string
  banco: string
  maintenance_mode: boolean
  banner_urls: Array<{ url: string; link: string }>
  envio_gratis_umbral?: number
  envio_gratis_forzado?: boolean
  autobackup_enabled?: boolean
  music_tracks?: Array<{ url: string; title?: string }>
}

export default function ConfigurationPanel() {
  const [loading, setLoading] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const [config, setConfig] = useState<ConfigData>({
    logo_url: '',
    nombre_tienda: 'Urban Indumentaria',
    lema_tienda: 'Streetwear — drops — fits',
    brand_tagline:
      'Streetwear sin filtro. Drops reales, fits pesados y calidad para bancarla en la calle. No rules, solo estilo.',
    share_description: DEFAULT_SHARE_DESCRIPTION,
    mercadopago_public_key: '',
    mercadopago_access_token: '',
    cvu: '',
    alias: '',
    titular_cuenta: '',
    banco: '',
    maintenance_mode: false,
    banner_urls: [],
    envio_gratis_umbral: 50000,
    envio_gratis_forzado: false,
    autobackup_enabled: false,
    music_tracks: []
  })

  const [mensajes, setMensajes] = useState({
    mensaje_bienvenida: 'Bienvenido a nuestra tienda',
    mensaje_envio_gratis: 'Envío gratis en compras superiores a $50.000',
    mensaje_cuotas: 'Hasta 6 cuotas sin interés',
    mensaje_transferencia: '10% de descuento en transferencias',
    mensaje_whatsapp: '¿Necesitas ayuda? Contáctanos por WhatsApp',
    mensaje_footer: 'Los precios están expresados en pesos argentinos e incluyen IVA',
    mensaje_sin_stock: 'Producto sin stock',
    mensaje_carrito_vacio: 'Tu carrito está vacío',
    mensaje_compra_exitosa: '¡Gracias por tu compra!',
    anuncio_1: '',
    anuncio_2: '',
    anuncio_3: '',
    slider_velocidad: '4000',
    slider_marquesina_velocidad: '30'
  })

  useEffect(() => {
    cargarConfiguracion()
  }, [])

  async function cargarConfiguracion() {
    try {
      const res = await fetch('/api/config')
      const data = await res.json()
      
      // Parseo robusto para valores potencialmente serializados
      let parsedBannerUrls: Array<{ url: string; link: string }> = []
      try {
        if (Array.isArray(data.banner_urls)) {
          parsedBannerUrls = data.banner_urls
        } else if (typeof data.banner_urls === 'string') {
          const tmp = JSON.parse(data.banner_urls)
          if (Array.isArray(tmp)) parsedBannerUrls = tmp
        }
      } catch {}

      setConfig({
        logo_url: data.logo_url || '',
        nombre_tienda: data.nombre_tienda || 'Urban Indumentaria',
        lema_tienda: data.lema_tienda || 'Streetwear — drops — fits',
        brand_tagline:
          data.brand_tagline ||
          'Streetwear sin filtro. Drops reales, fits pesados y calidad para bancarla en la calle. No rules, solo estilo.',
        share_description: data.share_description || DEFAULT_SHARE_DESCRIPTION,
        mercadopago_public_key: data.mercadopago_public_key || '',
        mercadopago_access_token: data.mercadopago_access_token || '',
        cvu: data.cvu || '',
        alias: data.alias || '',
        titular_cuenta: data.titular_cuenta || '',
        banco: data.banco || '',
        maintenance_mode: data.maintenance_mode === 'true' || data.maintenance_mode === true,
        banner_urls: parsedBannerUrls,
        envio_gratis_umbral: Number(data.envio_gratis_umbral ?? 50000),
        envio_gratis_forzado: data.envio_gratis_forzado === true || data.envio_gratis_forzado === 'true',
        autobackup_enabled: data.autobackup_enabled === true || data.autobackup_enabled === 'true',
        music_tracks: (() => {
          try {
            if (Array.isArray(data.music_tracks)) return data.music_tracks
            if (typeof data.music_tracks === 'string') {
              const tmp = JSON.parse(data.music_tracks)
              if (Array.isArray(tmp)) return tmp
            }
          } catch {}
          return []
        })()
      })

      setMensajes({
        mensaje_bienvenida: data.mensaje_bienvenida || 'Bienvenido a nuestra tienda',
        mensaje_envio_gratis: data.mensaje_envio_gratis || 'Envío gratis en compras superiores a $50.000',
        mensaje_cuotas: data.mensaje_cuotas || 'Hasta 6 cuotas sin interés',
        mensaje_transferencia: data.mensaje_transferencia || '10% de descuento en transferencias',
        mensaje_whatsapp: data.mensaje_whatsapp || '¿Necesitas ayuda? Contáctanos por WhatsApp',
        mensaje_footer: data.mensaje_footer || 'Los precios están expresados en pesos argentinos e incluyen IVA',
        mensaje_sin_stock: data.mensaje_sin_stock || 'Producto sin stock',
        mensaje_carrito_vacio: data.mensaje_carrito_vacio || 'Tu carrito está vacío',
        mensaje_compra_exitosa: data.mensaje_compra_exitosa || '¡Gracias por tu compra!',
        anuncio_1: data.anuncio_1 || '',
        anuncio_2: data.anuncio_2 || '',
        anuncio_3: data.anuncio_3 || '',
        slider_velocidad: data.slider_velocidad || '4000',
        slider_marquesina_velocidad: data.slider_marquesina_velocidad || '30'
      })
    } catch (error) {
      console.error('Error loading config:', error)
    }
  }

  const compressImage = (file: File, maxWidth = 1920, quality = 0.8): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          if (width > maxWidth) {
            height = (maxWidth / width) * height
            width = maxWidth
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)
          canvas.toBlob((blob) => resolve(blob || file), 'image/jpeg', quality)
        }
      }
    })
  }

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingBanner(true)
    try {
      const uploadedBanners: Array<{ url: string; link: string }> = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Comprimir si es banner (suelen ser grandes)
        const blob = await compressImage(file)
        const compressedFile = new File([blob], file.name, { type: 'image/jpeg' })

        const formData = new FormData()
        formData.append('file', compressedFile)
        formData.append('folder', 'banners')

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Error al subir imagen')
      }
      
      const { publicUrl } = await res.json()
      uploadedBanners.push({ url: publicUrl, link: '' })
      }

      setConfig(prev => ({ ...prev, banner_urls: [...prev.banner_urls, ...uploadedBanners] }))
      toast.success(`${uploadedBanners.length} banner(s) subido(s)`)
    } catch (error: any) {
      console.error('Banner upload error:', error)
      toast.error('Error al subir banners: ' + (error.message || 'Error desconocido'))
    } finally {
      setUploadingBanner(false)
    }
  }

  function updateBannerLink(index: number, link: string) {
    const newBanners = [...config.banner_urls]
    newBanners[index].link = link
    setConfig({ ...config, banner_urls: newBanners })
  }

  function removeBanner(index: number) {
    const newBanners = config.banner_urls.filter((_, i) => i !== index)
    setConfig({ ...config, banner_urls: newBanners })
    toast.success('Banner eliminado')
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    const maxSizeBytes = 2 * 1024 * 1024

    if (!allowedTypes.includes(file.type)) {
      toast.error('Formato de logo no permitido. Usa PNG, JPG o WEBP.')
      e.target.value = ''
      return
    }

    if (file.size > maxSizeBytes) {
      toast.error('El logo es demasiado pesado. Máximo 2MB.')
      e.target.value = ''
      return
    }

    setUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'logos')

      const res = await fetch('/api/upload', { method: 'POST', body: formData })

      if (!res.ok) {
        let message = 'Error al subir logo'
        try {
          const errorData = await res.json()
          if (errorData?.error) {
            message = errorData.error
          }
        } catch {}
        throw new Error(message)
      }
      
      const { publicUrl } = await res.json()
      
      setConfig(prev => ({ ...prev, logo_url: publicUrl }))
      toast.success('Logo subido exitosamente')
    } catch (error: any) {
      console.error('Logo upload error:', error)
      toast.error(error.message || 'Error al subir logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  function removeLogo() {
    setConfig({ ...config, logo_url: '' })
    toast.success('Logo eliminado')
  }

  async function guardarConfiguracion() {
    setLoading(true)
    const toastId = toast.loading('Guardando configuración...')
    
    try {
      // Preparar datos consolidados
      const configData = {
        ...config,
        ...mensajes
      }

      // Enviar todo en una sola petición
      const res = await fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates: configData })
      });

      if (!res.ok) throw new Error('Error en la respuesta del servidor');

      toast.success('Configuración guardada correctamente', { id: toastId })
      
      // Notificar cambios a la UI inmediatamente
      window.dispatchEvent(new Event('config-updated'))
      localStorage.setItem('config-updated', Date.now().toString())
      
      // Feedback visual adicional (opcional, por ejemplo scroll top o highlight)
      
    } catch (error: any) {
      console.error('Error al guardar:', error)
      toast.error('Error al guardar configuración: ' + (error.message || 'Desconocido'), { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-3xl tracking-[0.08em] uppercase text-white">Configuración</h1>
        <button
          onClick={guardarConfiguracion}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-3 bg-accent text-ink rounded-2xl transition shadow-[0_18px_50px_-30px_rgba(183,255,42,0.6)] hover:brightness-95 active:scale-[0.99] disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.28em]">{loading ? 'Guardando...' : 'Guardar Cambios'}</span>
        </button>
      </div>

      {/* Envíos */}
      <div className="bg-[#06070c]/70 backdrop-blur-2xl rounded-[28px] shadow-[0_30px_120px_-90px_rgba(0,0,0,0.9)] border border-white/10 p-6">
        <h2 className="font-display text-xl tracking-[0.08em] uppercase text-white mb-4">Envíos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3">
            <label className="text-[10px] font-black text-white/55 uppercase tracking-[0.28em]">Forzar Envío Gratis</label>
            <button 
              onClick={() => setConfig({ ...config, envio_gratis_forzado: !config.envio_gratis_forzado })}
              className={`w-12 h-6 rounded-full relative transition-colors ${config.envio_gratis_forzado ? 'bg-green-500' : 'bg-white/10'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${config.envio_gratis_forzado ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
          <div>
            <label className="block text-[10px] font-black mb-2 text-white/45 uppercase tracking-[0.28em] px-1">Umbral Envío Gratis (ARS)</label>
            <input
              type="number"
              value={Number(config.envio_gratis_umbral ?? 0)}
              onChange={e => setConfig({ ...config, envio_gratis_umbral: Number(e.target.value || 0) })}
              placeholder="50000"
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-sm font-bold focus:border-accent/40 transition outline-none"
            />
            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-2">Compras iguales o superiores obtienen envío sin costo</p>
          </div>
        </div>
      </div>

      {/* Logo y Nombre de Tienda */}
      <div className="bg-[#06070c]/70 backdrop-blur-2xl rounded-[28px] shadow-[0_30px_120px_-90px_rgba(0,0,0,0.9)] border border-white/10 p-6">
        <div className="flex justify-between items-start mb-6">
           <h2 className="font-display text-xl tracking-[0.08em] uppercase text-white">Identidad</h2>
           
           <div className="flex items-center gap-3 bg-white/[0.03] px-4 py-2 rounded-xl border border-white/5">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Modo Mantenimiento</span>
              <button 
                onClick={() => setConfig({...config, maintenance_mode: !config.maintenance_mode})}
                className={`w-10 h-5 rounded-full relative transition-colors ${config.maintenance_mode ? 'bg-red-500' : 'bg-white/10'}`}
              >
                <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${config.maintenance_mode ? 'left-6' : 'left-1'}`} />
              </button>
           </div>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-black mb-2 text-white/45 uppercase tracking-[0.28em] px-1">Nombre de la Tienda</label>
            <input
              type="text"
              value={config.nombre_tienda}
              onChange={e => setConfig({ ...config, nombre_tienda: e.target.value })}
              placeholder="Urban Indumentaria"
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-sm font-bold focus:border-accent/40 transition outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black mb-2 text-white/45 uppercase tracking-[0.28em] px-1">Subtítulo / Lema</label>
            <input
              type="text"
              value={config.lema_tienda}
              onChange={e => setConfig({ ...config, lema_tienda: e.target.value })}
              placeholder="Streetwear — drops — fits"
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-sm font-bold focus:border-accent/40 transition outline-none"
            />
          </div>
          
          <div>
            <label className="block text-[10px] font-black mb-2 text-white/45 uppercase tracking-[0.28em] px-1">Tagline del Footer</label>
            <input
              type="text"
              value={config.brand_tagline || ''}
              onChange={e => setConfig({ ...config, brand_tagline: e.target.value })}
              placeholder="Streetwear sin filtro..."
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-sm font-bold focus:border-accent/40 transition outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black mb-2 text-white/45 uppercase tracking-[0.28em] px-1">Slogan para compartir (Redes Sociales)</label>
            <input
              type="text"
              value={config.share_description || ''}
              onChange={e => setConfig({ ...config, share_description: e.target.value })}
              placeholder="Descripción que aparece al compartir el link..."
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-sm font-bold focus:border-accent/40 transition outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black mb-2 text-white/45 uppercase tracking-[0.28em] px-1">Logo de la Tienda</label>
            <p className="text-xs text-white/40 mb-3 font-bold">Sube tu logo para reemplazar el nombre de texto. Recomendado: 300x80px, formato PNG con fondo transparente.</p>
            
            {config.logo_url ? (
              <div className="flex items-center gap-4 p-4 border border-white/10 rounded-2xl bg-white/[0.03]">
                <NextImage 
                  src={config.logo_url} 
                  alt="Logo" 
                  width={0} 
                  height={0} 
                  sizes="100vw"
                  style={{ width: 'auto', height: '64px' }}
                  className="h-16 w-auto object-contain bg-white/5 border border-white/10 p-2 rounded-xl" 
                />
                <div className="flex-1">
                  <p className="text-sm text-white/55 font-bold">Logo actual</p>
                </div>
                <button
                  onClick={removeLogo}
                  className="p-2 text-red-300 hover:bg-red-500/10 rounded-2xl transition border border-transparent hover:border-red-500/15"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-3 bg-accent text-ink rounded-2xl transition shadow-[0_18px_50px_-30px_rgba(183,255,42,0.6)] hover:brightness-95 active:scale-[0.99]">
                <Plus className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.28em]">{uploadingLogo ? 'Subiendo...' : 'Subir Logo'}</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo} />
              </label>
            )}
          </div>

          <div className="mt-4 border border-white/10 rounded-2xl bg-white/[0.02] p-4">
            <p className="text-[10px] font-black text-white/45 uppercase tracking-[0.28em] mb-3 px-1">Preview al compartir</p>
            <div className="flex gap-3">
              <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src="/publicsite.png"
                  alt="Preview compartir"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white/60 mb-1 truncate">
                  {config.nombre_tienda || 'URBAN'}
                </p>
                <p className="text-[11px] text-white/80 font-semibold leading-snug line-clamp-2">
                  {config.share_description || DEFAULT_SHARE_DESCRIPTION}
                </p>
                <p className="mt-2 text-[10px] text-white/35 font-bold uppercase tracking-[0.22em]">
                  {process.env.NEXT_PUBLIC_SITE_URL || 'urbancdg.vercel.app'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mercado Pago */}
      <div className="bg-[#06070c]/70 backdrop-blur-2xl rounded-[28px] shadow-[0_30px_120px_-90px_rgba(0,0,0,0.9)] border border-white/10 p-6">
        <div className="flex items-center gap-3 mb-4">
           <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
              <img src="https://http2.mlstatic.com/frontend-assets/ui-navigation/5.18.9/mercadopago/favicon.81d6c05d.ico" className="w-5 h-5" alt="MP" />
           </div>
           <h2 className="font-display text-xl tracking-[0.08em] uppercase text-white">Mercado Pago</h2>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-[10px] font-black mb-2 text-white/45 uppercase tracking-[0.28em] px-1">Public Key</label>
            <input
              type="text"
              value={config.mercadopago_public_key}
              onChange={e => setConfig({ ...config, mercadopago_public_key: e.target.value })}
              placeholder="APP_USR-..."
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl font-mono text-sm font-bold focus:border-accent/40 transition outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black mb-2 text-white/45 uppercase tracking-[0.28em] px-1">Access Token (Para detección de transferencias)</label>
            <input
              type="password"
              value={config.mercadopago_access_token}
              onChange={e => setConfig({ ...config, mercadopago_access_token: e.target.value })}
              placeholder="APP_USR-..."
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl font-mono text-sm font-bold focus:border-accent/40 transition outline-none"
            />
            <p className="text-[9px] font-bold text-white/30 mt-2 uppercase tracking-wider px-1">
              Este token es necesario para que el sistema pueda verificar automáticamente los ingresos de dinero por transferencia.
            </p>
          </div>
        </div>
      </div>

      {/* Transferencia Bancaria / CVU */}
      <div className="bg-[#06070c]/70 backdrop-blur-2xl rounded-[28px] shadow-[0_30px_120px_-90px_rgba(0,0,0,0.9)] border border-white/10 p-6 mt-6">
        <h2 className="font-display text-xl tracking-[0.08em] uppercase text-white mb-4">Datos de Transferencia</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black mb-2 text-white/45 uppercase tracking-[0.28em] px-1">CVU / CBU</label>
            <input
              type="text"
              value={config.cvu}
              onChange={e => setConfig({ ...config, cvu: e.target.value })}
              placeholder="00000031..."
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl font-mono text-sm font-bold focus:border-accent/40 transition outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black mb-2 text-white/45 uppercase tracking-[0.28em] px-1">Alias</label>
            <input
              type="text"
              value={config.alias}
              onChange={e => setConfig({ ...config, alias: e.target.value })}
              placeholder="Tu alias de MP"
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-sm font-bold focus:border-accent/40 transition outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black mb-2 text-white/45 uppercase tracking-[0.28em] px-1">Titular de la Cuenta</label>
            <input
              type="text"
              value={config.titular_cuenta}
              onChange={e => setConfig({ ...config, titular_cuenta: e.target.value })}
              placeholder="Nombre Completo"
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-sm font-bold focus:border-accent/40 transition outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black mb-2 text-white/45 uppercase tracking-[0.28em] px-1">Banco / Entidad</label>
            <input
              type="text"
              value={config.banco}
              onChange={e => setConfig({ ...config, banco: e.target.value })}
              placeholder="Mercado Pago"
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-sm font-bold focus:border-accent/40 transition outline-none"
            />
          </div>
        </div>
      </div>

      {/* Banners */}
      <div className="bg-[#06070c]/70 backdrop-blur-2xl rounded-[28px] shadow-[0_30px_120px_-90px_rgba(0,0,0,0.9)] border border-white/10 p-6">
        <h2 className="font-display text-xl tracking-[0.08em] uppercase text-white mb-4">Banners</h2>
        
        <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-3 bg-accent text-ink rounded-2xl transition shadow-[0_18px_50px_-30px_rgba(183,255,42,0.6)] hover:brightness-95 active:scale-[0.99] mb-4">
          <Plus className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.28em]">{uploadingBanner ? 'Subiendo...' : 'Agregar Banners'}</span>
          <input type="file" className="hidden" accept="image/*" multiple onChange={handleBannerUpload} disabled={uploadingBanner} />
        </label>

        <div className="space-y-4">
          {config.banner_urls.map((banner, index) => (
            <div key={index} className="flex items-center gap-4 p-4 border border-white/10 rounded-2xl bg-white/[0.02]">
              <img src={banner.url} alt={`Banner ${index + 1}`} className="w-32 h-20 object-cover rounded-xl border border-white/10" />
              <div className="flex-1">
                <label className="block text-[10px] font-black mb-2 text-white/45 uppercase tracking-[0.28em] px-1">URL de Redirección (opcional)</label>
                <input
                  type="text"
                  value={banner.link}
                  onChange={e => updateBannerLink(index, e.target.value)}
                  placeholder="https://ejemplo.com/producto"
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-sm font-bold focus:border-accent/40 transition outline-none"
                />
              </div>
              <button
                onClick={() => removeBanner(index)}
                className="p-2 text-red-300 hover:bg-red-500/10 rounded-2xl transition border border-transparent hover:border-red-500/15"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
          {config.banner_urls.length === 0 && (
            <p className="text-white/45 text-center py-8 font-black">No hay banners agregados</p>
          )}
        </div>
      </div>

      {/* Música */}
      <div className="bg-[#06070c]/70 backdrop-blur-2xl rounded-[28px] shadow-[0_30px_120px_-90px_rgba(0,0,0,0.9)] border border-white/10 p-6">
        <h2 className="font-display text-xl tracking-[0.08em] uppercase text-white mb-4">Música</h2>
        <p className="text-white/50 text-xs mb-4 font-bold">Pega links de YouTube. Se reproducen al entrar.</p>
        <div className="space-y-4">
          {config.music_tracks?.map((track, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
              <input
                type="text"
                value={track.title || ''}
                onChange={e => {
                  const arr = [...(config.music_tracks || [])]
                  arr[index] = { ...arr[index], title: e.target.value }
                  setConfig({ ...config, music_tracks: arr })
                }}
                placeholder="Título (opcional)"
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-sm font-bold focus:border-accent/40 transition outline-none"
              />
              <div className="flex gap-3">
                <input
                  type="text"
                  value={track.url}
                  onChange={e => {
                    const arr = [...(config.music_tracks || [])]
                    arr[index] = { ...arr[index], url: e.target.value }
                    setConfig({ ...config, music_tracks: arr })
                  }}
                  placeholder="https://youtube.com/watch?v=..."
                  className="flex-1 px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-sm font-bold focus:border-accent/40 transition outline-none"
                />
                <button
                  onClick={() => {
                    const arr = (config.music_tracks || []).filter((_, i) => i !== index)
                    setConfig({ ...config, music_tracks: arr })
                    toast.success('Canción eliminada')
                  }}
                  className="px-4 py-3 rounded-2xl bg-red-500/20 text-red-300 border border-red-500/30 text-sm font-bold"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setConfig({ ...config, music_tracks: [ ...(config.music_tracks || []), { url: '', title: '' } ] })}
              className="inline-flex items-center gap-2 px-5 py-3 bg-accent text-ink rounded-2xl transition shadow-[0_18px_50px_-30px_rgba(183,255,42,0.6)] hover:brightness-95 active:scale-[0.99]"
            >
              Agregar canción
            </button>
          </div>
        </div>
      </div>

      {/* Mensajes Editables */}
      <div className="bg-[#06070c]/70 backdrop-blur-2xl rounded-[28px] shadow-[0_30px_120px_-90px_rgba(0,0,0,0.9)] border border-white/10 p-6">
        <h2 className="font-display text-xl tracking-[0.08em] uppercase text-white mb-4">Mensajes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black mb-2 text-white/45 uppercase tracking-[0.28em] px-1">Mensaje de Bienvenida</label>
            <input
              type="text"
              value={mensajes.mensaje_bienvenida}
              onChange={e => setMensajes({ ...mensajes, mensaje_bienvenida: e.target.value })}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-sm font-bold focus:border-accent/40 transition outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black mb-2 text-white/45 uppercase tracking-[0.28em] px-1">Mensaje Envío Gratis</label>
            <input
              type="text"
              value={mensajes.mensaje_envio_gratis}
              onChange={e => setMensajes({ ...mensajes, mensaje_envio_gratis: e.target.value })}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-sm font-bold focus:border-accent/40 transition outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black mb-2 text-white/45 uppercase tracking-[0.28em] px-1">Mensaje Cuotas</label>
            <input
              type="text"
              value={mensajes.mensaje_cuotas}
              onChange={e => setMensajes({ ...mensajes, mensaje_cuotas: e.target.value })}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-sm font-bold focus:border-accent/40 transition outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black mb-2 text-white/45 uppercase tracking-[0.28em] px-1">Mensaje Transferencia</label>
            <input
              type="text"
              value={mensajes.mensaje_transferencia}
              onChange={e => setMensajes({ ...mensajes, mensaje_transferencia: e.target.value })}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-sm font-bold focus:border-accent/40 transition outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black mb-2 text-white/45 uppercase tracking-[0.28em] px-1">Mensaje WhatsApp</label>
            <input
              type="text"
              value={mensajes.mensaje_whatsapp}
              onChange={e => setMensajes({ ...mensajes, mensaje_whatsapp: e.target.value })}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-sm font-bold focus:border-accent/40 transition outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black mb-2 text-white/45 uppercase tracking-[0.28em] px-1">Mensaje Footer</label>
            <input
              type="text"
              value={mensajes.mensaje_footer}
              onChange={e => setMensajes({ ...mensajes, mensaje_footer: e.target.value })}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-sm font-bold focus:border-accent/40 transition outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black mb-2 text-white/45 uppercase tracking-[0.28em] px-1">Mensaje Sin Stock</label>
            <input
              type="text"
              value={mensajes.mensaje_sin_stock}
              onChange={e => setMensajes({ ...mensajes, mensaje_sin_stock: e.target.value })}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-sm font-bold focus:border-accent/40 transition outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black mb-2 text-white/45 uppercase tracking-[0.28em] px-1">Mensaje Carrito Vacío</label>
            <input
              type="text"
              value={mensajes.mensaje_carrito_vacio}
              onChange={e => setMensajes({ ...mensajes, mensaje_carrito_vacio: e.target.value })}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-sm font-bold focus:border-accent/40 transition outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black mb-2 text-white/45 uppercase tracking-[0.28em] px-1">Mensaje Compra Exitosa</label>
            <input
              type="text"
              value={mensajes.mensaje_compra_exitosa}
              onChange={e => setMensajes({ ...mensajes, mensaje_compra_exitosa: e.target.value })}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-sm font-bold focus:border-accent/40 transition outline-none"
            />
          </div>
        </div>

        <h3 className="font-display text-lg tracking-[0.08em] uppercase text-white mt-10 mb-4">Banner Superior</h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-[10px] font-black mb-2 text-white/45 uppercase tracking-[0.28em] px-1">Anuncio 1</label>
            <input
              type="text"
              value={mensajes.anuncio_1}
              onChange={e => setMensajes({ ...mensajes, anuncio_1: e.target.value })}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-sm font-bold focus:border-accent/40 transition outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black mb-2 text-white/45 uppercase tracking-[0.28em] px-1">Anuncio 2</label>
            <input
              type="text"
              value={mensajes.anuncio_2}
              onChange={e => setMensajes({ ...mensajes, anuncio_2: e.target.value })}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-sm font-bold focus:border-accent/40 transition outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black mb-2 text-white/45 uppercase tracking-[0.28em] px-1">Anuncio 3</label>
            <input
              type="text"
              value={mensajes.anuncio_3}
              onChange={e => setMensajes({ ...mensajes, anuncio_3: e.target.value })}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-sm font-bold focus:border-accent/40 transition outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black mb-2 text-white/45 uppercase tracking-[0.28em] px-1">Velocidad del Banner Principal (Home Slider)</label>
            <select
              value={mensajes.slider_velocidad}
              onChange={e => setMensajes({ ...mensajes, slider_velocidad: e.target.value })}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl outline-none appearance-none cursor-pointer font-bold text-sm transition hover:border-white/20 focus:border-accent/40"
            >
              <option value="2000">Muy Rápido (2 segundos)</option>
              <option value="3000">Rápido (3 segundos)</option>
              <option value="4000">Normal (4 segundos)</option>
              <option value="5000">Lento (5 segundos)</option>
              <option value="6000">Muy Lento (6 segundos)</option>
            </select>
            <p className="text-xs text-white/40 mt-2 font-bold">Controla qué tan rápido cambian las imágenes del slider de la página de inicio</p>
          </div>

          <div>
            <label className="block text-[10px] font-black mb-2 text-white/45 uppercase tracking-[0.28em] px-1">Velocidad de la Marquesina (segundos por vuelta)</label>
            <input
              type="number"
              value={mensajes.slider_marquesina_velocidad}
              onChange={e => setMensajes({ ...mensajes, slider_marquesina_velocidad: e.target.value })}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-sm font-bold focus:border-accent/40 transition outline-none"
              min="10"
              max="200"
            />
            <p className="text-xs text-white/40 mt-2 font-bold">Tiempo que tarda una vuelta completa. Menores segundos = más rápido. Recomendado: 30.</p>
          </div>
        </div>
      </div>
      {/* Sistema */}
      <div className="bg-[#06070c]/70 backdrop-blur-2xl rounded-[28px] shadow-[0_30px_120px_-90px_rgba(0,0,0,0.9)] border border-white/10 p-6">
        <h2 className="font-display text-xl tracking-[0.08em] uppercase text-white mb-4">Sistema</h2>
        <div className="flex items-center justify-between bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3">
          <div>
            <label className="text-[10px] font-black text-white/55 uppercase tracking-[0.28em]">Auto Backup 24hs</label>
            <p className="text-[10px] text-white/30 font-bold mt-1">Realiza un backup diario a las 00:00hs y lo sube a GitHub</p>
          </div>
          <button 
            onClick={() => setConfig({ ...config, autobackup_enabled: !config.autobackup_enabled })}
            className={`w-12 h-6 rounded-full relative transition-colors ${config.autobackup_enabled ? 'bg-green-500' : 'bg-white/10'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${config.autobackup_enabled ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
      </div>
    </div>
  )
}
