import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Simulação de Recebimento de Mensagem
    // { from: '551199999999', body: 'Confirmado', type: 'text' }
    
    console.log('WhatsApp Webhook Received:', body);

    // Aqui entraria a lógica de:
    // 1. Buscar cliente pelo telefone
    // 2. Verificar se é resposta a uma confirmação
    // 3. Atualizar status do agendamento (Confirmado) ou salvar resposta

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}

// Verificação do Webhook (Facebook Challenge)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === 'MY_VERIFY_TOKEN') {
    return new NextResponse(challenge);
  }

  return new NextResponse('Forbidden', { status: 403 });
}
