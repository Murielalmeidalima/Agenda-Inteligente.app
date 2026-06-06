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
      <section className="pt-32 pb-20 md:pt-48 md:pb-32 px-4 relative overflow-hidden flex flex-col items-center justify-center min-h-[90vh]">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[600px] bg-gradient-to-r from-[#D4AF37]/20 via-emerald-500/10 to-blue-500/10 blur-[120px] rounded-full -z-10 animate-pulse-slow" />
        <div className="absolute top-20 left-10 w-32 h-32 bg-[#D4AF37]/10 blur-[50px] rounded-full -z-10 animate-bounce-slow" />
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full -z-10 animate-pulse-slow" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <Badge variant="outline" className="mb-8 py-2 px-6 border-[#D4AF37]/40 text-[#D4AF37] bg-[#D4AF37]/5 animate-fade-in text-xs tracking-widest uppercase font-black backdrop-blur-sm rounded-full shadow-lg shadow-[#D4AF37]/10">
            A EVOLUÇÃO DA GESTÃO EM CLÍNICAS ✨
          </Badge>
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-8 leading-[1.05] text-[#2C2825] font-serif animate-fade-in-up">
            A sua clínica <br />
            <span className="bg-gradient-to-br from-[#D4AF37] via-[#B5952F] to-amber-700 bg-clip-text text-transparent drop-shadow-sm">em um novo nível.</span>
          </h1>
          <p className="text-xl md:text-2xl text-[#5C5855] mb-12 max-w-3xl mx-auto font-medium leading-relaxed animate-fade-in-up delay-100">
            Agenda inteligente, prontuário seguro, financeiro completo e aplicativo mobile para você e sua equipe. Tudo em um só lugar.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-fade-in-up delay-200">
            <Link href="/auth/register">
              <Button size="lg" className="h-16 px-10 text-xl bg-[#D4AF37] hover:bg-[#B5952F] text-white shadow-2xl shadow-[#D4AF37]/30 group rounded-[1.5rem] font-black transition-all hover:scale-105 active:scale-95">
                Testar Gratuitamente
                <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="h-16 px-10 text-xl border-[#E5E0D8] text-[#5C5855] hover:bg-[#FAF9F6] hover:text-[#2C2825] shadow-lg rounded-[1.5rem] font-bold transition-all hover:scale-105 active:scale-95 bg-white/50 backdrop-blur-sm">
                Conhecer Recursos
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
      <section id="mobile" className="py-32 px-4 overflow-hidden relative bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        {/* Visual elements */}
        <div className="absolute top-0 right-0 w-full max-w-[800px] h-[800px] bg-[#D4AF37]/10 blur-[150px] -z-10 rounded-full" />
        <div className="absolute bottom-0 left-0 w-full max-w-[600px] h-[600px] bg-emerald-500/10 blur-[120px] -z-10 rounded-full" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-20">
          <div className="flex-1 space-y-10 text-center md:text-left relative z-10">
            <Badge className="bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30 hover:bg-[#D4AF37]/30 px-4 py-1.5 rounded-full uppercase tracking-widest font-black text-xs">
              SISTEMA RESPONSIVO
            </Badge>
            <h2 className="text-4xl md:text-6xl font-black leading-tight font-serif tracking-tighter">
              A sua clínica no <span className="text-[#D4AF37] italic">bolso</span>.
            </h2>
            <p className="text-xl text-slate-300 font-medium leading-relaxed">
              Acesse a plataforma diretamente do navegador do seu celular com a mesma facilidade de um aplicativo. Todo o controle na palma da sua mão.
            </p>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                  <Smartphone className="h-6 w-6 text-[#D4AF37]" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Perfeito para Celular</h4>
                  <p className="text-slate-400 text-sm mt-1">Tire fotos dos pacientes e gerencie a agenda com poucos cliques, de onde estiver.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                  <Zap className="h-6 w-6 text-[#D4AF37]" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Dados Sempre na Nuvem</h4>
                  <p className="text-slate-400 text-sm mt-1">Tudo que você altera no celular é sincronizado instantaneamente com seu computador.</p>
                </div>
              </div>
            </div>
            
            <Link href="/auth/register" className="inline-block">
              <Button className="h-14 px-8 text-lg bg-white hover:bg-slate-100 text-slate-900 rounded-xl font-bold transition-transform hover:scale-105">
                Começar a usar agora
              </Button>
            </Link>
          </div>
          <div className="flex-1 relative z-10 w-full flex justify-center">
            {/* Mockup Premium Container */}
            <div className="relative group">
               <div className="absolute -inset-4 bg-gradient-to-r from-[#D4AF37] to-amber-700 rounded-[3.5rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000" />
               <img 
                 src="/landing-mobile.png" 
                 alt="Mobile App Preview" 
                 className="relative w-full max-w-[340px] rounded-[3rem] shadow-2xl border-[6px] border-slate-800 object-cover z-20 group-hover:-translate-y-4 transition-transform duration-700"
               />
               {/* Badge Flutuante */}
               <div className="absolute top-20 -left-16 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-xl z-30 animate-bounce-slow">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                     <CheckCircle2 className="w-5 h-5" />
                   </div>
                   <div>
                     <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Sincronizado</p>
                     <p className="font-bold text-sm text-white">Prontuário Salvo</p>
                   </div>
                 </div>
               </div>
            </div>
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
    <Card className="p-8 border border-[#E5E0D8]/50 bg-white/60 backdrop-blur-xl shadow-lg shadow-black/5 hover:shadow-2xl hover:shadow-[#D4AF37]/10 hover:-translate-y-2 hover:border-[#D4AF37]/30 transition-all duration-500 rounded-[2rem] group cursor-default">
      <div className="w-16 h-16 bg-[#FAF9F6] rounded-2xl flex items-center justify-center mb-6 text-[#D4AF37] border border-[#E5E0D8] group-hover:scale-110 group-hover:bg-[#D4AF37] group-hover:text-white transition-all duration-500 shadow-sm">
        {icon}
      </div>
      <h3 className="text-2xl font-black mb-3 text-[#2C2825] tracking-tight">{title}</h3>
      <p className="text-[#8A847C] font-medium leading-relaxed">
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
