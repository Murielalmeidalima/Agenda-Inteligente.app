import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Rota depreciada. O processamento da fila agora ocorre de forma nativa e isolada 
  // via PM2 no pacote `@projeto/worker` na mesma VPS da Evolution API.
  // Isso evita timeouts da Hostinger/Vercel (limite de 10-60s) em envios de lotes grandes.
  
  return NextResponse.json(
    { 
      success: false, 
      message: 'Route deprecated. The message queue is now processed by the standalone Worker (@projeto/worker) to prevent serverless timeouts.' 
    }, 
    { status: 410 } // 410 Gone
  );
}
