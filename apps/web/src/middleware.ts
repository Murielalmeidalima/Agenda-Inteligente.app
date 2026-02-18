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
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // =====================================================
  // AUTHENTICATION & AUTHORIZATION
  // =====================================================
  
  const { data: { session } } = await supabase.auth.getSession();
  
  const publicPaths = [
    '/auth/login', 
    '/auth/register', 
    '/auth/forgot-password',
    '/auth/reset-password',
    '/f/', // Anamnese público
    '/confirm-appointment/',
    '/review-appointment/',
    '/feedback/'
  ];
  
  const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path));

  // Redirecionar usuários não autenticados tentando acessar o dashboard
  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    const redirectUrl = new URL('/auth/login', request.url);
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirecionar usuários autenticados tentando acessar páginas de auth
  if (session && isPublicPath && !request.nextUrl.pathname.startsWith('/f/')) {
    // Permitir rotas de anamnese pública mesmo para usuários autenticados
    if (request.nextUrl.pathname.startsWith('/auth/')) {
      return NextResponse.redirect(new URL('/dashboard/schedule', request.url));
    }
  }

  // Verificar aprovação do usuário para rotas do dashboard
  if (session && request.nextUrl.pathname.startsWith('/dashboard')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('approved, company_id')
      .eq('id', session.user.id)
      .maybeSingle();

    // Verificar se o perfil existe
    if (!profile) {
      // Usuário autenticado mas sem perfil - redirecionar para página de setup
      return NextResponse.redirect(new URL('/auth/login?error=no_profile', request.url));
    }

    // Verificar se está aprovado
    if (!profile.approved) {
      // Usuário não aprovado - permitir apenas acesso a página de espera
      if (request.nextUrl.pathname !== '/dashboard/pending-approval') {
        return NextResponse.redirect(new URL('/auth/login?error=pending_approval', request.url));
      }
    }

    // Verificar se tem empresa vinculada
    if (!profile.company_id) {
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
