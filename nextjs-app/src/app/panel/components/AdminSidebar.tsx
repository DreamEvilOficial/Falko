import {
  Star,
  Package,
  Layers,
  ShoppingBag,
  Settings,
  LogOut,
  LayoutDashboard,
  Filter,
  User,
  Shield,
  Layout,
  DollarSign,
  MessageSquare,
  X,
  BarChart3,
  Truck,
  Tag,
  Flame
} from "lucide-react";
import { useRouter } from "next/navigation";
import { authAPI } from "@/lib/supabase";
import { useState, useEffect } from "react";

interface SidebarItemProps {
  id: string;
  icon: any;
  label: string;
  activeTab: string;
  setActiveTab: (id: string) => void;
  onClick?: () => void;
}

const SidebarItem = ({
  id,
  icon: Icon,
  label,
  onClick,
  activeTab,
  setActiveTab,
}: SidebarItemProps) => (
  <button
    onClick={() => {
      setActiveTab(id);
      onClick && onClick();
    }}
    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
      activeTab === id
        ? "bg-accent text-ink shadow-[0_16px_40px_-18px_rgba(183,255,42,0.45)]"
        : "text-white/70 hover:bg-white/[0.06] hover:text-white border border-transparent hover:border-white/10"
    }`}
  >
    <Icon className="w-4 h-4" />
    <span className="font-black text-[11px] uppercase tracking-[0.22em]">{label}</span>
  </button>
);

interface AdminPermissions {
  catalog: boolean;
  sales: boolean;
  adminSales: boolean;
  config: boolean;
}

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  sidebarOpen: boolean;
  storeName: string;
  onNavigate?: () => void;
  permissions?: AdminPermissions;
}

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  sidebarOpen,
  storeName,
  onNavigate,
  permissions,
}: AdminSidebarProps) {
  const router = useRouter();
  const [version, setVersion] = useState("v1.0.8-JAN");

  useEffect(() => {
    fetch("/api/version")
      .then((res) => res.json())
      .then((data) => {
        if (data.version) setVersion(data.version);
      })
      .catch(() => {});
  }, []);

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-[60] w-[280px] bg-[#05060a]/95 backdrop-blur-2xl border-r border-white/10 transform transition-transform duration-300 ease-spring ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } lg:relative lg:translate-x-0 flex flex-col h-[100dvh] shadow-[10px_0_30px_-10px_rgba(0,0,0,0.5)] lg:shadow-none`}
    >
      <div className="p-6 border-b border-white/10 flex-shrink-0 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-accent/10 blur-[60px]" />
          <div className="absolute top-1/2 -right-24 h-48 w-48 rounded-full bg-blue-500/10 blur-[60px]" />
        </div>

        <div className="relative">
          <div className="flex items-center justify-between gap-2 text-white mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-accent/50 flex items-center justify-center text-black shadow-lg shadow-accent/20">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <h2 className="font-display text-xl tracking-[0.08em] uppercase">Admin</h2>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-white/30 bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                {version}
                </span>
                <button 
                    onClick={onNavigate}
                    className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/45 truncate pl-1">{storeName}</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-6 overflow-y-auto min-h-0 flex flex-col custom-scrollbar">
        {(!permissions || permissions.catalog) && (
          <div className="space-y-1">
            <h3 className="px-3 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">Gestión del catálogo</h3>
            <SidebarItem
              id="home"
              icon={Layout}
              label="Configurar Inicio"
              activeTab={activeTab}
              setActiveTab={(tab) => { setActiveTab(tab); onNavigate && onNavigate(); }}
            />
            <SidebarItem
              id="productos"
              icon={Package}
              label="Productos"
              activeTab={activeTab}
              setActiveTab={(tab) => { setActiveTab(tab); onNavigate && onNavigate(); }}
            />
            <SidebarItem
              id="drops"
              icon={Flame}
              label="Drops"
              activeTab={activeTab}
              setActiveTab={(tab) => { setActiveTab(tab); onNavigate && onNavigate(); }}
            />
            <SidebarItem
              id="categorias"
              icon={Layers}
              label="Categorías"
              activeTab={activeTab}
              setActiveTab={(tab) => { setActiveTab(tab); onNavigate && onNavigate(); }}
            />
            <SidebarItem
              id="destacados"
              icon={Star}
              label="Destacados"
              activeTab={activeTab}
              setActiveTab={(tab) => { setActiveTab(tab); onNavigate && onNavigate(); }}
            />
            <SidebarItem
              id="filtros"
              icon={Filter}
              label="Filtros Especiales"
              activeTab={activeTab}
              setActiveTab={(tab) => { setActiveTab(tab); onNavigate && onNavigate(); }}
            />
          </div>
        )}

        {(!permissions || permissions.sales) && (
          <div className="space-y-1">
            <h3 className="px-3 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">Operación y ventas</h3>
            <SidebarItem
              id="ventas"
              icon={ShoppingBag}
              label="Ventas"
              activeTab={activeTab}
              setActiveTab={(tab) => { setActiveTab(tab); onNavigate && onNavigate(); }}
            />
            <SidebarItem
              id="envios"
              icon={Truck}
              label="Envíos"
              activeTab={activeTab}
              setActiveTab={(tab) => { setActiveTab(tab); onNavigate && onNavigate(); }}
            />
            <SidebarItem
              id="estadisticas"
              icon={BarChart3}
              label="Estadísticas"
              activeTab={activeTab}
              setActiveTab={(tab) => { setActiveTab(tab); onNavigate && onNavigate(); }}
            />
            <SidebarItem
              id="cupones"
              icon={Tag}
              label="Cupones"
              activeTab={activeTab}
              setActiveTab={(tab) => { setActiveTab(tab); onNavigate && onNavigate(); }}
            />
            <SidebarItem
              id="inventario"
              icon={Layers}
              label="Inventario"
              activeTab={activeTab}
              setActiveTab={(tab) => { setActiveTab(tab); onNavigate && onNavigate(); }}
            />
            <SidebarItem
              id="resenas"
              icon={MessageSquare}
              label="Reseñas"
              activeTab={activeTab}
              setActiveTab={(tab) => { setActiveTab(tab); onNavigate && onNavigate(); }}
            />
          </div>
        )}

        {(!permissions || permissions.adminSales || permissions.config) && (
          <div className="space-y-1">
            <h3 className="px-3 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">Gestión administrativa</h3>
            {(!permissions || permissions.adminSales) && (
              <SidebarItem
                id="deudas"
                icon={DollarSign}
                label="Deudas"
                activeTab={activeTab}
                setActiveTab={(tab) => { setActiveTab(tab); onNavigate && onNavigate(); }}
              />
            )}
            <SidebarItem
              id="operadores"
              icon={Shield}
              label="Operadores"
              activeTab={activeTab}
              setActiveTab={(tab) => { setActiveTab(tab); onNavigate && onNavigate(); }}
            />
          </div>
        )}

        {/* Cuenta y configuración */}
        <div className="space-y-1 mt-auto">
          <div className="px-3 mb-2">
            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Cuenta y configuración</h3>
            <p className="text-[9px] text-white/20 font-medium mt-0.5">Ajustes personales y del sistema</p>
          </div>
          <SidebarItem
            id="perfil"
            icon={User}
            label="Mi Perfil"
            activeTab={activeTab}
            setActiveTab={(tab) => { setActiveTab(tab); onNavigate && onNavigate(); }}
          />
          {(!permissions || permissions.config) && (
            <SidebarItem
              id="configuracion"
              icon={Settings}
              label="Configuración"
              activeTab={activeTab}
              setActiveTab={(tab) => { setActiveTab(tab); onNavigate && onNavigate(); }}
            />
          )}
        </div>

        <div className="mt-auto px-3 pb-2">
            <button
                onClick={async () => {
                await authAPI.signOut();
                window.location.reload();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-red-300/90 hover:bg-red-500/10 hover:text-red-200 rounded-lg transition-colors group"
            >
                <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="font-black text-[11px] uppercase tracking-[0.22em]">Cerrar Sesión</span>
            </button>
        </div>
      </nav>
    </aside>
  );
}
