'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Wallet, 
  Package, 
  FileText, 
  Megaphone, 
  Trophy, 
  Settings,
  Check
} from 'lucide-react';

/**
 * CONFIGURAÇÃO CENTRALIZADA DAS CAPTURAS DO SISTEMA REAL
 * Para atualizar ou adicionar novas telas no futuro, basta alterar este array.
 */
export const showcaseItems = [
  {
    id: 'dashboard',
    title: 'Dashboard Principal',
    category: 'Visão Geral',
    description: 'Acompanhe em tempo real os principais indicadores de desempenho, faturamento mensal, agendamentos do dia e métricas de crescimento da sua clínica.',
    image: '/images/showcase/dashboard.png',
    icon: LayoutDashboard,
    urlPath: '/dashboard',
    highlights: ['Indicadores em tempo real', 'Resumo financeiro', 'Próximos atendimentos']
  },
  {
    id: 'agenda',
    title: 'Agenda Inteligente',
    category: 'Agendamento',
    description: 'Organize atendimentos de forma simples e intuitiva. Suporte a múltiplas visões (Dia, Semana, Mês), controle de salas e status de confirmação.',
    image: '/images/showcase/agenda.png',
    icon: Calendar,
    urlPath: '/dashboard/schedule',
    highlights: ['Agendamento em 3 cliques', 'Status de confirmação', 'Bloqueio inteligente']
  },
  {
    id: 'clientes',
    title: 'Cadastro de Clientes',
    category: 'Pacientes',
    description: 'Gerencie a ficha completa dos seus clientes, histórico de procedimentos realizados, dados de contato e aniversariantes do mês.',
    image: '/images/showcase/clientes.png',
    icon: Users,
    urlPath: '/dashboard/clients',
    highlights: ['Histórico completo', 'Busca rápida', 'Gestão de aniversariantes']
  },
  {
    id: 'financeiro-1',
    title: 'Gestão Financeira & Resumo',
    category: 'Financeiro',
    description: 'Acompanhe o desempenho do caixa em tempo real, receitas diárias, contas pendentes e indicadores de lucro da sua clínica.',
    image: '/images/showcase/financeiro_1.png',
    icon: Wallet,
    urlPath: '/dashboard/finance',
    highlights: ['Visão geral do caixa', 'Receitas e despesas', 'Resumo de faturamento']
  },
  {
    id: 'financeiro-2',
    title: 'Detalhamento & DRE Financeiro',
    category: 'Financeiro',
    description: 'Análise detalhada de movimentações recentes, fluxo de caixa acumulado, gráficos de crescimento e extrato por categorias.',
    image: '/images/showcase/financeiro_2.png',
    icon: Wallet,
    urlPath: '/dashboard/finance#extrato',
    highlights: ['Fluxo de caixa acumulado', 'Gráficos de crescimento', 'Extrato detalhado']
  },
  {
    id: 'estoque',
    title: 'Controle de Estoque e Produtos',
    category: 'Estoque',
    description: 'Gerencie produtos e insumos clínicos com alertas automáticos de estoque baixo, registro de movimentações e cálculo de custo por procedimento.',
    image: '/images/showcase/estoque.png',
    icon: Package,
    urlPath: '/dashboard/inventory',
    highlights: ['Alertas de estoque baixo', 'Histórico de movimentações', 'Integração financeira']
  },
  {
    id: 'anamnese',
    title: 'Anamnese Digital & Prontuários',
    category: 'Clínico',
    description: 'Modelos de fichas de anamnese 100% personalizáveis com suporte a assinatura digital na tela e conformidade estrita com a LGPD.',
    image: '/images/showcase/anamnese.png',
    icon: FileText,
    urlPath: '/dashboard/anamnese/templates',
    highlights: ['Templates personalizáveis', 'Assinatura na tela', 'Conformidade LGPD']
  },
  {
    id: 'marketing',
    title: 'Marketing & Automação WhatsApp',
    category: 'Comunicação',
    description: 'Automatize o disparo de lembretes de consulta, confirmações instantâneas e campanhas de reativação de clientes inativos.',
    image: '/images/showcase/marketing.png',
    icon: Megaphone,
    urlPath: '/dashboard/marketing',
    highlights: ['Disparos via WhatsApp', 'Lembretes de retorno', 'Campanhas de fidelização']
  },
  {
    id: 'planejamento',
    title: 'Planejamento & Metas Estratégicas',
    category: 'Estratégia',
    description: 'Defina metas financeiras e operacionais para sua equipe, acompanhe o progresso em tempo real e tome decisões baseadas em dados.',
    image: '/images/showcase/planejamento.png',
    icon: Trophy,
    urlPath: '/dashboard/planning',
    highlights: ['Metas operacionais', 'Acompanhamento de progresso', 'Projeções de crescimento']
  },
  {
    id: 'configuracoes',
    title: 'Equipe, Permissões & Configurações',
    category: 'Administração',
    description: 'Configure os dados da clínica, horários de funcionamento, gestão de colaboradores com permissões granulares por perfil de acesso.',
    image: '/images/showcase/configuracoes.png',
    icon: Settings,
    urlPath: '/dashboard/settings',
    highlights: ['Permissões por perfil', 'Gestão de horários', 'Personalização da clínica']
  }
];

