import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { sendEmail, emailTemplates } from '@/services/email-service';

let hasObservationsColumn: boolean | null = null;

async function checkObservationsColumn(supabase: any) {
  if (hasObservationsColumn !== null) return hasObservationsColumn;
  try {
    const { error } = await supabase
      .from('profiles')
      .select('observations')
      .limit(1);
    hasObservationsColumn = !error;
  } catch {
    hasObservationsColumn = false;
  }
  return hasObservationsColumn;
}

export async function POST(req: Request) {
  try {
    const userClient = createServerClient();
    
    // 1. Authenticate caller
    const { data: { session }, error: authError } = await userClient.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Não autorizado. Inicie sessão novamente.' }, { status: 401 });
    }

    // 2. Fetch admin profile and company details
    const { data: adminProfile, error: profileError } = await userClient
      .from('profiles')
      .select('*, companies(*)')
      .eq('id', session.user.id)
      .single();

    if (profileError || !adminProfile || !adminProfile.company_id) {
      return NextResponse.json({ error: 'Perfil do administrador não encontrado ou sem clínica associada.' }, { status: 403 });
    }

    // Caller must be admin or chefe
    if (adminProfile.role !== 'admin' && adminProfile.role !== 'chefe') {
      return NextResponse.json({ error: 'Permissão negada. Apenas Administradores ou Sócios podem convidar funcionários.' }, { status: 403 });
    }

    const body = await req.json();
    const { full_name, email, phone, cargo, role, observations, permissions } = body;

    if (!full_name || !email || !role) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes: nome, e-mail e nível de acesso são necessários.' }, { status: 400 });
    }

    // 3. Initialize Admin Client
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!url || !key) {
      return NextResponse.json({ 
        error: 'Configuração do servidor pendente. A chave SUPABASE_SERVICE_ROLE_KEY não está definida no arquivo .env.local.' 
      }, { status: 500 });
    }
    const supabaseAdmin = createClient(url, key);

    const companyId = adminProfile.company_id;

    // 4. Verify Plan Limits
    // Fetch latest subscription of the company
    const { data: subData } = await supabaseAdmin
      .from('subscriptions')
      .select('plan:plans(max_users)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const maxUsers = (subData?.plan as any)?.max_users || 1;

    // Count currently active profiles in company
    const { count, error: countError } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'active');

    if (countError) throw countError;

    if (count && count >= maxUsers) {
      return NextResponse.json({ 
        error: `Seu plano atingiu o limite de usuários (${maxUsers} ativos). Faça upgrade para adicionar mais funcionários.` 
      }, { status: 400 });
    }

    // 5. Generate Auth Invite
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password`
      }
    });

    if (inviteError) {
      return NextResponse.json({ error: 'Erro ao gerar credenciais de acesso: ' + inviteError.message }, { status: 400 });
    }

    const userId = inviteData.user.id;

    // 6. Create Profile record (Insert)
    const hasCol = await checkObservationsColumn(supabaseAdmin);
    const profilePayload: any = {
      id: userId,
      company_id: companyId,
      full_name,
      email,
      phone: phone || null,
      cargo: cargo || null,
      role,
      status: 'active',
      permissions: {
        ...permissions,
        observations: observations || '' // fallback mapping inside permissions json
      },
      authorized_by_name: adminProfile.full_name,
      created_by_id: adminProfile.id
    };

    if (hasCol) {
      profilePayload.observations = observations || null;
    }

    const { error: insertError } = await supabaseAdmin
      .from('profiles')
      .insert(profilePayload);

    if (insertError) {
      // rollback auth user creation if profiles insert fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: 'Erro ao salvar perfil do funcionário: ' + insertError.message }, { status: 400 });
    }

    // 7. Insert Audit log
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    await supabaseAdmin.from('employee_access_logs').insert({
      company_id: companyId,
      profile_id: adminProfile.id, // who did it
      action: 'create_employee',
      resource: 'team',
      details: {
        target_employee_id: userId,
        target_employee_name: full_name,
        role: role,
        cargo: cargo
      },
      ip_address: ip
    });

    // 8. Send Invitation Email
    const inviteLink = inviteData.properties.action_link;
    const emailResult = await sendEmail({
      to: email,
      subject: `Convite de Acesso — ${adminProfile.companies?.name || 'Clínica'}`,
      html: emailTemplates.invite(
        adminProfile.companies?.name || 'Sua Clínica',
        adminProfile.full_name,
        cargo || role,
        inviteLink
      ),
      companyId: companyId,
      type: 'invite'
    });

    return NextResponse.json({
      success: true,
      message: 'Funcionário cadastrado e convite enviado com sucesso.',
      userId,
      emailSent: emailResult.success
    });

  } catch (err: any) {
    console.error('[POST /api/admin/employees] Error:', err);
    return NextResponse.json({ error: err.message || 'Erro interno do servidor.' }, { status: 500 });
  }
}
