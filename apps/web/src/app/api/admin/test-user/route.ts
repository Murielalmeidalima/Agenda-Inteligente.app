import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { error: 'Acesso negado. Modo de produção operacional ativo.' },
    { status: 403 }
  );
}
