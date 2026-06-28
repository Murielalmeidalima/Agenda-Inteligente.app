import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Modo produção operacional ativo.' }, { status: 200 });
}
