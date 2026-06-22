import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

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

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const userClient = createServerClient();
    
    // 1. Authenticate caller
    const { data: { session }, error: authError } = await userClient.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Não autorizado. Inicie sessão novamente.' }, { status: 401 });
    }

    // 2. Fetch admin profile details
    const { data: adminProfile, error: profileError } = await userClient
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError || !adminProfile || !adminProfile.company_id) {
      return NextResponse.json({ error: 'Perfil do administrador não encontrado.' }, { status: 403 });
    }

    // Caller must be admin or chefe
    if (adminProfile.role !== 'admin' && adminProfile.role !== 'chefe') {
      return NextResponse.json({ error: 'Permissão negada. Apenas Administradores ou Sócios podem editar funcionários.' }, { status: 403 });
    }

    const companyId = adminProfile.company_id;

    // Fetch target employee profile to verify same company
    const { data: targetProfile, error: targetError } = await userClient
      .from('profiles')
      .select('*')
      .eq('id', id)
      .eq('company_id', companyId)
      .single();

    if (targetError || !targetProfile) {
      return NextResponse.json({ error: 'Funcionário não encontrado ou não pertence à sua clínica.' }, { status: 404 });
    }

    const body = await req.json();
    const { full_name, cargo, role, status, permissions, observations } = body;

    // 3. Initialize Admin Client
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!url || !key) {
      return NextResponse.json({ error: 'Chave do servidor inválida.' }, { status: 500 });
    }
    const supabaseAdmin = createClient(url, key);

    // 4. Plan limit check if reactivating (changing from inactive to active)
    if (status === 'active' && targetProfile.status === 'inactive') {
      // Fetch latest subscription of the company
      const { data: subData } = await supabaseAdmin
        .from('subscriptions')
        .select('plan:plans(max_users)')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const maxUsers = (subData?.plan as any)?.max_users || 1;

      // Count active profiles
      const { count, error: countError } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('status', 'active');

      if (countError) throw countError;

      if (count && count >= maxUsers) {
        return NextResponse.json({ 
          error: `Não foi possível ativar. Seu plano atingiu o limite de usuários (${maxUsers} ativos). Faça upgrade.` 
        }, { status: 400 });
      }
    }

    // 5. Update Profile
    const hasCol = await checkObservationsColumn(supabaseAdmin);
    const updatePayload: any = {
      full_name: full_name || targetProfile.full_name,
      cargo: cargo || targetProfile.cargo,
      role: role || targetProfile.role,
      status: status || targetProfile.status,
      permissions: {
        ...permissions,
        observations: observations || '' // fallback mapping inside permissions json
      },
      authorized_by_name: adminProfile.full_name
    };

    if (hasCol) {
      updatePayload.observations = observations !== undefined ? observations : targetProfile.observations;
    }

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(updatePayload)
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: 'Erro ao atualizar perfil do funcionário: ' + updateError.message }, { status: 400 });
    }

    // 6. Log changes
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    await supabaseAdmin.from('employee_access_logs').insert({
      company_id: companyId,
      profile_id: adminProfile.id,
      action: 'edit_permissions',
      resource: 'team',
      details: {
        target_employee_id: id,
        target_employee_name: full_name || targetProfile.full_name,
        role: role,
        status: status
      },
      ip_address: ip
    });

    return NextResponse.json({
      success: true,
      message: 'Funcionário atualizado com sucesso.'
    });

  } catch (err: any) {
    console.error('[PUT /api/admin/employees/[id]] Error:', err);
    return NextResponse.json({ error: err.message || 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const userClient = createServerClient();
    
    // 1. Authenticate caller
    const { data: { session }, error: authError } = await userClient.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    // 2. Fetch admin profile details
    const { data: adminProfile, error: profileError } = await userClient
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError || !adminProfile || !adminProfile.company_id) {
      return NextResponse.json({ error: 'Perfil do administrador não encontrado.' }, { status: 403 });
    }

    // Caller must be admin or chefe
    if (adminProfile.role !== 'admin' && adminProfile.role !== 'chefe') {
      return NextResponse.json({ error: 'Permissão negada. Apenas Administradores ou Sócios podem inativar funcionários.' }, { status: 403 });
    }

    const companyId = adminProfile.company_id;

    // Fetch target employee profile
    const { data: targetProfile, error: targetError } = await userClient
      .from('profiles')
      .select('*')
      .eq('id', id)
      .eq('company_id', companyId)
      .single();

    if (targetError || !targetProfile) {
      return NextResponse.json({ error: 'Funcionário não encontrado ou não pertence à sua clínica.' }, { status: 404 });
    }

    // 3. Initialize Admin Client
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!url || !key) {
      return NextResponse.json({ error: 'Chave do servidor inválida.' }, { status: 500 });
    }
    const supabaseAdmin = createClient(url, key);

    // 4. Inactivate Profile (Set status = inactive)
    const { error: disableError } = await supabaseAdmin
      .from('profiles')
      .update({ status: 'inactive' })
      .eq('id', id);

    if (disableError) {
      return NextResponse.json({ error: 'Erro ao inativar perfil do funcionário: ' + disableError.message }, { status: 400 });
    }

    // 5. Log deletion/disable action
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    await supabaseAdmin.from('employee_access_logs').insert({
      company_id: companyId,
      profile_id: adminProfile.id,
      action: 'disable_employee',
      resource: 'team',
      details: {
        target_employee_id: id,
        target_employee_name: targetProfile.full_name
      },
      ip_address: ip
    });

    return NextResponse.json({
      success: true,
      message: 'Funcionário desativado com sucesso (histórico preservado).'
    });

  } catch (err: any) {
    console.error('[DELETE /api/admin/employees/[id]] Error:', err);
    return NextResponse.json({ error: err.message || 'Erro interno do servidor.' }, { status: 500 });
  }
}
