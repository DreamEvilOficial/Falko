import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Administración | URBAN',
  description: 'Panel de administración',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-black text-white">
      {children}
    </div>
  )
}
