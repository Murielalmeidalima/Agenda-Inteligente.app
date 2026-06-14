'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@projeto/ui';
import { Logo } from '@/components/ui/Logo';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { label: 'Soluções', href: '/#features' },
  { label: 'Funcionalidades', href: '/#funcionalidades' },
  { label: 'Planos', href: '/#pricing' },
  { label: 'FAQ', href: '/#faq' },
];

export function PublicNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-[#d4c2c5]/30 shadow-sm transition-all duration-300">
      <div className="flex justify-between items-center h-20 px-4 md:px-10 max-w-7xl mx-auto">
        <Link href="/" className="cursor-pointer flex items-center">
          <Logo size={32} showText={true} />
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#504446]">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-[#7d525f] transition-all duration-300 cursor-pointer"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/auth/login">
            <button className="text-[#7d525f] font-semibold hover:opacity-80 transition-all cursor-pointer">
              Login
            </button>
          </Link>
          <Link href="/auth/register">
            <button className="bg-[#7d525f] text-white px-6 py-3 rounded-full font-semibold hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-md cursor-pointer">
              Teste Grátis
            </button>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-[#504446] hover:text-[#7d525f] transition-colors cursor-pointer"
          aria-label="Menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#d4c2c5]/20 px-4 pb-4 pt-2 bg-white/95 backdrop-blur-xl animate-fade-in-up">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="py-3 px-4 text-[#504446] font-semibold hover:text-[#7d525f] hover:bg-[#fbf1f2] rounded-xl transition-colors cursor-pointer"
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-[#d4c2c5]/20 mt-2 pt-3 flex flex-col gap-2">
              <Link href="/auth/login" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full font-semibold border-[#d4c2c5] text-[#504446] hover:bg-[#fbf1f2] cursor-pointer">
                  Login
                </Button>
              </Link>
              <Link href="/auth/register" onClick={() => setMobileOpen(false)}>
                <Button className="w-full bg-[#7d525f] text-white font-bold cursor-pointer">
                  Teste Grátis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
