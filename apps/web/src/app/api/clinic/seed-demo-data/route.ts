import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ message: 'Modo produção ativo. Injeção de dados desativada.' }, { status: 200 });
}
