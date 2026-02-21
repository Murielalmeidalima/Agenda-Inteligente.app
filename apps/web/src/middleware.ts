import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // =====================================================
  // AUTENTICAÇÃO — usa getUser() para validação segura
  // (getSession() não valida o JWT no servidor — inseguro)
  // =====================================================

  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const publicPaths = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/resend-confirmation',
    '/auth/pending',       // Página de "aguardando aprovação" — NUNCA redirecionar daqui
    '/f/',
    '/confirm-appointment/',
    '/review-appointment/',
    '/feedback/'
  ];

  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // ── Usuário NÃO autenticado tentando acessar o dashboard ──────────────────
  if (!user && pathname.startsWith('/dashboard')) {
    const redirectUrl = new URL('/auth/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // ── Usuário autenticado tentando acessar rotas de auth ────────────────────
  // EXCEÇÕES (não redirecionar):
  //   • /auth/register — signUp() cria sessão antes do perfil existir
  //   • /auth/pending  — página de "aguardando aprovação" (não logar em loop)
  if (user && isPublicPath) {
    const shouldRedirect =
      pathname.startsWith('/auth/') &&
      !pathname.startsWith('/auth/register') &&
      !pathname.startsWith('/auth/pending');

    if (shouldRedirect) {
      // Antes de redirecionar para o dashboard, garantir que está aprovado
      // para não criar loop: login → dashboard → pending_approval → login
      const { data: profile } = await supabase
        .from('profiles')
        .select('approved, company_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile || !profile.approved || !profile.company_id) {
        // Usuário autenticado mas não aprovado — deixa passar pela rota de auth,
        // a página de login vai fazer signOut() e exibir a mensagem correta
        return response;
      }

      return NextResponse.redirect(new URL('/dashboard/schedule', request.url));
    }
  }

  // ── Verificar aprovação para rotas do dashboard ───────────────────────────
  if (user && pathname.startsWith('/dashboard')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('approved, company_id')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) {
      // Perfil não existe — faz signOut e redireciona para login
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL('/auth/login?error=no_profile', request.url));
    }

    if (!profile.approved) {
      // NÃO redirecionar para /auth/login — causaria loop!
      // Redireciona para /auth/pending (página dedicada, rota pública)
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL('/auth/pending', request.url));
    }

    if (!profile.company_id) {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL('/auth/login?error=no_company', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/auth/:path*',
    '/f/:path*',
    '/confirm-appointment/:path*',
    '/review-appointment/:path*',
    '/feedback/:path*'
  ],
};
