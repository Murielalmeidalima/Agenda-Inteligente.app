'use client';

import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { 
  CircleHelp, BookOpen, Building2,
  Lock, FileText, Cookie, ShieldCheck, Scale, FileX, Receipt,
  Cloud, Database, KeyRound, CheckCircle2, ShieldAlert,
  Mail, Briefcase, Clock, MessageCircle, Instagram
} from 'lucide-react';

interface FooterLinkItem {
  label: string;
  href: string;
  description: string;
  icon: any;
  external?: boolean;
}

const SUPORTE_LINKS: FooterLinkItem[] = [
  { label: 'Central de Ajuda (FAQ)', href: '#faq', description: 'Encontre respostas rápidas para as principais dúvidas.', icon: CircleHelp },
  { label: 'Base de Conhecimento', href: '/suporte', description: 'Artigos e tutoriais passo a passo para aproveitar ao máximo.', icon: BookOpen },
];

const JURIDICO_LINKS: FooterLinkItem[] = [
  { label: 'Política de Privacidade', href: '/politica-de-privacidade', description: 'Entenda como protegemos e utilizamos seus dados.', icon: Lock },
  { label: 'Termos de Uso', href: '/termos-de-uso', description: 'Regras e condições gerais de utilização da plataforma.', icon: FileText },
  { label: 'Política de Cookies', href: '/politica-de-privacidade#cookies', description: 'Saiba como utilizamos navegação e preferências.', icon: Cookie },
  { label: 'Segurança da Informação', href: '/politica-de-privacidade#seguranca', description: 'Padrões bancários de segurança e armazenamento.', icon: ShieldCheck },
  { label: 'LGPD e Tratamento de Dados', href: '/politica-de-privacidade#lgpd', description: 'Conheça nossos compromissos com a Lei Geral de Proteção de Dados.', icon: Scale },
  { label: 'Política de Cancelamento', href: '/termos-de-uso#cancelamento', description: 'Transparência total sem fidelidade forçada ou multas.', icon: FileX },
  { label: 'Política de Reembolso', href: '/termos-de-uso#reembolso', description: 'Direitos e prazos de devolução quando aplicável.', icon: Receipt },
];

const SEGURANCA_ITEMS = [
  { label: 'Dados protegidos por criptografia', description: 'Criptografia ponta a ponta (AES-256 e SSL/TLS).', icon: Lock },
  { label: 'Infraestrutura em nuvem', description: 'Servidores empresariais de alta performance e redundância.', icon: Cloud },
  { label: 'Backup automático', description: 'Cópias de segurança diárias com restauração rápida.', icon: Database },
  { label: 'Autenticação segura', description: 'Sessões protegidas e controle rigoroso de acesso.', icon: KeyRound },
  { label: 'Conformidade com LGPD', description: 'Protocolos alinhados às exigências legais e médicas.', icon: CheckCircle2 },
  { label: 'Ambiente protegido', description: 'Monitoramento contínuo contra ameaças 24/7.', icon: ShieldAlert },
];

