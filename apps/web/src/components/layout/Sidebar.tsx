'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@projeto/ui';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Wallet, 
  Settings, 
  LogOut,
  ChevronRight,
  Package,
  Megaphone,
  FileText,
  Activity,
  TrendingUp,
  Trophy,
  X
} from 'lucide-react';

import { Logo, LogoImage } from '../ui/Logo';
import { useProfile } from '@/providers/profile-provider';
import { createBrowserClient } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const menuItems = [
  { label: 'Início', href: '/dashboard', icon: LayoutDashboard, color: 'text-slate-500', bg: 'bg-slate-500' },
  { label: 'Agenda', href: '/dashboard/schedule', icon: Calendar, color: 'text-amber-500', bg: 'bg-amber-500' },
  { label: 'Clientes', href: '/dashboard/clients', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500' },
  { label: 'Financeiro', href: '/dashboard/finance', icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-500' },
  { label: 'Estoque', href: '/dashboard/inventory', icon: Package, color: 'text-orange-500', bg: 'bg-orange-500' },
  { label: 'Marketing', href: '/dashboard/marketing', icon: Megaphone, color: 'text-rose-500', bg: 'bg-rose-500' },
  { label: 'Anamnese', href: '/dashboard/anamnese/templates', icon: FileText, color: 'text-violet-500', bg: 'bg-violet-500' },
  { label: 'Procedimentos', href: '/dashboard/procedures', icon: Activity, color: 'text-red-500', bg: 'bg-red-500' },
  { label: 'Análises', href: '/dashboard/analytics', icon: TrendingUp, color: 'text-cyan-500', bg: 'bg-cyan-500' },
  { label: 'Planejamento', href: '/dashboard/planning', icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-500' },
  { label: 'Configurações', href: '/dashboard/settings', icon: Settings, color: 'text-slate-400', bg: 'bg-slate-400' },
];

export function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void } = {}) {
  const pathname = usePathname();
  const { profile, loading, hasPermission } = useProfile();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const getInitials = (name: string | null | undefined): string => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const getAvatarColor = (name: string | null | undefined): string => {
    if (!name) return 'bg-[#D4AF37]';
    const colors = [
      'bg-slate-900',
      'bg-blue-600',
      'bg-emerald-600',
      'bg-amber-600',
      'bg-rose-600',
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  return (
    <aside className={cn(
      "w-64 bg-white p-6 flex flex-col border-r border-slate-100 h-screen overflow-y-auto transition-all duration-300 shadow-sm z-50 shrink-0",
      "fixed top-0 bottom-0 left-0 lg:sticky lg:top-0",
      isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
    )}>
      {/* Subtle Background Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-[100px] pointer-events-none opacity-50" />
      
      <div className="mb-10 flex items-center justify-between relative z-10 px-4">
        <Logo size={44} />
        {onClose && (
          <button 
            onClick={onClose}
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      
      <nav className="flex-1 space-y-2 relative z-10">
        {menuItems
          .filter(item => {
            // Se for Início, sempre mostra
            if (item.label === 'Início') return true;
            
            // Mapeamento simples de label para chave de permissão
            const permissionKey = item.label.toLowerCase()
              .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove acentos
              .replace('í', 'i').replace('ç', 'c'); // fallback manual se precisar

            // Mapear casos especiais se as chaves no banco forem diferentes
            const keyMap: { [key: string]: string } = {
               'inicio': 'dashboard',
               'analises': 'reports',
               'planejamento': 'reports'
            };

            const finalKey = keyMap[permissionKey] || permissionKey;
            return hasPermission(finalKey, 'view');
          })
          .map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href}
                href={item.href} 
                prefetch={true}
                className={cn(
                  "group flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 relative overflow-hidden",
                  isActive 
                    ? "bg-slate-100 text-slate-900 font-bold shadow-sm ring-1 ring-slate-200/50" 
                    : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                <div className="flex items-center gap-3.5">
                  <div className={cn(
                    "p-2 rounded-xl transition-all duration-300",
                     isActive ? item.bg + " shadow-lg shadow-slate-200" : "bg-transparent group-hover:bg-white border border-transparent group-hover:border-slate-100"
                  )}>
                    <item.icon className={cn(
                      "h-4 w-4 transition-all duration-300", 
                       isActive ? "text-white" : cn("text-slate-300 group-hover:", item.color)
                    )} />
                  </div>
                  <span className="text-sm tracking-wide">{item.label}</span>
                </div>
                {isActive && (
                  <div className="flex items-center">
                    <div className={cn("w-1.5 h-1.5 rounded-full shadow-lg", item.bg.replace('bg-', 'bg-'))} />
                  </div>
                )}
              </Link>
            );
          })}
      </nav>

      {/* Footer / Profile Snippet */}
      <div className="mt-auto border-t border-slate-100 pt-6 space-y-3">
        {/* User Profile Card */}
        <Link 
          href="/dashboard/settings"
          className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-3 cursor-pointer hover:border-slate-200 transition-colors group block"
        >
          {loading ? (
            <>
              <div className="h-10 w-10 rounded-full bg-slate-100 animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-100 rounded animate-pulse" />
                <div className="h-2 bg-slate-100 rounded w-2/3 animate-pulse" />
              </div>
            </>
          ) : (
            <>
              <div 
                className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:scale-105 transition-transform overflow-hidden shrink-0",
                  !profile?.companies?.logo_url && getAvatarColor(profile?.full_name)
                )}
              >
                {profile?.companies?.logo_url ? (
                  <img 
                    src={profile.companies.logo_url} 
                    alt={profile?.companies?.name || 'Clínica'} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  getInitials(profile?.full_name)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-900 truncate tracking-tight">
                  {profile?.full_name || 'Usuário'}
                </p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">
                  {profile?.companies?.name || 'Clínica'}
                </p>
              </div>
            </>
          )}
        </Link>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-bold uppercase tracking-[0.2em] text-[10px]">
            {isLoggingOut ? 'Saindo...' : 'Sair'}
          </span>
        </button>
      </div>
    </aside>
  );
}
