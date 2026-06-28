import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "sb_publishable_Uqok7K_fivEfzsAEi3hNnw_H5CK_cTC";
    const supabase = createClient(url, key);

    const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
    
    return NextResponse.json({
      success: true,
      userCount: listData?.users?.length || 0,
      users: listData?.users?.map(u => ({ id: u.id, email: u.email, role: u.role })) || [],
      listError: listError ? listError.message : null
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