export function FooterSection() {
  return (
    <footer className="bg-[#2C2825] border-t border-[#2C2825]/30 font-sans text-[#FAF6F0] overflow-hidden">
      {/* Top Brand Header */}
      <div className="w-full border-b border-[#E5E0D8]/10 py-10 px-4 md:px-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <Link href="/" className="cursor-pointer inline-block">
              <Logo size={32} showText={true} />
            </Link>
            <p className="text-sm text-[#E5E0D8]/70 max-w-md leading-relaxed">
              Elevando o padrão de gestão para clínicas que valorizam a excelência, o cuidado e a segurança.
            </p>
          </div>

          {/* Redes Sociais */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#E5E0D8]/60 hidden md:inline">Siga-nos:</span>
            <a 
              className="w-10 h-10 rounded-full bg-[#E5E0D8]/10 flex items-center justify-center text-[#E5E0D8] hover:bg-[#D4AF37] hover:text-white transition-colors duration-300 cursor-pointer shadow-sm" 
              href="https://www.instagram.com/studiojamilyguimaraes?igsh=MXE2cDl2ZmljdG5qMQ%3D%3D&utm_source=qr"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              title="Siga nosso Instagram oficial"
            >
              <Instagram className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Grid Content: 4 Columns on Desktop, 2 on Tablet, 1 on Mobile */}
      <div className="max-w-7xl mx-auto py-16 px-4 md:px-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12">
        
        {/* Coluna 1: Suporte */}
        <div className="space-y-5">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[#E5E0D8]/15">
            <CircleHelp className="w-5 h-5 text-[#D4AF37]" />
            <h3 className="font-bold text-[#FAF6F0] font-serif text-lg">Suporte</h3>
          </div>
          <ul className="space-y-3">
            {SUPORTE_LINKS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <li key={idx} className="group relative">
                  <Link 
                    href={item.href}
                    className="flex items-center gap-2.5 text-xs md:text-sm text-[#E5E0D8]/80 hover:text-[#D4AF37] transition-all duration-200 group-hover:translate-x-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 rounded-sm"
                    title={item.description}
                  >
                    <Icon className="w-4 h-4 text-[#D4AF37]/50 group-hover:text-[#D4AF37] shrink-0 transition-colors" />
                    <span className="relative font-medium">
                      {item.label}
                    </span>
                  </Link>
                  {/* Microdescrição Hover (Tooltip Elegante) */}
                  <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-30 w-60 p-2.5 bg-[#FAF6F0] text-[#2C2825] text-[11px] rounded-xl shadow-xl border border-[#E5E0D8]/30 pointer-events-none animate-fade-in">
                    <p className="leading-snug">{item.description}</p>
                    <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-[#FAF6F0]" />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Coluna 2: Jurídico */}
        <div className="space-y-5">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[#E5E0D8]/15">
            <Scale className="w-5 h-5 text-[#D4AF37]" />
            <h3 className="font-bold text-[#FAF6F0] font-serif text-lg">Jurídico</h3>
          </div>
          <ul className="space-y-3">
            {JURIDICO_LINKS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <li key={idx} className="group relative">
                  <Link 
                    href={item.href}
                    className="flex items-center gap-2.5 text-xs md:text-sm text-[#E5E0D8]/80 hover:text-[#D4AF37] transition-all duration-200 group-hover:translate-x-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 rounded-sm"
                    title={item.description}
                  >
                    <Icon className="w-4 h-4 text-[#D4AF37]/50 group-hover:text-[#D4AF37] shrink-0 transition-colors" />
                    <span className="relative font-medium">
                      {item.label}
                    </span>
                  </Link>
                  {/* Microdescrição Hover (Tooltip Elegante) */}
                  <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-30 w-60 p-2.5 bg-[#FAF6F0] text-[#2C2825] text-[11px] rounded-xl shadow-xl border border-[#E5E0D8]/30 pointer-events-none animate-fade-in">
                    <p className="leading-snug">{item.description}</p>
                    <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-[#FAF6F0]" />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Coluna 3: Segurança */}
        <div className="space-y-5">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[#E5E0D8]/15">
            <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
            <h3 className="font-bold text-[#FAF6F0] font-serif text-lg">Segurança</h3>
          </div>
          <ul className="space-y-3">
            {SEGURANCA_ITEMS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <li key={idx} className="group relative">
                  <div 
                    className="flex items-center gap-2.5 text-xs md:text-sm text-[#E5E0D8]/80 group-hover:text-[#D4AF37] transition-colors py-0.5 cursor-default"
                    title={item.description}
                  >
                    <div className="w-6 h-6 rounded-md bg-[#E5E0D8]/10 flex items-center justify-center shrink-0 group-hover:bg-[#D4AF37] group-hover:text-white transition-colors">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-medium leading-tight">
                      {item.label}
                    </span>
                  </div>
                  {/* Microdescrição Hover (Tooltip Elegante) */}
                  <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-30 w-60 p-2.5 bg-[#FAF6F0] text-[#2C2825] text-[11px] rounded-xl shadow-xl border border-[#E5E0D8]/30 pointer-events-none animate-fade-in">
                    <p className="leading-snug">{item.description}</p>
                    <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-[#FAF6F0]" />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Coluna 4: Contato */}
        <div className="space-y-5">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[#E5E0D8]/15">
            <Mail className="w-5 h-5 text-[#D4AF37]" />
            <h3 className="font-bold text-[#FAF6F0] font-serif text-lg">Contato</h3>
          </div>
          <ul className="space-y-4 text-xs md:text-sm">
            <li className="group relative flex items-start gap-2.5">
              <Mail className="w-4 h-4 text-[#D4AF37]/60 shrink-0 mt-0.5" />
              <div>
                <span className="block text-[11px] uppercase tracking-wider font-bold text-[#D4AF37]/50">E-mail Oficial</span>
                <a href="mailto:jamilyguimaraes02@gmail.com" className="font-bold text-[#E5E0D8] hover:text-[#D4AF37] hover:underline transition-colors">
                  Enviar mensagem por e-mail &rarr;
                </a>
              </div>
            </li>
            <li className="group relative flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-[#D4AF37]/60 shrink-0 mt-0.5" />
              <div>
                <span className="block text-[11px] uppercase tracking-wider font-bold text-[#D4AF37]/50">Atendimento</span>
                <span className="font-medium text-[#E5E0D8]/80">Seg. a Sex. — 08h às 18h</span>
              </div>
            </li>
            <li className="group relative flex items-start gap-2.5 pt-1">
              <MessageCircle className="w-4 h-4 text-[#D4AF37]/60 shrink-0 mt-0.5" />
              <div>
                <span className="block text-[11px] uppercase tracking-wider font-bold text-[#D4AF37]/50">WhatsApp</span>
                <a 
                  href="https://wa.me/5518996676710" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-bold text-[#E5E0D8] hover:text-[#D4AF37] hover:underline transition-colors"
                >
                  Entrar em contato no WhatsApp &rarr;
                </a>
              </div>
            </li>
            <li className="group relative flex items-start gap-2.5 pt-1">
              <Building2 className="w-4 h-4 text-[#D4AF37]/60 shrink-0 mt-0.5" />
              <div>
                <span className="block text-[11px] uppercase tracking-wider font-bold text-[#D4AF37]/50">Contato Comercial</span>
                <Link href="/suporte#comercial" className="font-bold text-[#E5E0D8] hover:text-[#D4AF37] hover:underline transition-colors">
                  Falar com especialista &rarr;
                </Link>
              </div>
            </li>
          </ul>
        </div>

      </div>

      {/* Faixa de Direitos Autorais e Transparência */}
      <div className="w-full border-t border-[#E5E0D8]/10 py-6 px-4 md:px-10 bg-[#252220]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#E5E0D8]/60">
          <p>© 2026 Agenda Inteligente. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4">
            <Link href="/politica-de-privacidade" className="hover:text-[#D4AF37] transition-colors">Privacidade</Link>
            <span>•</span>
            <Link href="/termos-de-uso" className="hover:text-[#D4AF37] transition-colors">Termos</Link>
            <span>•</span>
            <span className="text-[#D4AF37]/70 font-semibold">Tecnologia Feita com Cuidado para a Saúde</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
