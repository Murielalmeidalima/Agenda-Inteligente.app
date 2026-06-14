'use client';

import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

export function FooterSection() {
  return (
    <footer className="bg-[#fbf1f2] border-t border-[#d4c2c5]/50">
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 py-20 px-4 md:px-10 max-w-7xl mx-auto font-sans">
        
        {/* Coluna 1: Logo & Slogan */}
        <div className="space-y-6 max-w-xs">
          <Link href="/" className="cursor-pointer block">
            <Logo size={32} showText={true} />
          </Link>
          <p className="text-[#504446] text-sm leading-relaxed">
            Elevando o padrão de gestão para clínicas que valorizam a excelência e o cuidado.
          </p>
          <div className="flex gap-4">
            <a 
              className="w-10 h-10 rounded-full bg-[#eae0e1] flex items-center justify-center text-[#7d525f] hover:bg-[#7d525f] hover:text-white transition-colors duration-300 cursor-pointer" 
              href="#"
              aria-label="Instagram"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path>
              </svg>
            </a>
            <a 
              className="w-10 h-10 rounded-full bg-[#eae0e1] flex items-center justify-center text-[#7d525f] hover:bg-[#7d525f] hover:text-white transition-colors duration-300 cursor-pointer" 
              href="#"
              aria-label="LinkedIn"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path>
              </svg>
            </a>
          </div>
        </div>

        {/* Colunas de Navegação */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
          {/* Produto */}
          <div className="space-y-4">
            <h4 className="font-bold text-[#7d525f] font-playfair-display">Produto</h4>
            <ul className="space-y-2 text-sm text-[#504446]">
              <li>
                <Link href="#funcionalidades" className="hover:text-[#7d525f] transition-colors">
                  Funcionalidades
                </Link>
              </li>
              <li>
                <Link href="#planos" className="hover:text-[#7d525f] transition-colors">
                  Planos
                </Link>
              </li>
              <li>
                <Link href="#video" className="hover:text-[#7d525f] transition-colors">
                  Demonstração
                </Link>
              </li>
            </ul>
          </div>

          {/* Suporte */}
          <div className="space-y-4">
            <h4 className="font-bold text-[#7d525f] font-playfair-display">Suporte</h4>
            <ul className="space-y-2 text-sm text-[#504446]">
              <li>
                <Link href="#" className="hover:text-[#7d525f] transition-colors">
                  Central de Ajuda
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-[#7d525f] transition-colors">
                  Contato
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-[#7d525f] transition-colors">
                  API Docs
                </Link>
              </li>
            </ul>
          </div>

          {/* Jurídico */}
          <div className="space-y-4">
            <h4 className="font-bold text-[#7d525f] font-playfair-display">Jurídico</h4>
            <ul className="space-y-2 text-sm text-[#504446]">
              <li>
                <Link href="#" className="hover:text-[#7d525f] transition-colors">
                  Privacidade
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-[#7d525f] transition-colors">
                  Termos
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-[#7d525f] transition-colors">
                  Segurança
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Faixa de Direitos Autorais */}
      <div className="max-w-7xl mx-auto px-4 md:px-10 py-8 border-t border-[#d4c2c5]/20 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#504446] font-sans">
        <p>© 2024 Agenda Inteligente. Todos os direitos reservados.</p>
        <p>Feito com carinho para profissionais da saúde.</p>
      </div>
    </footer>
  );
}
