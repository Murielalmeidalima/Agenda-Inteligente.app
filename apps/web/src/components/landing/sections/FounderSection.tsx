'use client';
import { Instagram, Linkedin, MessageCircle } from 'lucide-react';
import { Card } from '@projeto/ui';

export function FounderSection() {
  return (
    <section className="py-24 px-4 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
        {/* [ESPAÇO PARA FOTO DA FUNDADORA] */}
        <div className="flex-1 w-full relative">
          <div className="absolute top-10 -left-10 w-40 h-40 bg-[#D4AF37]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl" />
          
          <div className="relative aspect-[4/5] w-full max-w-md mx-auto rounded-[2.5rem] overflow-hidden border-8 border-white shadow-2xl bg-slate-100 flex items-center justify-center">
            {/* Imagem Placeholder */}
            <div className="text-center p-8 text-slate-400">
              <p className="font-bold text-lg mb-2">[ESPAÇO PARA FOTO DA FUNDADORA]</p>
              <p className="text-sm">Sugestão: Foto profissional de estúdio olhando para a câmera e sorrindo.</p>
            </div>
            {/* Exemplo de tag <img src="/fundadora.jpg" alt="Nome" className="object-cover w-full h-full" /> */}
          </div>
        </div>

        <div className="flex-1 space-y-8">
          <div>
            <h2 className="text-3xl md:text-5xl font-black text-[#2C2825] mb-2 font-serif">
              Prazer, Jamily.
            </h2>
            <p className="text-xl text-[#D4AF37] font-bold">Fundadora e Especialista em Gestão para Clínicas</p>
          </div>

          <div className="space-y-4 text-[#5C5855] text-lg leading-relaxed">
            <p>
              Eu sei o quão desafiador é conciliar o atendimento impecável aos pacientes com a gestão financeira e administrativa de uma clínica.
            </p>
            <p>
              A ideia do <strong>Agenda Inteligente</strong> nasceu da minha própria experiência no mercado. Eu via profissionais excelentes perdendo dinheiro por faltas de clientes e falta de controle do fluxo de caixa.
            </p>
            <p>
              Nossa missão não é apenas entregar um software, mas ser a engrenagem que vai organizar sua operação e permitir que você escale o seu negócio com tranquilidade e previsibilidade.
            </p>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-[#E5E0D8]">
            <a href="#" className="w-12 h-12 bg-[#FAF6E9] hover:bg-[#D4AF37] hover:text-white rounded-full flex items-center justify-center text-[#D4AF37] transition-all">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="#" className="w-12 h-12 bg-[#FAF6E9] hover:bg-[#D4AF37] hover:text-white rounded-full flex items-center justify-center text-[#D4AF37] transition-all">
              <Linkedin className="w-5 h-5" />
            </a>
            <a href="#" className="w-12 h-12 bg-[#FAF6E9] hover:bg-emerald-500 hover:text-white rounded-full flex items-center justify-center text-emerald-500 transition-all">
              <MessageCircle className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
