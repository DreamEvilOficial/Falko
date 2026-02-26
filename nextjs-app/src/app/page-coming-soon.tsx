import Link from 'next/link'

export default function ComingSoon() {
  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-6 relative z-10">
      <div className="max-w-3xl mx-auto w-full">
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[48px] p-10 md:p-14 shadow-2xl overflow-hidden relative">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-accent2/10 rounded-full blur-[120px]" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-accent/10 rounded-full blur-[120px]" />

          <div className="text-center space-y-6 relative">
            <p className="text-[10px] font-black uppercase tracking-[0.45em] text-white/55">Modo Drop</p>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic text-white leading-none">
              Próximamente
            </h1>
            <p className="text-white/65 text-sm md:text-base uppercase tracking-[0.25em] font-medium">
              Estamos armando la experiencia. Volvé pronto.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/55">Colección</p>
              <p className="mt-3 text-white font-black uppercase tracking-tight">Streetwear</p>
              <p className="mt-2 text-white/55 text-[11px] uppercase tracking-widest">Prendas y accesorios</p>
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/55">Logística</p>
              <p className="mt-3 text-white font-black uppercase tracking-tight">Envíos</p>
              <p className="mt-2 text-white/55 text-[11px] uppercase tracking-widest">A todo el país</p>
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/55">Pagos</p>
              <p className="mt-3 text-white font-black uppercase tracking-tight">MercadoPago</p>
              <p className="mt-2 text-white/55 text-[11px] uppercase tracking-widest">Rápido y seguro</p>
            </div>
          </div>

          <div className="mt-10 bg-black/30 border border-white/10 rounded-3xl p-6">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-accent rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Servidor activo</span>
              </span>
              <span className="hidden md:block w-px h-4 bg-white/10" />
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-accent2 rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/60">MercadoPago listo</span>
              </span>
            </div>
          </div>

          <div className="pt-8 text-center">
            <p className="text-white/45 text-[11px] font-bold uppercase tracking-widest">
              Admin
              <Link href="/admin" className="text-accent hover:text-white font-black ml-2">
                Entrar al panel
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
