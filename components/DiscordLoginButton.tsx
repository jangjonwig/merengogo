'use client';

import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';

export default function DiscordLoginButton() {
  const supabase = useSupabaseClient();
  const user = useUser();

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (user)
    return (
      <button
        onClick={handleLogout}
        className="text-sm bg-red-500 hover:bg-red-600 px-3 py-1 rounded"
      >
        로그아웃
      </button>
    );

  return (
    <button
      onClick={handleLogin}
      className="text-sm bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded"
    >
      Discord 로그인
    </button>
  );
}
