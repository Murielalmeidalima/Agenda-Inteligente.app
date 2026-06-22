import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "sb_publishable_Uqok7K_fivEfzsAEi3hNnw_H5CK_cTC";
    
    const supabase = createClient(url, key);
    
    // Test if 'observations' column exists
    const { data, error } = await supabase
      .from('profiles')
      .select('observations')
      .limit(1);

    return NextResponse.json({
      success: true,
      exists: !error,
      error: error ? error.message : null,
      data
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
