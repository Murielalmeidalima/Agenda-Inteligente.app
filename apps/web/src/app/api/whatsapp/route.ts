import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/auth';
import { WhatsappService } from '@projeto/utils';
import { z } from 'zod';

const actionSchema = z.object({
  action: z.enum(['status', 'create', 'connect', 'logout'])
});

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 400 });
    }

    const body = await req.json();
    const parseResult = actionSchema.safeParse(body);
    
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid action payload', details: parseResult.error.format() }, { status: 400 });
    }

    const { action } = parseResult.data;

    const companyId = profile.company_id;
    const instanceName = `empresa_${companyId.replace(/-/g, '')}`;

    // Evolution API is disabled in MVP
    if (action === 'status') {
      return NextResponse.json({ instance: { state: 'disconnected' } });
    }

    if (action === 'create' || action === 'connect' || action === 'logout') {
      return NextResponse.json({ 
        success: false, 
        error: 'WhatsApp integration is disabled in MVP version' 
      }, { status: 400 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('WhatsApp API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
