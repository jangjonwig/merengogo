'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function AuthCallback() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
        router.replace('/');
      } else {
        router.replace('/?login=failed');
      }
    };
    run();
  }, [router, supabase]);

  return <p className="p-6">로그인 처리 중…</p>;
}
