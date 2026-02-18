'use client';

import Link from 'next/link';
import { 
  ArrowRight, 
  CheckCircle2, 
  Smartphone, 
  Calendar, 
  TrendingUp, 
  ShieldCheck, 
  Zap,
  Package,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { Button, Badge, Card, CardContent } from '@projeto/ui';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2C2825] transition-colors duration-300">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#FDFBF7]/80 backdrop-blur-md border-b border-[#E5E0D8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#D4AF37] rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-[#D4AF37]/20">
              P
            </div>
            <span className="text-xl font-bold tracking-tight text-[#2C2825]">ProjetoApp</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#5C5855]">
            <a href="#features" className="hover:text-[#D4AF37] transition-colors">Funcionalidades</a>
            <a href="#mobile" className="hover:text-[#D4AF37] transition-colors">Mobile</a>
            <a href="#pricing" className="hover:text-[#D4AF37] transition-colors">Preços</a>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-[#5C5855] hover:text-[#D4AF37]">Entrar</Button>
            </Link>
            <Link href="/auth/register">
              <Button className="bg-[#D4AF37] hover:bg-[#B5952F] text-white rounded-xl font-bold px-6">Criar Conta</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-48 md:pb-32 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-[#D4AF37]/10 blur-[120px] rounded-full -z-10" />
        
        <div className="max-w-5xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 py-1 px-4 border-[#D4AF37]/30 text-[#D4AF37] bg-[#D4AF37]/5 animate-fade-in">
            Novidade: Gestão de Estoque Inteligente 📦
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1] text-[#2C2825]">
            A gestão da sua clínica <br />
            <span className="bg-gradient-to-r from-[#D4AF37] to-[#B5952F] bg-clip-text text-transparent">em um novo nível.</span>
          </h1>
          <p className="text-xl text-[#5C5855] mb-10 max-w-2xl mx-auto">
            Agendamentos, financeiro, prontuário digital e estoque. Tudo sincronizado entre Web e Mobile, mesmo offline.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/register">
              <Button size="lg" className="h-14 px-8 text-lg bg-[#D4AF37] hover:bg-[#B5952F] text-white shadow-xl shadow-[#D4AF37]/20 group rounded-xl font-bold">
                Começar agora gratuitamente
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-[#E5E0D8] text-[#5C5855] hover:bg-[#FAF6E9] rounded-xl font-bold">
                Ver demonstração
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-4 bg-[#FAF6E9]/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#2C2825]">Tudo o que você precisa</h2>
            <p className="text-[#5C5855]">Uma plataforma completa para escalar sua clínica ou consultório.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Calendar className="text-[#D4AF37]" />}
              title="Agenda Inteligente"
              description="Controle agendamentos com facilidade. Lembretes automáticos e gestão de salas e profissionais."
            />
            <FeatureCard 
              icon={<TrendingUp className="text-[#D4AF37]" />}
              title="Financeiro de Ponta"
              description="Fluxo de caixa, faturamento mensal, despesas e relatórios detalhados para sua gestão."
            />
            <FeatureCard 
              icon={<ShieldCheck className="text-[#D4AF37]" />}
              title="Prontuário Seguro"
              description="Histórico clínico completo, evolução do paciente e anexos protegidos por RLS."
            />
            <FeatureCard 
              icon={<Smartphone className="text-[#D4AF37]" />}
              title="App Mobile Offline"
              description="Acesse e edite dados mesmo sem internet. Sincronização automática em background."
            />
            <FeatureCard 
              icon={<Package className="text-[#D4AF37]" />}
              title="Controle de Estoque"
              description="Alertas de estoque baixo e gestão de insumos. Nunca mais perca um atendimento por falta de material."
            />
            <FeatureCard 
              icon={<Layers className="text-[#D4AF37]" />}
              title="Multi-Tenancy"
              description="Gerencie múltiplas unidades ou empresas em uma única conta centralizada."
            />
          </div>
        </div>
      </section>

      {/* Mobile Promo */}
      <section id="mobile" className="py-24 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 space-y-8 text-center md:text-left">
            <h2 className="text-4xl md:text-5xl font-bold leading-tight text-[#2C2825]">
              Sua clínica no <span className="text-[#D4AF37] italic">bolso</span>.
            </h2>
            <p className="text-lg text-[#5C5855]">
              Nosso app mobile não é apenas uma versão simplificada. É uma ferramenta completa para o profissional de estética levar para onde quiser, com acesso offline total aos prontuários e agenda.
            </p>
            <ul className="space-y-4">
              <ListItem text="Offline-First com SQLite robusto" />
              <ListItem text="Notificações Push instantâneas" />
              <ListItem text="Sincronização em tempo real (Supabase)" />
            </ul>
          </div>
          <div className="flex-1 relative">
            <div className="aspect-[9/19] w-full max-w-[300px] mx-auto bg-white rounded-[2.5rem] border-[8px] border-[#E5E0D8] shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 w-full h-8 bg-[#FAF6E9]" />
              <div className="p-4 pt-12">
                 <div className="w-full h-40 bg-[#FAF6E9] rounded-xl mb-4 animate-pulse" />
                 <div className="w-2/3 h-4 bg-[#FAF6E9] rounded-full mb-2 animate-pulse" />
                 <div className="w-1/2 h-3 bg-[#FAF6E9] rounded-full animate-pulse" />
              </div>
            </div>
            {/* Visual elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#D4AF37]/20 blur-3xl -z-10" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#D4AF37]/10 blur-3xl -z-10" />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4 bg-[#FAF6E9]/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#2C2825]">Escolha seu plano</h2>
            <p className="text-[#5C5855]">Escalabilidade para qualquer tamanho de clínica.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="border-2 border-[#E5E0D8] bg-white p-8 rounded-3xl">
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2 text-[#2C2825]">Plano Grátis</h3>
                <div className="flex items-baseline gap-1 text-[#2C2825]">
                  <span className="text-4xl font-bold">R$ 0</span>
                  <span className="text-[#5C5855]">/mês</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                <PlanItem text="Até 50 clientes" />
                <PlanItem text="Agenda completa" />
                <PlanItem text="App Mobile Online" />
              </ul>
              <Link href="/auth/register" className="w-full">
                <Button variant="outline" className="w-full border-[#E5E0D8] hover:bg-[#FAF6E9] text-[#2C2825] font-bold rounded-xl">Começar Grátis</Button>
              </Link>
            </Card>

            <Card className="border-2 border-[#D4AF37] bg-white p-8 shadow-xl shadow-[#D4AF37]/10 relative rounded-3xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-white text-[10px] font-bold uppercase tracking-widest py-1 px-4 rounded-full">
                Mais Popular
              </div>
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2 text-[#2C2825]">Profissional</h3>
                <div className="flex items-baseline gap-1 text-[#2C2825]">
                  <span className="text-4xl font-bold">R$ 97</span>
                  <span className="text-[#5C5855]">/mês</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                <PlanItem text="Clientes ilimitados" />
                <PlanItem text="Gestão de Estoque + Financeiro" />
                <PlanItem text="Mobile Offline Master" />
                <PlanItem text="Suporte Prioritário" />
              </ul>
              <Link href="/auth/register" className="w-full">
                <Button className="w-full bg-[#D4AF37] hover:bg-[#B5952F] text-white shadow-lg shadow-[#D4AF37]/20 font-bold rounded-xl">
                  Assinar agora
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-[#E5E0D8] px-4 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#D4AF37] rounded-lg flex items-center justify-center font-bold text-white">
                P
              </div>
              <span className="text-xl font-bold tracking-tight text-[#2C2825]">ProjetoApp</span>
            </div>
            <p className="text-[#5C5855] max-w-sm">
              Potencializando profissionais de estética e clínicas com tecnologia de ponta e mobilidade real.
            </p>
          </div>
          <div>
              <h4 className="font-bold mb-4 text-[#2C2825]">Produto</h4>
              <ul className="space-y-2 text-[#5C5855] text-sm">
                <li><a href="#features" className="hover:text-[#D4AF37]">Funcionalidades</a></li>
                <li><a href="#mobile" className="hover:text-[#D4AF37]">Mobile</a></li>
                <li><a href="#pricing" className="hover:text-[#D4AF37]">Preços</a></li>
              </ul>
          </div>
          <div>
              <h4 className="font-bold mb-4 text-[#2C2825]">Empresa</h4>
              <ul className="space-y-2 text-[#5C5855] text-sm">
                <li><a href="/about" className="hover:text-[#D4AF37]">Sobre nós</a></li>
                <li><a href="/contact" className="hover:text-[#D4AF37]">Contato</a></li>
                <li><a href="/privacy" className="hover:text-[#D4AF37]">Privacidade</a></li>
              </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-[#F0EBE0] text-center text-[#8A847C] text-xs">
          © 2026 ProjetoApp. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <Card className="p-6 border-none bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all rounded-2xl">
      <div className="w-12 h-12 bg-[#FAF6E9] rounded-xl flex items-center justify-center mb-6 text-[#D4AF37]">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-[#2C2825]">{title}</h3>
      <p className="text-[#5C5855] text-sm leading-relaxed">
        {description}
      </p>
    </Card>
  );
}

function ListItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-[#5C5855]">
      <CheckCircle2 className="h-5 w-5 text-[#D4AF37] shrink-0" />
      <span>{text}</span>
    </div>
  );
}

function PlanItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-[#5C5855]">
      <div className="w-5 h-5 bg-[#FAF6E9] rounded-full flex items-center justify-center">
        <Zap className="h-3 w-3 text-[#D4AF37]" />
      </div>
      <span>{text}</span>
    </div>
  );
}
