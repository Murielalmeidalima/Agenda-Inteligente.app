'use client';

import { 
  Calendar, 
  Users, 
  TrendingUp, 
  Package, 
  Megaphone, 
  UserCheck, 
  FileText, 
  Star, 
  Trophy, 
  BarChart3, 
  Bot, 
  Link2 
} from 'lucide-react';

export function FeaturesSection() {
  const features = [
    { 
      icon: Calendar, 
      title: 'Agenda Inteligente', 
      desc: 'Agendamentos rápidos de forma visual com controle de salas, profissionais e múltiplos horários.' 
    },
    { 
      icon: Users, 
      title: 'Clientes', 
      desc: 'Histórico completo de atendimentos, prontuários, preferências e aniversários em um clique.' 
    },
    { 
      icon: TrendingUp, 
      title: 'Financeiro', 
      desc: 'Fluxo de caixa em tempo real, contas a pagar e receber, comissões de equipe e DRE automático.' 
    },
    { 
      icon: Package, 
      title: 'Estoque', 
      desc: 'Controle inteligente de insumos com baixa automática de produtos a cada procedimento realizado.' 
    },
    { 
      icon: Megaphone, 
      title: 'Marketing', 
      desc: 'Campanhas automáticas de fidelização e reengajamento de clientes para aumentar suas vendas.' 
    },
    { 
      icon: UserCheck, 
      title: 'Equipe', 
      desc: 'Gestão de permissões de acesso, comissões automatizadas e metas de produtividade individuais.' 
    },
    { 
      icon: FileText, 
      title: 'Anamnese', 
      desc: 'Fichas digitais 100% personalizáveis, galeria de fotos clínicas e assinatura direta na tela.' 
    },
    { 
      icon: Star, 
      title: 'Avaliações', 
      desc: 'Envio automático de convites para avaliação no Google, elevando sua reputação local online.' 
    },
    { 
      icon: Trophy, 
      title: 'Planejamento', 
      desc: 'Definição e acompanhamento de metas operacionais e de faturamento da clínica de forma visual.' 
    },
    { 
      icon: BarChart3, 
      title: 'Relatórios', 
      desc: 'Métricas precisas e gráficos intuitivos sobre a saúde financeira e operacional do negócio.' 
    },
    { 
      icon: Bot, 
      title: 'Automações', 
      desc: 'Lembretes e confirmações automáticas de consultas via WhatsApp, reduzindo as faltas.' 
    },
    { 
      icon: Link2, 
      title: 'Integrações', 
      desc: 'Sincronização nativa com WhatsApp oficial, gateways de pagamento e serviços de e-mail.' 
    },
  ];

  return (
    <section id="features" className="py-20 md:py-28 px-4 bg-[#FAF6F0] relative">
      <div className="absolute top-0 right-0 w-1/3 h-1/2 bg-[#D4AF37]/5 blur-[100px] -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto font-sans">
        <div className="text-center mb-16">
          <span className="text-[#D4AF37] font-bold tracking-widest uppercase text-xs sm:text-sm mb-3 block">
            RECURSOS COMPLETOS
          </span>
          <h2 className="font-serif text-3xl md:text-5xl font-bold mb-4 text-[#2C2825]">
            Tudo o que você precisa em um único lugar
          </h2>
          <p className="text-[#5C5855] text-base sm:text-lg max-w-2xl mx-auto">
            Uma plataforma integrada de ponta a ponta com recursos pensados especificamente para escalar a operação do seu negócio.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="p-6 bg-white border border-[#FAF6F0] rounded-[2rem] hover:border-[#D4AF37]/30 hover:shadow-[0_15px_30px_rgba(44,40,37,0.03)] hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
              >
                <div className="w-12 h-12 bg-[#FAF6F0] rounded-2xl flex items-center justify-center mb-5 text-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-white transition-all duration-300 shadow-sm shadow-[#D4AF37]/5">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold mb-2 text-[#2C2825] font-serif group-hover:text-[#D4AF37] transition-colors duration-300">{feat.title}</h3>
                <p className="text-[#5C5855] text-xs sm:text-sm leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
