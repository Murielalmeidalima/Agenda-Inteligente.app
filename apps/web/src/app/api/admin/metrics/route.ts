import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

// Inicializar cliente admin para ignorar RLS e consolidar métricas de todo o SaaS
const getSupabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Supabase URL e Chave API são necessários para operações do servidor.');
  }
  return createClient(url, key);
};

export async function GET(req: Request) {
  try {
    const userClient = createServerClient();
    
    // 1. Validar se o usuário está autenticado
    const { data: { session }, error: authError } = await userClient.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 2. Validar se o usuário é de fato 'super_admin'
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Acesso negado. Apenas super admins podem acessar esta API.' }, { status: 403 });
    }

    // 3. Buscar todas as assinaturas do SaaS
    const { data: subs, error: subsError } = await supabaseAdmin
      .from('subscriptions')
      .select('*, plan:plans(price)');

    if (subsError) {
      console.error('[Admin Metrics API] Error fetching subscriptions:', subsError);
      return NextResponse.json({ error: 'Erro ao buscar dados das assinaturas.' }, { status: 500 });
    }

    // 4. Buscar logs de antifraude
    const { data: fraudLogs, error: fraudError } = await supabaseAdmin
      .from('trial_antifraud_records')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (fraudError) {
      console.error('[Admin Metrics API] Error fetching fraud logs:', fraudError);
      return NextResponse.json({ error: 'Erro ao buscar logs antifraude.' }, { status: 500 });
    }

    // 5. Consolidar métricas
    let activeUsers = 0;
    let trialUsers = 0;
    let pastDue = 0;
    let expiredTrials = 0;
    let convertedTrials = 0;
    let mrr = 0;
    const now = new Date();

    if (subs) {
      subs.forEach((sub: any) => {
        const status = sub.status;
        const price = Number(sub.plan?.price || 0);

        if (status === 'active') {
          activeUsers++;
          mrr += price;
          if (sub.trial_start) {
            convertedTrials++; // Se foi ativada após ter um trial iniciado
          }
        } else if (status === 'trial') {
          const trialEnd = sub.trial_end ? new Date(sub.trial_end) : null;
          if (trialEnd && trialEnd > now) {
            trialUsers++;
          } else {
            expiredTrials++;
          }
        } else if (status === 'past_due' || status === 'suspended') {
          pastDue++;
        } else if (status === 'expired') {
          expiredTrials++;
        }
      });
    }

    const totalTrials = convertedTrials + trialUsers + expiredTrials;
    const conversionRate = totalTrials > 0 ? (convertedTrials / totalTrials) * 100 : 0;
    const fraudAttempts = fraudLogs?.filter(log => log.is_blocked).length || 0;

    return NextResponse.json({
      success: true,
      stats: {
        mrr,
        activeUsers,
        trialUsers,
        pastDue,
        expiredTrials,
        convertedTrials,
        conversionRate,
        fraudAttempts,
      },
      recentBlocked: fraudLogs || []
    });

  } catch (error: any) {
    console.error('[Admin Metrics API] Critical Error:', error);
    return NextResponse.json({ error: error.message || 'Erro crítico ao gerar métricas.' }, { status: 500 });
  }
}
