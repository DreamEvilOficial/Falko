'use client'

import { useState, useEffect } from 'react'
import { Lock, Unlock, ArrowRight, X, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface MaintenanceScreenProps {
  onUnlock: () => void
}

export default function MaintenanceScreen({ onUnlock }: MaintenanceScreenProps) {
  const [showLogin, setShowLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 1. Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) throw authError

      // 2. Check if user is an operator
      if (authData.user) {
         // Using the new operators check could be safer, but if they have a valid login 
         // and we are just bypassing maintenance, standard auth might be enough.
         // However, let's strictly check against the operators table if needed.
         // For now, valid login -> unlock.
         
         const { data: operator } = await supabase
           .from('operators')
           .select('id, role')
           .eq('email', email)
           .single()
           
         if (!operator) {
            throw new Error('No tienes permisos de operador.')
         }
         
         toast.success('Acceso desbloqueado')
         onUnlock()
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Credenciales inválidas')
      toast.error('Acceso denegado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999999] bg-black text-white flex flex-col items-center justify-center p-6">
      
      {/* Background Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-lg w-full text-center space-y-8 animate-in fade-in zoom-in duration-700">
        
        <div className="flex justify-center mb-4">
           <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">
             <AlertTriangle className="w-10 h-10 text-yellow-500" />
           </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic">
            En Mantenimiento
          </h1>
          <p className="text-white/40 font-bold text-sm md:text-base max-w-md mx-auto leading-relaxed">
            Estamos realizando mejoras en nuestra plataforma para brindarte una experiencia superior. Volveremos pronto.
          </p>
        </div>

        {!showLogin ? (
          <button
            onClick={() => setShowLogin(true)}
            className="group relative inline-flex items-center gap-2 px-6 py-3 bg-white/[0.05] hover:bg-white/[0.1] rounded-2xl border border-white/10 transition-all text-xs font-black uppercase tracking-[0.2em] text-white/60 hover:text-white"
          >
            <Lock className="w-3 h-3 group-hover:scale-110 transition-transform" />
            Acceso Administrativo
          </button>
        ) : (
          <form onSubmit={handleLogin} className="bg-[#0A0A0A] border border-white/10 p-6 rounded-[24px] shadow-2xl max-w-sm mx-auto space-y-4 animate-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-2">
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Desbloquear Sitio</span>
               <button type="button" onClick={() => setShowLogin(false)} className="text-white/20 hover:text-white transition"><X className="w-4 h-4" /></button>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold">
                {error}
              </div>
            )}

            <div className="space-y-3">
               <input 
                 type="email" 
                 placeholder="Email de Operador"
                 value={email}
                 onChange={e => setEmail(e.target.value)}
                 className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold placeholder:text-white/20 outline-none focus:border-white/30 transition"
                 required
               />
               <input 
                 type="password" 
                 placeholder="Contraseña"
                 value={password}
                 onChange={e => setPassword(e.target.value)}
                 className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold placeholder:text-white/20 outline-none focus:border-white/30 transition"
                 required
               />
            </div>
            
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-gray-200 transition disabled:opacity-50"
            >
              {loading ? 'Verificando...' : 'Desbloquear'}
            </button>
          </form>
        )}

      </div>
      
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
          Urban Indumentaria
        </p>
      </div>
    </div>
  )
}
