import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const createServerClient = () => {
  const cookieStore = cookies();

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const store = await cookieStore;
          return store.get(name)?.value;
        },
      },
    }
  );
};

export const getSession = async () => {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

export const getUser = async () => {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const getUserProfile = async () => {
  const supabase = createServerClient();
  const user = await getUser();
  
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, companies(*)')
    .eq('id', user.id)
    .single();

  return profile;
};
