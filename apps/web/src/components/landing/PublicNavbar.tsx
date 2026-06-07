'use client';
import Link from 'next/link';
import { Button } from '@projeto/ui';
import { Logo } from '@/components/ui/Logo';

export function PublicNavbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-[#FDFBF7]/90 backdrop-blur-md border-b border-[#E5E0D8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Link href="/">
          <Logo size={32} showText={true} />
        </Link>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-bold text-[#5C5855]">
          <Link href="/#features" className="hover:text-[#D4AF37] transition-colors">Solução</Link>
          <Link href="/#pricing" className="hover:text-[#D4AF37] transition-colors">Planos</Link>
          <Link href="/suporte" className="hover:text-[#D4AF37] transition-colors">Suporte</Link>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/auth/login">
            <Button variant="ghost" className="text-[#5C5855] hover:text-[#D4AF37] font-bold">Entrar</Button>
          </Link>
          <Link href="/auth/register">
            <Button className="bg-[#D4AF37] hover:bg-[#B5952F] text-white rounded-xl font-bold px-6 shadow-md shadow-[#D4AF37]/20">
              Criar Conta
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
