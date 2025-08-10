'use client';

import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import SearchBarWithSelect from '@/components/SearchBarWithSelect';
import Link from 'next/link';

export default function Header() {
  const user = useUser();
  const supabase = useSupabaseClient();
  const pathname = usePathname();
  const router = useRouter();
  const showSearchBar = pathname !== '/';

  const [discordName, setDiscordName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false); // ✅ hydration mismatch 방지용
  const [nickname, setNickname] = useState<string | null>(null); // ✅ Supabase 저장된 닉네임
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchDiscordProfile = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.provider_token;

      if (accessToken) {
        const res = await fetch('https://discord.com/api/users/@me', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const discordUser = await res.json();

        if (discordUser && discordUser.username) {
          const avatar = discordUser.avatar
            ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
            : `https://cdn.discordapp.com/embed/avatars/${parseInt(discordUser.discriminator) % 5}.png`;

          const name = discordUser.global_name || discordUser.username;

          setDiscordName(name);
          setAvatarUrl(avatar);

          await supabase.auth.updateUser({
            data: {
              global_name: name,
              avatar_url: avatar,
            },
          });
        }
      }
    };

    const fetchNicknameFromDB = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('user_meta')
        .select('name')
        .eq('user_id', user.id)
        .single();

      if (!error && data?.name) {
        setNickname(data.name);
      }
    };

    if (user && !user.user_metadata?.global_name) {
      fetchDiscordProfile();
    } else if (user) {
      const fallbackAvatar = `https://cdn.discordapp.com/embed/avatars/${parseInt(user.user_metadata?.user_discriminator || '0') % 5}.png`;
      const safeAvatarUrl =
        user.user_metadata.avatar_url?.startsWith('http')
          ? user.user_metadata.avatar_url
          : fallbackAvatar;

      setDiscordName(user.user_metadata.global_name);
      setAvatarUrl(safeAvatarUrl);
    }

    fetchNicknameFromDB();
    setIsMounted(true);
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    location.reload();
  };

  const handleLogin = async () => {
    // 현재 열린 페이지의 오리진(로컬이면 localhost, 배포면 vercel 도메인)
const origin =
  typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_SITE_URL;

const redirectTo = `${origin}/auth/callback`;

await supabase.auth.signInWithOAuth({
  provider: 'discord',
  options: {
    redirectTo: 'https://merengogo.vercel.app/auth/callback',
  },
});

  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="w-full fixed top-0 left-0 right-0 z-50 bg-[#111] border-b border-[#222] shadow-sm">
      <div className="max-w-6xl mx-auto px-1 py-2 flex items-center justify-between">
        {/* 좌측 로고 */}
        <Link href="/" className="flex items-center gap-2">
          <img
            src="/logo/merengogo.png"
            alt="메렌고고 로고"
            className="w-8 h-8"
          />
          <span className="text-xl font-bold text-white font-maplestory">메렌고고</span>
        </Link>

        {/* 가운데 서치바 */}
        {showSearchBar && (
          <div className="flex flex-1 justify-center">
            <SearchBarWithSelect
              onSelect={(item) => {
                console.log('선택된 아이템:', item.name);
              }}
            />
          </div>
        )}

        {/* 우측 사용자 영역 */}
        <div className="flex items-center gap-3 relative" ref={menuRef}>
          {user && isMounted ? (
            <>
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 px-3 py-1 border border-gray-600 rounded hover:bg-gray-800 transition"
              >
                <img
                  src={avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                  alt="Avatar"
                  className="w-7 h-7 rounded-full border border-gray-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://cdn.discordapp.com/embed/avatars/0.png';
                  }}
                />
                <span className="text-sm text-white">{nickname ?? discordName ?? '...'}</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-12 w-32 bg-[#222] rounded shadow border border-gray-700 z-50">
                  <button
  onClick={() => {
    setMenuOpen(false);      // ✅ 드롭다운 닫기
    router.push('/profile'); // ✅ 페이지 이동
  }}
  className="block w-full px-4 py-2 text-sm text-left hover:bg-gray-700 text-white"
>
                    프로필
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block w-full px-4 py-2 text-sm text-left hover:bg-gray-700 text-white"
                  >
                    로그아웃
                  </button>
                </div>
              )}
            </>
          ) : (
            <button
              onClick={handleLogin}
              className="text-sm text-white border border-gray-600 px-4 py-2 rounded hover:bg-gray-800 transition"
            >
              디스코드로 로그인
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
