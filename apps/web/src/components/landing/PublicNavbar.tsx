'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@projeto/ui';
import { Logo } from '@/components/ui/Logo';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { label: 'Benefícios', href: '/#benefits' },
  { label: 'Funcionalidades', href: '/#features' },
  { label: 'Integrações', href: '/#integrations' },
  { label: 'Planos', href: '/#planos' },
  { label: 'FAQ', href: '/#faq' },
];

export function PublicNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-[#FAF6F0] shadow-[0_2px_15px_rgba(44,40,37,0.02)] transition-all duration-300">
      <div className="flex justify-between items-center h-20 px-4 md:px-10 max-w-7xl mx-auto">
        <Link href="/" className="cursor-pointer flex items-center">
          <Logo size={32} showText={true} />
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#5C5855]">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-[#D4AF37] transition-all duration-300 cursor-pointer"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/auth/login">
            <button className="text-[#2C2825] font-semibold hover:text-[#D4AF37] transition-all cursor-pointer">
              Login
            </button>
          </Link>
          <Link href="/auth/register">
            <button className="bg-gradient-to-r from-[#D4AF37] to-[#C5A028] hover:from-[#C5A028] hover:to-[#B5952F] text-white px-6 py-3 rounded-full font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shadow-[#D4AF37]/10 cursor-pointer">
              Começar Grátis
            </button>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-[#5C5855] hover:text-[#D4AF37] transition-colors cursor-pointer"
          aria-label="Menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#FAF6F0] px-4 pb-6 pt-2 bg-white/95 backdrop-blur-xl animate-fade-in-up">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="py-3 px-4 text-[#5C5855] font-semibold hover:text-[#D4AF37] hover:bg-[#FAF6F0]/50 rounded-xl transition-colors cursor-pointer"
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-[#FAF6F0] mt-4 pt-4 flex flex-col gap-2">
              <Link href="/auth/login" onClick={() => setMobileOpen(false)}>
                <button className="w-full h-12 font-semibold text-[#2C2825] bg-[#FAF6F0] hover:bg-[#FAF6F0]/80 rounded-xl transition-all cursor-pointer">
                  Login
                </button>
              </Link>
              <Link href="/auth/register" onClick={() => setMobileOpen(false)}>
                <button className="w-full h-12 bg-[#D4AF37] hover:bg-[#B5952F] text-white font-bold rounded-xl transition-all cursor-pointer shadow-md">
                  Começar Agora
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
