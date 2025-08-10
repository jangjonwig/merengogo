'use client';

import Link from "next/link";
import Image from "next/image";
import { useUser, useSupabaseClient } from "@supabase/auth-helpers-react";
import { useEffect, useState, useRef } from "react";
import { sendFeedbackToDiscord } from "@/utils/sendFeedback";

type Item = {
  id: number;
  game_item_id: number;
  item_name: string;
  item_image: string;
  price: number;
  deal_type: "buy" | "sell";
  is_visible: boolean;
  created_at: string;
  boosted_at?: string; // ✅ 추가
  comment?: string;
  delivery_method?: "택배" | "자유시장";
  discord_name?: string;
  discord_avatar_url?: string;
  quantity?: number;
  negotiation?: boolean; // ✅ 가격 흥정 여부 (true=가능)
};

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString); // UTC → KST 자동 변환
  const now = new Date();

  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "방금 전";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}일 전`;
}

export default function ProfilePage() {
  const user = useUser();
  const supabase = useSupabaseClient();

  // ✅ 항상 원시값으로 추적할 userId 추출 (의존성 고정화)
  const userId = user?.id ?? null;

  const [showModal, setShowModal] = useState(false);
  const [feedback, setFeedback] = useState("");

  const [buyItems, setBuyItems] = useState<Item[]>([]);
  const [sellItems, setSellItems] = useState<Item[]>([]);
  const [editingName, setEditingName] = useState(false);
  const [nickname, setNickname] = useState("");
  const [newNickname, setNewNickname] = useState("");
  const [canEditNickname, setCanEditNickname] = useState(true);

  // ✅ 닉네임/편집 가능 여부 로드 (deps 고정: [userId])
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data, error } = await supabase
        .from("user_meta")
        .select("name, nickname_edited")
        .eq("user_id", userId)
        .single();

      if (error) {
        console.warn("user_meta fetch error:", error.message);
        return;
      }
      if (data) {
        setNickname(data.name || "");
        setNewNickname(data.name || "");
        setCanEditNickname(!data.nickname_edited);
      }
    })();
  }, [userId, supabase]); // supabase 인스턴스는 안정적이지만 명시 유지(길이 고정)

  const updateNickname = async () => {
    const { error: authError } = await supabase.auth.updateUser({
      data: { name: newNickname },
    });
    if (authError) {
      alert("❌ 닉네임 저장 실패: " + authError.message);
      return;
    }

    if (!userId) return;

    const { error: metaError } = await supabase
      .from("user_meta")
      .update({ name: newNickname, nickname_edited: true })
      .eq("user_id", userId);

    if (metaError) {
      alert("❌ user_meta 저장 실패: " + metaError.message);
      return;
    }

    alert("✅ 닉네임이 변경되었습니다!");
    setNickname(newNickname);
    setEditingName(false);
    setCanEditNickname(false);
  };

  // =========================
  // ✅ 부스트 쿨다운 체크 함수 (userId 사용)
  // =========================
  // 마지막 부스트(user_meta.last_boost_at) + 내 최신 아이템 등록(created_at) + localStorage
  // 중 가장 최근 시각을 기준으로 1시간 쿨다운 계산
  const checkBoostCooldown = async (): Promise<{ canBoost: boolean; minutesLeft: number }> => {
    if (!userId) return { canBoost: false, minutesLeft: 60 };

    // 1) user_meta.last_boost_at
    const { data: meta } = await supabase
      .from("user_meta")
      .select("last_boost_at")
      .eq("user_id", userId)
      .single();

    // 2) 내 최신 아이템 created_at (활성만 포함하려면 .eq("status","active") 추가)
    const { data: latestItem } = await supabase
      .from("items")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // 3) localStorage (브라우저 보조 쿨다운)
    const ls = typeof window !== "undefined" ? localStorage.getItem("lastBoostTime") : null;
    const lsTime = ls ? Number(ls) : 0;

    const lastBoostAt = meta?.last_boost_at ? new Date(meta.last_boost_at).getTime() : 0;
    const newestCreatedAt = latestItem?.created_at ? new Date(latestItem.created_at).getTime() : 0;
    const latestEvent = Math.max(lastBoostAt, newestCreatedAt, lsTime);

    if (!latestEvent) return { canBoost: true, minutesLeft: 0 };

    const ONE_HOUR = 60 * 60 * 1000;
    const now = Date.now();
    const diff = now - latestEvent;

    if (diff >= ONE_HOUR) return { canBoost: true, minutesLeft: 0 };
    return { canBoost: false, minutesLeft: Math.ceil((ONE_HOUR - diff) / 60000) };
  };

  // ✅ 아이템 불러오기 (uid 인자로 받아 의존성 안정화)
  const fetchItems = async (uid: string) => {
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .eq("user_id", uid)
      .order("boosted_at", { ascending: false }) // ✅ 최신 순
      .limit(100); // ✅ 캐시 회피

    if (error) {
      console.error("❌ 아이템 불러오기 실패:", error.message);
      return;
    }

    const buy = (data || []).filter((item) => item.deal_type === "buy");
    const sell = (data || []).filter((item) => item.deal_type === "sell");
    setBuyItems(buy);
    setSellItems(sell);
  };

  // ✅ 최초/로그인 변화 시 아이템 로드 (deps 고정: [userId])
  useEffect(() => {
    if (!userId) return;
    fetchItems(userId);
  }, [userId, supabase]); // 길이 고정

  // =========================
  // ✅ handleBoostItems (신규 쿨다운 로직 적용, userId 사용)
  // =========================
  const handleBoostItems = async () => {
    if (!userId) return;

    // 최근 이벤트(마지막 부스트, 최신 아이템 등록, localStorage) 기준으로 체크
    const { canBoost, minutesLeft } = await checkBoostCooldown();
    if (!canBoost) {
      alert(`❌ 아직 ${minutesLeft}분 남았습니다. 1시간 후 다시 시도해주세요.`);
      return;
    }

    const nowIso = new Date().toISOString();
    const nowMs = Date.now();

    // 1) 내 활성 아이템 모두 boosted_at 갱신
    const { error: boostErr } = await supabase
      .from("items")
      .update({ boosted_at: nowIso })
      .eq("user_id", userId)
      .eq("status", "active");

    if (boostErr) {
      alert("❌ 끌어올리기 실패: " + boostErr.message);
      return;
    }

    // 2) user_meta.last_boost_at 업데이트 (서버 기준 글로벌 쿨다운)
    const { error: metaErr } = await supabase
      .from("user_meta")
      .update({ last_boost_at: nowIso })
      .eq("user_id", userId);
    if (metaErr) {
      console.warn("user_meta 업데이트 실패:", metaErr.message);
    }

    // 3) localStorage 보조 쿨다운 (캐시/새 브라우저 우회 방지)
    if (typeof window !== "undefined") {
      localStorage.setItem("lastBoostTime", String(nowMs));
    }

    alert("✅ 끌어올리기 완료!");
    await fetchItems(userId);
  };

  const handleItemDeleted = (itemId: number) => {
    setBuyItems((prev) => prev.filter((i) => i.game_item_id !== itemId));
    setSellItems((prev) => prev.filter((i) => i.game_item_id !== itemId));
  };

  const discordId = user?.user_metadata?.provider_id;
  const avatarHash = user?.user_metadata?.avatar;
  const avatar = avatarHash
    ? `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.png`
    : "https://cdn.discordapp.com/embed/avatars/0.png";

  if (!user) {
    return <div className="text-center mt-10 text-red-500">🔒 로그인이 필요합니다.</div>;
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto mt-24 px-6 gap-8 flex bg-[#0f0f0f]">

      {/* 좌측 프로필 */}
      <div className="w-[280px] bg-[#1a1a1a] p-5 rounded-2xl shadow-lg">
        <div className="flex flex-col items-center text-center">
          <Image src={avatar} alt="프로필" width={80} height={80} className="rounded-full mb-3 shadow" />
          <h2 className="text-xl font-bold text-white mb-1">{nickname}</h2>
          <p className="text-sm text-gray-400">{user.email ?? "이메일 없음"}</p>
        </div>

        <Link href="/item/new" className="block mt-6">
          <button className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition">
            아이템 등록
          </button>
        </Link>

        <div className="mt-2 w-full">
          {canEditNickname ? (
            editingName ? (
              <div className="flex flex-col items-center">
                <input
                  value={newNickname}
                  onChange={(e) => setNewNickname(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-xl bg-[#2a2a2a] text-white border border-gray-600 mb-2"
                />
                <div className="flex gap-2 w-full">
                  <button
                    onClick={updateNickname}
                    className="w-1/2 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => {
                      setEditingName(false);
                      setNewNickname(nickname);
                    }}
                    className="w-1/2 py-2 rounded-xl bg-gray-600 hover:bg-gray-700 text-white font-semibold"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setEditingName(true)}
                className="w-full py-2 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-semibold transition"
              >
                닉네임 수정
              </button>
            )
          ) : (
            <button
              disabled
              className="w-full py-2 rounded-xl bg-gray-800 text-gray-500 font-semibold cursor-not-allowed"
            >
              닉네임 수정 불가
            </button>
          )}
        </div>

        {/* ───────── 추가: 건의사항 / 공지사항 / 이용규칙 버튼 ───────── */}
        <div className="mt-2 space-y-2">
          <button
            onClick={() => setShowModal(true)}
            className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition"
          >
            건의사항
          </button>

          <Link href="/notice" className="block">
            <button className="w-full py-2 rounded-xl bg-red-500 hover:bg-yellow-600 text-white font-semibold transition">
              공지사항
            </button>
          </Link>

          <Link href="/notice/3" className="block">
            <button className="w-full py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition">
              이용규칙
            </button>
          </Link>
        </div>
      </div>

      {/* 건의사항 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4 text-gray-900">건의사항 보내기</h2>

            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="건의하실 내용을 작성해주세요"
              className="w-full h-32 p-3 border border-gray-300 rounded-xl resize-none text-black outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-gray-500">{feedback.length}자</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold"
                >
                  취소
                </button>
                <button
                  disabled={feedback.trim().length === 0}
                  onClick={async () => {
                    try {
                      await sendFeedbackToDiscord(
                        feedback.trim(),
                        nickname || user?.user_metadata?.global_name || "익명"
                      );
                      alert("건의사항이 전송되었습니다!");
                      setFeedback("");
                      setShowModal(false);
                    } catch {
                      alert("전송에 실패했습니다.");
                    }
                  }}
                  className={`px-4 py-2 rounded-xl font-semibold text-white ${
                    feedback.trim().length === 0
                      ? "bg-emerald-300 cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  전송
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 우측 아이템 영역 */}
      <div className="flex-1 flex flex-col gap-5">
        <div className="bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-200 text-black px-5 py-4 rounded-xl shadow border border-yellow-300 font-semibold text-sm">
          📢 [공지] 메렌고고 거래 규칙을 꼭 확인해주세요.
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleBoostItems}
            className="px-5 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm shadow transition"
          >
            🚀 끌어올리기
          </button>
        </div>

        <div className="flex gap-5">
          {/* 삽니다 */}
          <div className="flex-1 bg-[#1d1d1d] rounded-2xl p-5 border border-green-600 shadow-sm">
            <h2 className="text-white font-bold text-base bg-green-600 px-3 py-1 rounded inline-block mb-4">
              삽니다 ({buyItems.length})
            </h2>
            {buyItems.length === 0 ? (
              <p className="text-gray-400 text-sm">등록된 삽니다 항목이 없습니다.</p>
            ) : (
              <ul className="space-y-3">
                {buyItems.map((item) => (
                  <ProfileItem key={item.id} item={item} onDeleted={handleItemDeleted} nickname={nickname} />
                ))}
              </ul>
            )}
          </div>
          {/* 팝니다 */}
          <div className="flex-1 bg-[#1d1d1d] rounded-2xl p-5 border border-blue-600 shadow-sm">
            <h2 className="text-white font-bold text-base bg-blue-600 px-3 py-1 rounded inline-block mb-4">
              팝니다 ({sellItems.length})
            </h2>
            {sellItems.length === 0 ? (
              <p className="text-gray-400 text-sm">등록된 팝니다 항목이 없습니다.</p>
            ) : (
              <ul className="space-y-3">
                {sellItems.map((item) => (
                  <ProfileItem key={item.id} item={item} onDeleted={handleItemDeleted} nickname={nickname} />
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ItemToggle({ itemId, initialVisible }: { itemId: number; initialVisible: boolean }) {
  const [visible, setVisible] = useState(initialVisible);
  const supabase = useSupabaseClient();
  const user = useUser(); // ✅ 현재 로그인 유저 가져오기

  const toggleVisibility = async () => {
    const newState = !visible;
    setVisible(newState);
    const { error } = await supabase
      .from("items")
      .update({ is_visible: newState })
      .eq("id", itemId)               // ✅ item_id → id
      .eq("user_id", user?.id ?? ""); // ✅ RLS 안전(선택)
    if (error) {
      alert("❌ 변경 실패: " + error.message);
      setVisible(!newState);
    }
  };

  return (
    <button
      onClick={toggleVisibility}
      className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
        visible ? "bg-green-500 hover:bg-green-600 text-white" : "bg-gray-600 hover:bg-gray-500 text-white"
      }`}
    >
      {visible ? "ON" : "OFF"}
    </button>
  );
}

function ProfileItem({
  item,
  onDeleted,
  nickname,
}: {
  item: Item;
  onDeleted: (itemId: number) => void;
  nickname: string;
}) {
  const supabase = useSupabaseClient();
  const displayName = nickname || item.discord_name || "닉네임 없음";

  const [showMenu, setShowMenu] = useState(false);

  // ✅ 화면 표시에 쓰는 로컬 상태(저장 성공 시 여기 값을 바꿔서 즉시 반영)
  const [localPrice, setLocalPrice] = useState(item.price);
  const [localComment, setLocalComment] = useState(item.comment ?? "");
  const [localDeliveryMethod, setLocalDeliveryMethod] =
    useState<"택배" | "자유시장" | undefined>(item.delivery_method);

  // ✅ 편집 입력 상태
  const [editingPrice, setEditingPrice] = useState(false);
  const [editingComment, setEditingComment] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState(false);
  const [newPrice, setNewPrice] = useState(localPrice);
  const [newComment, setNewComment] = useState(localComment);
  const [newDeliveryMethod, setNewDeliveryMethod] =
    useState<"택배" | "자유시장">(localDeliveryMethod ?? "택배");

  // ✅ 드롭다운 바깥 클릭/ESC 닫기
  const containerRef = useRef<HTMLLIElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  const handleDelete = async () => {
    if (!confirm("정말로 삭제하시겠습니까?")) return;
    const { error } = await supabase.from("items").delete().eq("id", item.id);
    if (error) alert("❌ 삭제 실패: " + error.message);
    else {
      alert("✅ 삭제 완료!");
      onDeleted(item.game_item_id);
    }
  };

  const handleComplete = async () => {
    if (!confirm("거래를 완료 처리하시겠습니까?")) return;
    const { error } = await supabase.from("items").delete().eq("id", item.id);
    if (error) alert("❌ 거래 완료 처리 실패: " + error.message);
    else {
      alert("✅ 거래가 완료되었습니다!");
      onDeleted(item.game_item_id);
    }
  };

  const handlePriceSave = async () => {
    if (isNaN(newPrice) || newPrice <= 0) {
      alert("올바른 가격을 입력해주세요.");
      return;
    }
    const { error } = await supabase.from("items").update({ price: newPrice }).eq("id", item.id);
    if (error) {
      alert("❌ 가격 변경 실패: " + error.message);
    } else {
      setLocalPrice(newPrice); // ✅ 화면 즉시 갱신
      setEditingPrice(false);
      alert("✅ 가격이 변경되었습니다!");
    }
  };

  const handleCommentSave = async () => {
    const { error } = await supabase.from("items").update({ comment: newComment }).eq("id", item.id);
    if (error) {
    alert("❌ 코멘트 수정 실패: " + error.message);
    } else {
      setLocalComment(newComment); // ✅ 화면 즉시 갱신
      setEditingComment(false);
      alert("✅ 코멘트가 수정되었습니다!");
    }
  };

  const handleDeliverySave = async () => {
    const { error } = await supabase.from("items").update({ delivery_method: newDeliveryMethod }).eq("id", item.id);
    if (error) {
      alert("❌ 거래방식 변경 실패: " + error.message);
    } else {
      setLocalDeliveryMethod(newDeliveryMethod); // ✅ 화면 즉시 갱신
      setEditingDelivery(false);
      alert("✅ 거래방식이 변경되었습니다!");
    }
  };

  return (
    <li
      ref={containerRef}
      className="relative flex items-start gap-4 p-3 bg-[#2a2a2a] rounded-xl shadow hover:bg-[#333] transition"
    >
      <img src={item.item_image} alt={item.item_name} className="w-12 h-12 object-cover rounded shadow" />

      <div className="flex flex-col text-sm flex-1 min-w-0">
        <div className="text-white font-semibold truncate">{item.item_name}</div>

        {editingPrice ? (
          <div className="flex gap-2 mt-1">
            <input
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(Number(e.target.value))}
              className="w-24 px-2 py-1 rounded bg-[#1f1f1f] text-white border border-gray-600"
            />
            <button onClick={handlePriceSave} className="text-sm px-2 py-1 rounded bg-green-600 hover:bg-green-700 text-white">
              저장
            </button>
            <button
              onClick={() => {
                setEditingPrice(false);
                setNewPrice(localPrice);
              }}
              className="text-sm px-2 py-1 rounded bg-gray-600 hover:bg-gray-700 text-white"
            >
              취소
            </button>
          </div>
        ) : (
          <p className="text-sm mt-1 flex items-center gap-1">
            <span className="text-yellow-400 font-bold">{localPrice.toLocaleString()}</span>
            <img src="/items/월코.png" alt="월드코인" className="inline w-4 h-4 align-middle" />
          </p>
        )}

        {item.quantity !== undefined && item.quantity > 0 && (
          <p className="text-gray-400 text-xs mt-1">수량: {item.quantity}개</p>
        )}

        {editingComment ? (
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-36 px-2 py-1 text-sm rounded bg-[#1f1f1f] text-white border border-gray-600"
            />
            <button onClick={handleCommentSave} className="text-sm px-2 py-1 rounded bg-green-600 hover:bg-green-700 text-white">
              저장
            </button>
            <button
              onClick={() => {
                setEditingComment(false);
                setNewComment(localComment);
              }}
              className="text-sm px-2 py-1 rounded bg-gray-600 hover:bg-gray-700 text-white"
            >
              취소
            </button>
          </div>
        ) : (
          (localDeliveryMethod || localComment) && (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {localDeliveryMethod && (
                <span className="bg-red-500 text-white text-xs px-2 py-[2px] rounded">{localDeliveryMethod}</span>
              )}
              {localComment && (
                <span
                  className="border border-white text-white text-xs px-2 py-[2px] rounded bg-transparent max-w-[120px] truncate"
                  title={localComment}
                >
                  {localComment}
                </span>
              )}
              {/* ✅ 흥정가능/불가 배지 */}
              {item.negotiation !== undefined && (
                <span
                  className={`text-white text-xs px-2 py-[2px] rounded ${
                    item.negotiation ? "bg-emerald-600" : "bg-gray-600"
                  }`}
                >
                  {item.negotiation ? "흥정가능" : "흥정불가"}
                </span>
              )}
            </div>
          )
        )}

        {editingDelivery && (
          <div className="flex gap-2 mt-2">
            <select
              value={newDeliveryMethod}
              onChange={(e) => setNewDeliveryMethod(e.target.value as "택배" | "자유시장")}
              className="px-2 py-1 text-sm bg-[#1f1f1f] text-white border border-gray-600 rounded"
            >
              <option value="택배">택배</option>
              <option value="자유시장">자유시장</option>
            </select>
            <button onClick={handleDeliverySave} className="text-sm px-2 py-1 rounded bg-green-600 hover:bg-green-700 text-white">
              저장
            </button>
            <button onClick={() => setEditingDelivery(false)} className="text-sm px-2 py-1 rounded bg-gray-600 hover:bg-gray-700 text-white">
              취소
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          {item.discord_avatar_url && <img src={item.discord_avatar_url} alt="discord" className="w-5 h-5 rounded-full" />}
          <span className="text-xs text-gray-300 truncate max-w-[80px]">{displayName}</span>
        </div>

        <div className="flex gap-1 relative">
          <ItemToggle itemId={item.id} initialVisible={item.is_visible} />
          <button
            onClick={(e) => {
              e.stopPropagation(); // 클릭 전파 방지
              setShowMenu((prev) => !prev);
            }}
            className="px-2 py-1 rounded text-xs bg-gray-700 hover:bg-gray-600 text-white transition"
          >
            관리
          </button>

          {showMenu && (
            <div className="absolute z-50 top-full right-0 mt-1 w-40 bg-[#1f1f1f] text-white rounded-xl shadow-lg border border-gray-700 overflow-hidden">
              <button
                onClick={() => {
                  setShowMenu(false);
                  setTimeout(() => setEditingDelivery(true), 0);
                }}
                className="w-full px-4 py-2 text-sm hover:bg-gray-700 text-left"
              >
                📦 거래방식 변경
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  setTimeout(() => setEditingComment(true), 0);
                }}
                className="w-full px-4 py-2 text-sm hover:bg-gray-700 text-left"
              >
                💬 코멘트 수정
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  setTimeout(() => setEditingPrice(true), 0);
                }}
                className="w-full px-4 py-2 text-sm hover:bg-gray-700 text-left"
              >
                💸 가격 변경
              </button>
              <hr className="border-gray-600" />
              <button onClick={handleComplete} className="w-full px-4 py-2 text-sm hover:bg-gray-700 text-left">
                ✅ 완료
              </button>
              <button onClick={handleDelete} className="w-full px-4 py-2 text-sm text-red-400 hover:bg-gray-700 text-left">
                🗑 삭제
              </button>
            </div>
          )}
        </div>

        {/* ✅ boosted_at → created_at 순으로 시간 계산 (네 기존 로직 유지) */}
        <p className="text-[11px] text-gray-400">
          {getTimeAgo(typeof item.boosted_at === "string" ? item.boosted_at : item.created_at)}
        </p>
        {/* ✅ 아이템 상세 바로가기 */}
        <Link
          href={`/item/${item.game_item_id}`} // 상세 경로가 다르면 여기만 바꿔줘
          className="text-[11px] px-2 py-1 rounded border border-gray-700 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white transform translate-x-[6px]"
        >
          거래목록
        </Link>
      </div>
    </li>
  );
}
