/**
 * Utilidades de CAPTCHA (Cloudflare Turnstile) para o Supabase Auth.
 *
 * Configuração:
 *  - NEXT_PUBLIC_TURNSTILE_SITE_KEY deve estar definida no ambiente do app
 *  - No Supabase: Authentication → Attack Protection → CAPTCHA
 *    escolher "Cloudflare Turnstile" e preencher Site Key + Secret Key.
 */

export function getTurnstileSiteKey(): string {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';
}

export function isCaptchaEnabled(): boolean {
  // CAPTCHA temporariamente desativado até o Turnstile funcionar corretamente
  // em produção. Para reativar: remover o `false` abaixo.
  return false;
}

/**
 * Retorna as options de CAPTCHA para as chamadas de auth do Supabase.
 * Se não houver token, retorna undefined para que o SDK não envie captcha_token.
 */
export function captchaAuthOptions(captchaToken: string | null) {
  return captchaToken ? { captchaToken } : undefined;
}

export function captchaRequiredError(): string {
  return 'Resolva o CAPTCHA para continuar.';
}
