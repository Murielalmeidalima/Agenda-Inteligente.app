'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Calendar, Check, TrendingUp, ClipboardList, MessageSquare, ArrowRight } from 'lucide-react';

const tabs = [
  {
    id: 'agenda',
    icon: Calendar,
    title: 'Agenda Inteligente',
    description: 'Agende pacientes em 3 cliques. Arraste e solte para reagendar. Envio automático de lembretes via WhatsApp para reduzir faltas em até 40%.',
    benefits: [
      'Visualização organizada por profissional e salas',
      'Bloqueio inteligente de horários e feriados',
      'Confirmação automática direto na agenda',
    ],
    image: '/images/dashboard_mockup.png',
    alt: 'Agenda Inteligente Mockup',
  },
  {
    id: 'financeiro',
    icon: TrendingUp,
    title: 'Financeiro Completo',
    description: 'Controle de fluxo de caixa, contas a pagar e receber, demonstrativo de resultados (DRE) e controle de inadimplência de forma totalmente automatizada.',
    benefits: [
      'Conciliação bancária automática com gateway',
      'Relatórios de faturamento por profissional',
      'Alerta de cobranças pendentes e atrasadas',
    ],
    image: '/images/finance_dashboard.png',
    alt: 'Financeiro Completo Mockup',
  },
  {
    id: 'anamnese',
    icon: ClipboardList,
    title: 'Anamnese Digital',
    description: 'Prontuários eletrônicos seguros em conformidade com a LGPD. Crie fichas personalizadas, salve fotos antes/depois e colha assinaturas digitais na tela.',
    benefits: [
      'Modelos personalizáveis por especialidade',
      'Assinatura digital na tela do tablet ou celular',
      'Galeria de fotos clínicas integrada ao perfil',
    ],
    image: '/images/anamnese_mockup.png',
    alt: 'Anamnese Digital Mockup',
  },
  {
    id: 'whatsapp',
    icon: MessageSquare,
    title: 'Automação WhatsApp',
    description: 'Disparos inteligentes sem precisar de celular conectado o tempo todo. Lembretes de consultas, mensagens de aniversário e campanhas de retorno.',
    benefits: [
      'Disparos 100% automáticos via Evolution API',
      'Mensagens personalizadas com o nome do cliente',
      'Redução drástica no no-show de consultas',
    ],
    image: '/images/whatsapp_mockup.png',
    alt: 'Automação WhatsApp Mockup',
  },
];

export function GallerySection() {
  const [activeTab, setActiveTab] = useState('agenda');
  const activeTabItem = tabs.find((t) => t.id === activeTab) || tabs[0];

  return (
    <section className="py-24 px-4 md:px-10 max-w-7xl mx-auto bg-[#fff8f8] relative overflow-hidden" id="funcionalidades">
      <div className="absolute top-1/3 left-0 w-96 h-96 bg-[#d9a5b3]/5 rounded-full blur-3xl -z-10" />
      
      <div className="text-center mb-16 animate-fade-in-up">
        <span className="text-[#7d525f] font-bold tracking-widest uppercase text-sm mb-3 block">
          A PLATAFORMA EM AÇÃO
        </span>
        <h2 className="font-playfair-display text-3xl md:text-5xl font-extrabold text-[#1f1a1b] leading-[1.2]">
          Conheça cada detalhe por dentro
        </h2>
        <p className="text-[#504446] mt-4 font-sans text-base md:text-lg max-w-2xl mx-auto">
          Uma interface elegante, moderna e extremamente intuitiva desenhada especificamente para simplificar a gestão da sua clínica.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-12 items-center font-sans">
        {/* Lado Esquerdo: Abas interativas */}
        <div className="lg:col-span-5 space-y-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left p-6 rounded-3xl transition-all duration-300 border flex gap-5 cursor-pointer ${
                  isActive
                    ? 'bg-white border-[#8c4a60]/30 shadow-[0_12px_24px_rgba(201,125,149,0.06)]'
                    : 'bg-transparent border-transparent hover:bg-white/40 hover:border-[#d4c2c5]/30'
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-300 ${
                  isActive ? 'bg-[#7d525f] text-white' : 'bg-[#f5ecec] text-[#7d525f]'
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-[#1f1a1b] font-playfair-display flex items-center gap-2">
                    {tab.title}
                    {isActive && <ArrowRight className="w-4 h-4 text-[#8c4a60] animate-pulse" />}
                  </h3>
                  <p className={`text-xs md:text-sm leading-relaxed transition-colors duration-300 ${
                    isActive ? 'text-[#504446]' : 'text-[#504446]/70'
                  }`}>
                    {tab.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Lado Direito: Preview de Imagem (Browser Frame Mockup) */}
        <div className="lg:col-span-7">
          <div className="space-y-6">
            {/* Benefícios Rápidos da Aba Ativa */}
            <div className="flex flex-wrap gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-[#d4c2c5]/20 justify-center">
              {activeTabItem.benefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-semibold text-[#504446]">
                  <Check className="text-[#8c4a60] w-4 h-4 shrink-0" />
                  {benefit}
                </div>
              ))}
            </div>

            {/* Browser Frame */}
            <div className="relative bg-white rounded-3xl overflow-hidden border border-[#d4c2c5]/40 shadow-2xl transition-transform duration-500 hover:scale-[1.005]">
              {/* Top Bar */}
              <div className="flex items-center gap-2 px-6 py-4 border-b border-[#d4c2c5]/20 bg-[#fff8f8]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#c97d95]/40"></div>
                  <div className="w-3 h-3 rounded-full bg-[#c97d95]/20"></div>
                  <div className="w-3 h-3 rounded-full bg-[#c97d95]/10"></div>
                </div>
                <div className="mx-auto bg-white border border-[#d4c2c5]/20 rounded-full px-5 py-1 text-[10px] text-[#504446]/60 font-sans tracking-wide w-64 text-center select-none truncate">
                  app.agendainteligente.com.br/dashboard/{activeTab}
                </div>
              </div>
              
              {/* Image Preview with simple key to trigger smooth re-render */}
              <div className="relative aspect-[16/10] bg-[#fbf1f2] overflow-hidden select-none">
                <Image
                  key={activeTabItem.id}
                  src={activeTabItem.image}
                  alt={activeTabItem.alt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 800px"
                  className="object-cover object-top animate-fade-in duration-300"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
