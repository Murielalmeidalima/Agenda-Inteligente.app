import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "sb_publishable_Uqok7K_fivEfzsAEi3hNnw_H5CK_cTC";
    const supabase = createClient(url, key);

    const { data: profiles } = await supabase.from('profiles').select('id, email, company_id, full_name');
    const { data: companies } = await supabase.from('companies').select('id, name');
    const { data: clients } = await supabase.from('clients').select('id, company_id, full_name');
    const { data: procedures } = await supabase.from('procedures').select('id, company_id, name');
    const { data: products } = await supabase.from('products').select('id, company_id, name');
    const { data: appointments } = await supabase.from('appointments').select('id, company_id, status');
    const { data: transactions } = await supabase.from('transactions').select('id, company_id, amount');

    return NextResponse.json({
      success: true,
      counts: {
        profiles: profiles?.length || 0,
        companies: companies?.length || 0,
        clients: clients?.length || 0,
        procedures: procedures?.length || 0,
        products: products?.length || 0,
        appointments: appointments?.length || 0,
        transactions: transactions?.length || 0
      },
      clients,
      procedures,
      products,
      profiles,
      companies
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
