import { createServerClient } from '@/lib/auth';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Building2,
  CalendarCheck2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@projeto/ui';
import { Logo, LogoImage } from '@/components/ui/Logo';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = createServerClient();
  
  // Check Authentication
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // This should be handled by middleware, but double check here
    return (
       <div className="flex bg-[#FDFBF7] h-screen items-center justify-center p-8 text-center">
          <div>
            <h2 className="text-xl font-bold mb-2 text-[#2C2825]">Acesso Negado</h2>
            <p className="text-[#8A847C]">Por favor, faça login novamente.</p>
          </div>
       </div>
    );
  }

  // Get User Profile & Company ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role, approved')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.company_id) {
    return (
       <div className="flex bg-[#FDFBF7] h-screen items-center justify-center p-8 text-center">
          <div className="max-w-md">
            <h2 className="text-2xl font-serif font-bold mb-4 text-[#2C2825]">Configuração Pendente</h2>
            <p className="text-[#5C5855] leading-relaxed">
              Sua conta ainda não está vinculada a nenhuma clínica. Entre em contato com o suporte ou aguarde a aprovação do administrador.
            </p>
          </div>
       </div>
    );
  }

  if (!profile.approved) {
    return (
       <div className="flex bg-[#FDFBF7] h-screen items-center justify-center p-8 text-center">
          <div className="max-w-md">
            <h2 className="text-2xl font-serif font-bold mb-4 text-[#2C2825]">Aprovação Pendente</h2>
            <p className="text-[#5C5855] leading-relaxed">
              Sua conta aguarda aprovação do administrador da clínica. Você receberá um e-mail assim que o acesso for liberado.
            </p>
          </div>
       </div>
    );
  }

  const COMPANY_ID = profile.company_id;

  // Fetch Metrics
  const [
    { count: professionalsCount },
    { count: todayAppointments },
    { data: revenueData },
    { data: companyData }
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', COMPANY_ID)
      .in('role', ['admin', 'professional']),
    
    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', COMPANY_ID)
      .gte('start_time', new Date().toISOString().split('T')[0] + 'T00:00:00Z')
      .lte('start_time', new Date().toISOString().split('T')[0] + 'T23:59:59Z'),

    supabase
      .from('appointments')
      .select(`
        price_override,
        procedures(price)
      `)
      .eq('company_id', COMPANY_ID)
      .gte('start_time', new Date().toISOString().split('T')[0] + 'T00:00:00Z')
      .lte('start_time', new Date().toISOString().split('T')[0] + 'T23:59:59Z'),

    supabase
      .from('companies')
      .select('name, logo_url')
      .eq('id', COMPANY_ID)
      .single()
  ]);

  // Calculate Predicted Revenue
  const todayRevenue = revenueData?.reduce((acc: number, curr: any) => {
    return acc + (curr.price_override || curr.procedures?.price || 0);
  }, 0) || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header com Branding */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-card p-8 rounded-3xl border border-border shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 transition-colors group-hover:bg-primary/10" />
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="relative z-10 flex items-center justify-center">
            <LogoImage 
              size={60} 
              src={companyData?.logo_url} 
              className="bg-muted rounded-2xl border border-border overflow-hidden shadow-inner w-20 h-20 md:w-24 md:h-24"
            />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-foreground tracking-tight">
              Bem-vindo, {companyData?.name || 'Sua Clínica'}
            </h2>
            <p className="text-muted-foreground mt-1 font-medium italic">
              "Gestão inteligente para resultados extraordinários."
            </p>
          </div>
        </div>
      </div>

      {/* Grid de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/dashboard/settings" className="block group">
          <Card className="bg-card border-border hover:border-blue-200 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 group-hover:scale-[1.02] active:scale-95 cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Funcionários
              </CardTitle>
              <div className="p-2.5 bg-blue-50 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 border border-blue-100/50 group-hover:border-blue-500 shadow-sm">
                <Users className="h-5 w-5 text-blue-600 group-hover:text-white transition-colors" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-foreground font-serif tracking-tighter">{professionalsCount || 0}</div>
              <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1 uppercase font-black tracking-widest">
                <span className="text-blue-600">Ativos</span> no sistema
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/schedule" className="block group">
          <Card className="bg-card border-border hover:border-amber-200 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/5 group-hover:scale-[1.02] active:scale-95 cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Agendamentos Hoje
              </CardTitle>
              <div className="p-2.5 bg-amber-50 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-all duration-300 border border-amber-100/50 group-hover:border-amber-400 shadow-sm">
                <CalendarCheck2 className="h-5 w-5 text-amber-600 group-hover:text-white transition-colors" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-foreground font-serif tracking-tighter">{todayAppointments || 0}</div>
              <p className="text-[10px] text-muted-foreground mt-2 uppercase font-black tracking-widest">
                Para o dia {new Intl.DateTimeFormat('pt-BR').format(new Date())}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/finance" className="block group">
          <Card className="bg-card border-border hover:border-emerald-200 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/5 group-hover:scale-[1.02] active:scale-95 cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Faturamento Previsto
              </CardTitle>
              <div className="p-2.5 bg-emerald-50 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 border border-emerald-100/50 group-hover:border-emerald-500 shadow-sm">
                <TrendingUp className="h-5 w-5 text-emerald-600 group-hover:text-white transition-colors" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-foreground font-serif tracking-tighter">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(todayRevenue)}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 uppercase font-black tracking-widest">
                Baseado nos serviços de hoje
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Espaço para Foto da Empresa (Grande/Fixa) */}
      <div className="bg-muted/30 rounded-3xl border-2 border-dashed border-border p-12 flex flex-col items-center justify-center text-center gap-4 min-h-[400px] relative overflow-hidden group">
        <div className="relative z-10">
          <div className="w-24 h-24 bg-card rounded-full flex items-center justify-center shadow-xl mb-4 group-hover:scale-110 transition-transform">
            <Building2 className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold text-foreground font-serif">Espaço da Empresa</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Este espaço é dedicado à foto principal da sua clínica ou escritório para personalizar sua experiência.
          </p>
        </div>
        {/* Background Decorative Element */}
        <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity">
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/50" />
        </div>
      </div>
    </div>
  );
}