export function SystemShowcaseSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const activeItem = showcaseItems[currentIndex];

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % showcaseItems.length);
  }, []);

  // Auto-play continuo fluido a cada 4 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 4000);
    return () => clearInterval(interval);
  }, [nextSlide]);

  return (
    <section 
      className="py-24 px-4 md:px-10 w-full bg-[#fbf1f2] relative overflow-hidden font-sans" 
      id="sistema-por-dentro"
    >
      <div className="max-w-7xl mx-auto">
      {/* Background Decorative Element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#d9a5b3]/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Header Section */}
      <div className="text-center mb-16 animate-fade-in-up">
        <span className="text-[#7d525f] font-bold tracking-widest uppercase text-xs md:text-sm mb-3 block">
          TRANSPARÊNCIA E TECNOLOGIA REAL
        </span>
        <h2 className="font-playfair-display text-3xl md:text-5xl font-extrabold text-[#1f1a1b] leading-[1.2]">
          Conheça o Agenda Inteligente por dentro
        </h2>
        <p className="text-[#504446] mt-4 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          Veja imagens reais de como a nossa plataforma simplifica a gestão da sua clínica no dia a dia.
        </p>
      </div>

      {/* Main Carousel Layout */}
      <div className="grid lg:grid-cols-12 gap-10 items-center">
        
        {/* Navigation Sidebar / Cards List (Desktop) - Sem rolagem, todas à mostra */}
        <div className="lg:col-span-4 space-y-3 order-2 lg:order-1">
          {showcaseItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = index === currentIndex;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentIndex(index)}
                className={`w-full text-left p-4 md:p-5 rounded-2xl transition-all duration-500 border flex items-start gap-4 cursor-pointer relative overflow-hidden ${
                  isActive
                    ? 'bg-white border-[#8c4a60]/40 shadow-[0_8px_20px_rgba(201,125,149,0.08)] ring-1 ring-[#7d525f]/20'
                    : 'bg-white/40 border-transparent hover:bg-white/80 hover:border-[#d4c2c5]/40'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-500 ${
                  isActive ? 'bg-[#7d525f] text-white shadow-md' : 'bg-[#f5ecec] text-[#7d525f]'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`font-bold text-sm md:text-base font-playfair-display truncate transition-colors duration-500 ${
                      isActive ? 'text-[#7d525f]' : 'text-[#1f1a1b]'
                    }`}>
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-xs text-[#504446]/80 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#7d525f]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Browser Showcase Viewer */}
        <div className="lg:col-span-8 order-1 lg:order-2 space-y-6">
          
          {/* Active Item Badges & Description Header */}
          <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-white/60 shadow-lg flex items-center justify-between">
            <div className="space-y-1">
              <span className="inline-block bg-[#f5ecec] text-[#7d525f] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {activeItem.category}
              </span>
              <h3 className="font-playfair-display font-bold text-xl md:text-2xl text-[#1f1a1b]">
                {activeItem.title}
              </h3>
            </div>
            
            <span className="text-xs text-[#504446]/60 font-semibold bg-[#fff8f8] px-3 py-1.5 rounded-full border border-[#d4c2c5]/30">
              {currentIndex + 1} de {showcaseItems.length}
            </span>
          </div>

          {/* Real System Browser Frame */}
          <div className="relative bg-white rounded-3xl overflow-hidden border border-[#d4c2c5]/50 shadow-2xl transition-all duration-500 hover:shadow-3xl">
            {/* Top Browser Bar */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-[#d4c2c5]/20 bg-[#fff8f8]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#c97d95]/40"></div>
                <div className="w-3 h-3 rounded-full bg-[#c97d95]/20"></div>
                <div className="w-3 h-3 rounded-full bg-[#c97d95]/10"></div>
              </div>
              <div className="mx-auto bg-white border border-[#d4c2c5]/30 rounded-full px-5 py-1 text-xs text-[#504446]/70 font-sans tracking-wide max-w-md w-full text-center truncate shadow-inner">
                app.agendainteligente.com.br{activeItem.urlPath}
              </div>
            </div>

            {/* Main Screenshot Viewport displaying full screen */}
            <div className="relative aspect-[16/10] bg-[#fbf1f2] overflow-hidden p-2">
              {showcaseItems.map((item, idx) => (
                <div 
                  key={item.id}
                  className={`absolute inset-0 p-2 transition-opacity duration-700 ease-in-out ${
                    idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                  }`}
                >
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 1000px"
                    className="object-contain"
                    priority={idx === 0}
                  />
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
    </section>
  );
}
