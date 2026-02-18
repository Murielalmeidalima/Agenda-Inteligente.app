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
  FileText
} from 'lucide-react';

import { Logo, LogoImage } from '../ui/Logo';
import { useProfile } from '@/providers/profile-provider';
import { createBrowserClient } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const menuItems = [
  { label: 'Início', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Agenda', href: '/dashboard/schedule', icon: Calendar },
  { label: 'Clientes', href: '/dashboard/clients', icon: Users },
  { label: 'Financeiro', href: '/dashboard/finance', icon: Wallet },
  { label: 'Estoque', href: '/dashboard/inventory', icon: Package },
  { label: 'Marketing', href: '/dashboard/marketing', icon: Megaphone },
  { label: 'Anamnese', href: '/dashboard/anamnese/templates', icon: FileText },
  { label: 'Configurações', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { profile, loading } = useProfile();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  // Função para gerar iniciais do nome
  const getInitials = (name: string | null | undefined): string => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // Função para obter cor de fundo do avatar baseada no nome
  const getAvatarColor = (name: string | null | undefined): string => {
    if (!name) return 'bg-[#D4AF37]';
    const colors = [
      'bg-[#D4AF37]', // Gold
      'bg-[#B5952F]', // Dark Gold
      'bg-[#C5A028]', // Medium Gold
      'bg-amber-600',
      'bg-yellow-600',
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  return (
    <aside className="w-64 bg-white min-h-screen p-6 flex flex-col border-r border-[#E5E0D8] relative overflow-hidden transition-colors duration-300 shadow-sm z-30">
      {/* Glow Effect */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="mb-10 flex items-center justify-center relative z-10 px-4">
        <LogoImage size={80} />
      </div>
      
      <nav className="flex-1 space-y-1.5 relative z-10">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href}
              href={item.href} 
              className={cn(
                "group flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 relative overflow-hidden",
                isActive 
                  ? "bg-[#D4AF37]/10 text-[#2C2825] font-bold shadow-sm ring-1 ring-[#D4AF37]/20" 
                  : "text-[#8A847C] hover:text-[#5C5855] hover:bg-[#FAF9F6] hover:shadow-sm"
              )}
            >
              <div className="flex items-center gap-3.5">
                <item.icon className={cn(
                  "h-5 w-5 transition-all duration-300 group-hover:scale-110", 
                   isActive ? "text-[#B5952F] fill-[#D4AF37]/20" : "text-[#A8A49D] group-hover:text-[#B5952F]"
                )} />
                <span className="text-sm tracking-wide">{item.label}</span>
              </div>
              {isActive && (
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full shadow-[0_0_8px_rgba(212,175,55,0.6)] mr-2" />
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Profile Snippet */}
      <div className="mt-auto border-t border-[#E5E0D8] pt-6 space-y-3">
        {/* User Profile Card */}
        <div className="bg-[#FAF9F6] rounded-2xl p-4 border border-[#E5E0D8] flex items-center gap-3 cursor-pointer hover:border-[#D4AF37]/30 transition-colors group">
          {loading ? (
            <>
              <div className="h-10 w-10 rounded-full bg-[#E5E0D8] animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-[#E5E0D8] rounded animate-pulse" />
                <div className="h-2 bg-[#E5E0D8] rounded w-2/3 animate-pulse" />
              </div>
            </>
          ) : (
            <>
              <div 
                className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:scale-105 transition-transform",
                  getAvatarColor(profile?.full_name)
                )}
              >
                {getInitials(profile?.full_name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#2C2825] truncate">
                  {profile?.full_name || 'Usuário'}
                </p>
                <p className="text-[10px] text-[#8A847C] font-semibold uppercase tracking-wider truncate">
                  {profile?.companies?.name || 'Clínica'}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[#8A847C] hover:text-red-600 hover:bg-red-50 transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-semibold">
            {isLoggingOut ? 'Saindo...' : 'Sair'}
          </span>
        </button>
      </div>
    </aside>
  );
}
