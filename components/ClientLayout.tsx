'use client';

import React, { useEffect } from 'react';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const user = useUser();
  const supabase = useSupabaseClient();
  const router = useRouter();

  // ✅ 로그인 기록(트래킹) - 이전에 붙인 코드 유지
  useEffect(() => {
    if (!user) return;
    const KEY = 'track-login:last';
    const last = Number(localStorage.getItem(KEY) || 0);
    const now = Date.now();
    if (now - last < 60_000) return;
    (async () => {
      try {
        const res = await fetch('/api/track-login', { method: 'POST' });
        if (res.ok) localStorage.setItem(KEY, String(now));
      } catch {}
    })();
  }, [user]);

  // ✅ 밴 체크: 로그인 잡히면 즉시 검사 → 밴이면 로그아웃 + /banned 이동
  useEffect(() => {
    if (!user) return;

    let aborted = false;
    (async () => {
      const { data, error } = await supabase
        .from('user_meta')
        .select('banned, ban_reason, is_admin')
        .eq('user_id', user.id)
        .single();

      if (aborted || error) return;

      if (data?.banned && !data?.is_admin) {
        // 안내 메시지(선택)
        if (typeof window !== 'undefined') {
          const reason = data?.ban_reason ? `\n사유: ${data.ban_reason}` : '';
          alert(`접속이 제한되었습니다.${reason}`);
        }
        await supabase.auth.signOut();
        router.push('/banned');
      }
    })();

    return () => {
      aborted = true;
    };
  }, [user, supabase, router]);

  return (
    <>
      <Header />
      <main className="min-h-screen pt-14 bg-[#0f0f0f] text-white">
        {children}
      </main>
    </>
  );
}
