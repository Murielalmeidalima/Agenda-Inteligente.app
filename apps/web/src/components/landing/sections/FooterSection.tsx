'use client';
import { Logo } from '@/components/ui/Logo';

export function FooterSection() {
  return (
    <footer className="py-20 border-t border-[#E5E0D8] px-4 bg-[#FAF9F6]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-2 space-y-6">
          <Logo size={40} showText={true} />
          <p className="text-[#5C5855] max-w-sm text-sm leading-relaxed">
            Potencializando profissionais de estética, saúde e beleza com tecnologia de ponta, gestão inteligente e mobilidade real.
          </p>
          <div className="text-sm font-bold text-[#D4AF37]">
            contato@agendainteligente.com.br
          </div>
        </div>
        <div>
            <h4 className="font-bold mb-4 text-[#2C2825]">Plataforma</h4>
            <ul className="space-y-3 text-[#5C5855] text-sm">
              <li><a href="#features" className="hover:text-[#D4AF37] transition-colors">Funcionalidades</a></li>
              <li><a href="#pricing" className="hover:text-[#D4AF37] transition-colors">Preços e Planos</a></li>
              <li><a href="/auth/login" className="hover:text-[#D4AF37] transition-colors">Login</a></li>
              <li><a href="/auth/register" className="hover:text-[#D4AF37] transition-colors">Criar Conta</a></li>
            </ul>
        </div>
        <div>
            <h4 className="font-bold mb-4 text-[#2C2825]">Legal</h4>
            <ul className="space-y-3 text-[#5C5855] text-sm">
              <li><a href="/politica-de-privacidade" className="hover:text-[#D4AF37] transition-colors">Política de Privacidade</a></li>
              <li><a href="/termos-de-uso" className="hover:text-[#D4AF37] transition-colors">Termos de Uso</a></li>
              <li><a href="/suporte" className="hover:text-[#D4AF37] transition-colors">Suporte Técnico</a></li>
            </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-[#E5E0D8] text-center text-[#8A847C] text-xs font-medium uppercase tracking-widest">
        © {new Date().getFullYear()} Agenda Inteligente. Todos os direitos reservados.
      </div>
    </footer>
  );
}
