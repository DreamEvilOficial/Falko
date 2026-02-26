'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User, Eye, EyeOff, Save, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

interface UserProfileProps {
  user: any
}

export default function UserProfile({ user }: UserProfileProps) {
  const [loading, setLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [profileData, setProfileData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    usuario: ''
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    try {
      // Cargar datos desde nuestra sesión de admin
      const res = await fetch('/api/auth/session', { cache: 'no-store', credentials: 'include' })
      if (!res.ok) throw new Error('No autenticado')
      const data = await res.json()
      const u = data.user
      setProfileData({
        nombre: u?.nombre || '',
        apellido: '',
        email: u?.email || '',
        usuario: u?.usuario || u?.username || (u?.email ? u.email.split('@')[0] : '')
      })
    } catch (error) {
      console.error('Error loading profile:', error)
      toast.error('Error al cargar el perfil')
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Actualizar perfil en nuestra tabla de usuarios
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: profileData.nombre })
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'No se pudo actualizar el perfil')
      }
      
      toast.success('Perfil actualizado correctamente')
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast.error(error.message || 'Error al actualizar el perfil')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'No se pudo cambiar la contraseña')

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      
      toast.success('Contraseña actualizada correctamente')
    } catch (error: any) {
      console.error('Error updating password:', error)
      toast.error(error.message || 'Error al actualizar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <User className="w-6 h-6 text-white" />
        <h1 className="text-2xl font-bold text-white">Mi Perfil</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información Personal */}
        <div className="bg-[#06070c]/70 backdrop-blur-md rounded-2xl shadow-lg border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Información Personal</h2>
          
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/40 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  value={profileData.nombre}
                  onChange={(e) => setProfileData({ ...profileData, nombre: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/30 transition placeholder:text-white/20"
                  placeholder="Tu nombre"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/40 mb-2">
                  Apellido
                </label>
                <input
                  type="text"
                  value={profileData.apellido}
                  onChange={(e) => setProfileData({ ...profileData, apellido: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/30 transition placeholder:text-white/20"
                  placeholder="Tu apellido"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/40 mb-2">
                Email
              </label>
              <input
                type="email"
                value={profileData.email}
                disabled
                className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white/50 cursor-not-allowed"
              />
              <p className="text-[10px] text-white/30 mt-2">El email no se puede modificar</p>
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/40 mb-2">
                Usuario
              </label>
              <input
                type="text"
                value={profileData.usuario}
                disabled
                className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white/50 cursor-not-allowed"
                placeholder="Nombre de usuario"
              />
              <p className="text-[10px] text-white/30 mt-2">El usuario no se puede modificar</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white hover:bg-gray-200 disabled:opacity-50 text-black font-black uppercase text-xs tracking-widest py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 mt-4"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </form>
        </div>

        {/* Cambiar Contraseña */}
        <div className="bg-[#06070c]/70 backdrop-blur-md rounded-2xl shadow-lg border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Lock className="w-5 h-5 text-white/60" />
            Cambiar Contraseña
          </h2>
          
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/40 mb-2">
                Contraseña Actual
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/30 transition placeholder:text-white/20 pr-10"
                  placeholder="Contraseña actual"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/40 mb-2">
                Nueva Contraseña
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/30 transition placeholder:text-white/20 pr-10"
                  placeholder="Nueva contraseña"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/40 mb-2">
                Confirmar Nueva Contraseña
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/30 transition placeholder:text-white/20 pr-10"
                  placeholder="Confirmar nueva contraseña"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !passwordData.newPassword || !passwordData.confirmPassword}
              className="w-full bg-white hover:bg-gray-200 disabled:opacity-50 text-black font-black uppercase text-xs tracking-widest py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 mt-4"
            >
              <Lock className="w-4 h-4" />
              {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}