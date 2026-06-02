import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/auth';
import { WhatsappService } from 'utils/notifications/whatsapp/whatsapp-service';

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

    const { action } = await req.json();

    const companyId = profile.company_id;
    const instanceName = `empresa_${companyId.replace(/-/g, '')}`;
    const whatsappService = new WhatsappService(instanceName);

    if (action === 'status') {
      try {
        const state = await whatsappService.getStatus();
        // Return state and also update database if connected
        if (state?.instance?.state === 'open') {
           await supabase.from('companies').update({
             whatsapp_instance_name: instanceName,
             whatsapp_status: 'connected'
           }).eq('id', companyId);
        }
        return NextResponse.json(state);
      } catch (err: any) {
        if (err.message?.includes('not found') || err.message?.includes('Error getting connection')) {
           return NextResponse.json({ instance: { state: 'not_created' } });
        }
        throw err;
      }
    }

    if (action === 'create') {
      const response = await whatsappService.createInstance();
      await supabase.from('companies').update({
        whatsapp_instance_name: instanceName,
        whatsapp_status: 'qr_ready'
      }).eq('id', companyId);
      
      return NextResponse.json(response);
    }

    if (action === 'connect') {
      const response = await whatsappService.connect();
      return NextResponse.json(response);
    }

    if (action === 'logout') {
      const response = await whatsappService.logout();
      await supabase.from('companies').update({
        whatsapp_status: 'disconnected'
      }).eq('id', companyId);
      return NextResponse.json(response);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('WhatsApp API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
