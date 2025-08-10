// app/admin/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useUser, useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from "next/navigation";

// 타입 정의
type UserMeta = {
  user_id: string;
  name: string | null;
  is_admin: boolean | null;
  banned: boolean | null;
  ban_reason: string | null;
  ip: string | null;
  device_type: string | null;
  last_login_at: string | null;
  last_boost_at: string | null;
};

type IpLog = {
  ip: string;
  created_at: string;
};

export default function AdminPage() {
  const supabase = useSupabaseClient();
  const user = useUser();
  const router = useRouter();

  const [users, setUsers] = useState<UserMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [ipLogs, setIpLogs] = useState<Record<string, IpLog[]>>({});
  const [fetchingLogs, setFetchingLogs] = useState<Record<string, boolean>>({});

  // ✅ 관리자 인증 & 유저 로드
  useEffect(() => {
    const init = async () => {
      if (!user) {
        setAuthChecking(false);
        return;
      }

      const { data: meta, error: adminErr } = await supabase
        .from("user_meta")
        .select("is_admin")
        .eq("user_id", user.id)
        .single();

      if (adminErr) {
        alert("관리자 확인 중 오류가 발생했습니다.");
        router.push("/");
        return;
      }

      if (!meta?.is_admin) {
        alert("🚫 관리자만 접근할 수 있습니다.");
        router.push("/");
        return;
      }

      setAuthChecking(false);

      const { data: allUsers, error } = await supabase
        .from("user_meta")
        .select(
          "user_id, name, is_admin, banned, ban_reason, ip, device_type, last_login_at, last_boost_at"
        )
        .order("last_login_at", { ascending: false, nullsFirst: false });

      if (error) {
        alert("유저 목록을 불러오지 못했습니다: " + error.message);
        setLoading(false);
        return;
      }

      setUsers((allUsers as UserMeta[]) || []);
      setLoading(false);
    };

    init();
  }, [user, supabase, router]);

  // ✅ 선택 유저의 IP 로그 로드 (중복 제거, 최대 10개)
  useEffect(() => {
    const loadIpLogs = async () => {
      if (!selectedUserId) return;
      if (ipLogs[selectedUserId]) return;

      setFetchingLogs((prev) => ({ ...prev, [selectedUserId]: true }));

      const { data, error } = await supabase
        .from("ip_logs")
        .select("ip, created_at")
        .eq("user_id", selectedUserId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        const seen = new Set<string>();
        const uniqueLogs: IpLog[] = [];
        for (const log of data as IpLog[]) {
          if (!seen.has(log.ip)) {
            seen.add(log.ip);
            uniqueLogs.push(log);
            if (uniqueLogs.length >= 10) break;
          }
        }
        setIpLogs((prev) => ({ ...prev, [selectedUserId]: uniqueLogs }));
      }
      setFetchingLogs((prev) => ({ ...prev, [selectedUserId]: false }));
    };

    loadIpLogs();
  }, [selectedUserId, supabase, ipLogs]);

  // ✅ 밴 토글 (+ 관리자 보호 + 사유 입력/초기화)
  const toggleBan = async (
    userId: string,
    current: boolean | null | undefined,
    currentReason: string | null | undefined
  ) => {
    // 🔒 관리자 계정은 밴 불가
    const target = users.find((x) => x.user_id === userId);
    if (target?.is_admin) {
      alert("관리자 계정은 밴할 수 없습니다.");
      return;
    }

    const nextValue = !Boolean(current);

    let ban_reason: string | null = currentReason ?? null;
    if (nextValue) {
      // 밴으로 전환 → 사유 입력
      const input = prompt(
        "밴 사유를 입력하세요 (예: 욕설, 사기, 중복 계정 등):",
        ban_reason || ""
      );
      if (!input || !input.trim()) {
        alert("밴 사유를 입력해야 합니다.");
        return;
      }
      ban_reason = input.trim();
    } else {
      // 해제 → 사유 초기화
      ban_reason = null;
    }

    const { error } = await supabase
      .from("user_meta")
      .update({ banned: nextValue, ban_reason })
      .eq("user_id", userId);

    if (error) {
      alert("❌ 변경 실패: " + error.message);
    } else {
      alert(`✅ ${nextValue ? "밴 완료" : "밴 해제"}되었습니다`);
      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === userId ? { ...u, banned: nextValue, ban_reason } : u
        )
      );
    }
  };

  // ✅ 검색 (닉네임/ID/IP/밴사유)
  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const name = (u.name || "").toLowerCase();
      const id = (u.user_id || "").toLowerCase();
      const ip = (u.ip || "").toLowerCase();
      const reason = (u.ban_reason || "").toLowerCase();
      return name.includes(q) || id.includes(q) || ip.includes(q) || reason.includes(q);
    });
  }, [users, search]);

  if (authChecking || loading) {
    return <div className="p-6 text-white">⏳ 관리자 인증 및 데이터 로딩 중...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-10 text-white">
      <h1 className="text-3xl font-bold mb-4">👮 관리자 페이지</h1>

      {/* 검색 */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="닉네임, ID, IP, 밴사유 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md p-3 rounded-md bg-white text-black placeholder-gray-500 shadow-md outline-none"
        />
      </div>

      {/* 유저 목록 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">👥 유저 목록</h2>
          <span className="text-sm text-gray-300">총 {filteredUsers.length}명</span>
        </div>

        <table className="w-full border-collapse text-sm overflow-hidden rounded-md">
          <thead className="bg-gray-200 text-black">
            <tr>
              <th className="p-2 text-left">닉네임</th>
              <th className="p-2 text-center">밴 여부</th>
              <th className="p-2 text-center">조치</th>
              <th className="p-2 text-center">IP</th>
              <th className="p-2 text-center">기기</th>
              <th className="p-2 text-center">상세보기</th>
            </tr>
          </thead>
          <tbody className="bg-gray-900">
            {filteredUsers.map((u) => {
              const isOpen = selectedUserId === u.user_id;
              const logs = ipLogs[u.user_id] || [];
              const isLoadingLogs = fetchingLogs[u.user_id];

              return (
                <React.Fragment key={u.user_id}>
                  <tr className="border-b border-gray-700">
                    <td className="p-2 break-all">
                      {u.name || "(미입력)"}{" "}
                      {u.is_admin ? (
                        <span className="ml-2 text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">
                          관리자
                        </span>
                      ) : null}
                    </td>
                    <td className="p-2 text-center">
                      {u.banned ? "🚫 밴됨" : "✅ 정상"}
                      {u.banned && u.ban_reason ? (
                        <span className="ml-1 text-xs text-gray-400">({u.ban_reason})</span>
                      ) : null}
                    </td>
                    <td className="p-2 text-center">
                      <button
                        onClick={() => toggleBan(u.user_id, u.banned, u.ban_reason)}
                        disabled={u.is_admin === true} // 🔒 관리자면 버튼 비활성화
                        title={u.is_admin ? "관리자 계정은 밴할 수 없습니다." : ""}
                        className={`px-3 py-1 rounded text-white ${
                          u.banned ? "bg-green-500" : "bg-red-500"
                        } ${u.is_admin ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        {u.banned ? "해제" : "밴"}
                      </button>
                    </td>
                    <td className="p-2 text-center break-all">{u.ip || "-"}</td>
                    <td className="p-2 text-center">{u.device_type || "-"}</td>
                    <td className="p-2 text-center">
                      <button
                        onClick={() => setSelectedUserId(isOpen ? null : u.user_id)}
                        className="text-blue-400 underline hover:text-blue-300"
                      >
                        {isOpen ? "닫기" : "상세보기"}
                      </button>
                    </td>
                  </tr>

                  {/* 상세보기 확장 */}
                  {isOpen && (
                    <tr>
                      <td colSpan={6} className="bg-gray-800 p-4">
                        <div className="bg-gray-900 border border-gray-700 rounded-md p-4 text-sm space-y-3 text-white shadow-md">
                          <div>
                            <span className="font-medium">🕓 마지막 로그인:</span>{" "}
                            {u.last_login_at
                              ? new Date(u.last_login_at).toLocaleString("ko-KR")
                              : "없음"}
                          </div>
                          <div>
                            <span className="font-medium">🚀 마지막 끌어올림:</span>{" "}
                            {u.last_boost_at
                              ? new Date(u.last_boost_at).toLocaleString("ko-KR")
                              : "없음"}
                          </div>
                          <div>
                            <span className="font-medium">🧭 기기 종류:</span>{" "}
                            {u.device_type || "없음"}
                          </div>
                          <div>
                            <span className="font-medium">🌐 IP 주소:</span>{" "}
                            {u.ip || "없음"}
                          </div>
                          <div>
                            <span className="font-medium">📌 밴 사유:</span>{" "}
                            {u.ban_reason || "없음"}
                          </div>

                          {/* IP 변경 로그 */}
                          <div>
                            <div className="font-semibold mt-2 mb-1 text-orange-300">
                              📜 최근 IP 변경 기록 (중복 제거, 최대 10개):
                            </div>

                            {isLoadingLogs ? (
                              <p className="text-sm text-gray-400">불러오는 중...</p>
                            ) : logs.length > 0 ? (
                              <ul className="list-disc pl-5 space-y-1 text-gray-300">
                                {logs.map((log, idx) => (
                                  <li key={`${log.ip}-${idx}`}>
                                    {log.ip}{" "}
                                    <span className="text-xs text-gray-400">
                                      ({new Date(log.created_at).toLocaleString("ko-KR")})
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-gray-400">기록 없음</p>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
