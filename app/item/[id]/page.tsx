"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useUser, useSupabaseClient } from "@supabase/auth-helpers-react";
import { sendFeedbackToDiscord, sendReportToDiscord } from "@/utils/sendFeedback";
import { uploadReportImage } from "@/lib/uploadImage";

// ───────────────────────────────────────────────────────────────
// 1) Placeholder (전용 기본이미지 권장)
// ───────────────────────────────────────────────────────────────
const PLACEHOLDER_IMAGE = "/items/placeholder.png"; // public/items/placeholder.png 추가 권장

// ───────────────────────────────────────────────────────────────
// 2) ID → 이름/파일 매핑 (itemDB와 동일하게 정정)
// ───────────────────────────────────────────────────────────────
const ITEM_META: Record<number, { name: string; file: string }> = {
  1:  { name: "월드코인(전체)",        file: "/items/월코.png" },
  2:  { name: "고성능 확성기",          file: "/items/고확.png" },
  3:  { name: "SP 초기화 주문서",       file: "/items/sp.png" },
  4:  { name: "AP 초기화 주문서",       file: "/items/ap.png" },
  5:  { name: "슬롯 확장권",            file: "/items/슬롯.png" },
  6:  { name: "펫장비(투명한리본)",     file: "/items/펫장비.png" },
  7:  { name: "5천 메이플 포인트",      file: "/items/5천.png" },
  8:  { name: "1만 메이플 포인트",      file: "/items/1만.png" },
  9:  { name: "3만 메이플 포인트",      file: "/items/3만.png" },
  10: { name: "호신부적",               file: "/items/호부.png" },
  11: { name: "생명의 물",              file: "/items/생물.png" },
  12: { name: "캐시 펫(품목선택)",       file: "/items/펫.png" },
  13: { name: "아바타 코디 반지 (30일)", file: "/items/코반.png" },
  14: { name: "아바타 코디 반지 (90일)", file: "/items/코반.png" },
};
// ───────────────────────────────────────────────────────────────
// 3) 이름 → 파일 매핑 (정확 명칭 + 흔한 별칭 추가)
// ───────────────────────────────────────────────────────────────
const itemImageMapExact: Record<string, string> = {
  "월드코인(전체)": "/items/월코.png",
  "월드코인": "/items/월코.png",

  "고성능 확성기": "/items/고확.png",

  "SP 초기화 주문서": "/items/sp.png",
  "SP 물약": "/items/sp.png", // 별칭

  "AP 초기화 주문서": "/items/ap.png",
  "AP 물약": "/items/ap.png", // 별칭

  "슬롯 확장권": "/items/슬롯.png",

  "호신부적": "/items/호부.png",
  "호부": "/items/호부.png", // 별칭

  "생명의 물": "/items/생물.png",
  "생물": "/items/생물.png", // 별칭

  "펫장비(투명한리본)": "/items/펫장비.png",
  "펫 장비": "/items/펫장비.png", // 별칭

  "캐시 펫(품목선택)": "/items/펫.png",
  "펫": "/items/펫.png", // 별칭

  "5천 메이플 포인트": "/items/5천.png",
  "1만 메이플 포인트": "/items/1만.png",
  "3만 메이플 포인트": "/items/3만.png",

  "아바타 코디 반지 (30일)": "/items/코반.png",
  "아바타 코디 반지 (90일)": "/items/코반.png",
  "코인 반지": "/items/코반.png", // 별칭
};


function getImageByName(name?: string) {
  const key = (name || "").trim();
  return itemImageMapExact[key] || PLACEHOLDER_IMAGE;
}

export default function ItemDetailPage() {
  const user = useUser();
  const supabase = useSupabaseClient();
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const numericId = Number(id);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportItemId, setReportItemId] = useState<number | null>(null);
  const [reportedUserId, setReportedUserId] = useState<string | null>(null);

  const [itemTrades, setItemTrades] = useState<any[]>([]);
  const [userMeta, setUserMeta] = useState<{ name: string } | null>(null);
  const [userMetasMap, setUserMetasMap] = useState<Record<string, { name: string; avatar_url?: string }>>({});
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const hasAvatar = user?.user_metadata?.avatar && user?.user_metadata?.user_id;
  const avatarUrl = hasAvatar
    ? `https://cdn.discordapp.com/avatars/${user!.user_metadata.user_id}/${user!.user_metadata.avatar}.png`
    : "https://cdn.discordapp.com/embed/avatars/0.png";

  function formatTimeAgo(dateString: string): string {
    if (!dateString) return "";
    const date = new Date(dateString);
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

  // 내 user_meta
  useEffect(() => {
    const fetchMyMeta = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from("user_meta")
        .select("name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) setUserMeta({ name: data.name });
    };
    fetchMyMeta();
  }, [user?.id, supabase]);

  // 선택 아이템 거래글/유저메타
  useEffect(() => {
    const fetchTradesAndMeta = async () => {
      if (!numericId || Number.isNaN(numericId)) {
        setLoading(false);
        setVisible(false);
        return;
      }
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("game_item_id", numericId)
        .eq("is_visible", true)
        .order("boosted_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

      setLoading(false);

      if (error) {
        console.error("아이템 조회 실패:", error.message);
        setVisible(false);
        return;
      }

      if (!data || data.length === 0) {
        setItemTrades([]);
        setVisible(true);
        setUserMetasMap({});
        return;
      }

      setItemTrades(data);
      setVisible(true);

      const userIds = Array.from(new Set(data.map((e) => e.user_id)));
      if (userIds.length) {
        const { data: metaData, error: metaErr } = await supabase
          .from("user_meta")
          .select("user_id, name, avatar_url")
          .in("user_id", userIds);
        if (!metaErr && metaData) {
          const map: Record<string, { name: string; avatar_url?: string }> = {};
          metaData.forEach((u: any) => (map[u.user_id] = { name: u.name, avatar_url: u.avatar_url }));
          setUserMetasMap(map);
        }
      }
    };
    fetchTradesAndMeta();
  }, [numericId, supabase, refreshKey]);

  // ───────────────────────────────────────────────────────────────
  // 헤더: 거래글 있으면 그 이름/이미지를, 없으면 ID 매핑을 사용
  // ───────────────────────────────────────────────────────────────
  const headerName =
    itemTrades[0]?.item_name ||
    ITEM_META[numericId]?.name ||
    "아이템";

  const headerImage =
    (itemTrades[0]?.item_name && getImageByName(itemTrades[0].item_name)) ||
    ITEM_META[numericId]?.file ||
    PLACEHOLDER_IMAGE;

  const headerDesc = ""; // 필요하면 ITEM_META에 description을 추가해 써도 됨

  function TradeCard({ entry }: { entry: any }) {
    const userId = entry.user_id;
    const name = userMetasMap[userId]?.name || "이름";
    const avatar = userMetasMap[userId]?.avatar_url || "https://cdn.discordapp.com/embed/avatars/0.png";

    // 카드: 글에 이름이 있으면 우선 사용, 없으면 ID 매핑
    const itemName =
      entry.item_name ||
      ITEM_META[entry.game_item_id]?.name ||
      "알 수 없음";

    const itemImage =
      (entry.item_name && getImageByName(entry.item_name)) ||
      ITEM_META[entry.game_item_id]?.file ||
      PLACEHOLDER_IMAGE;

    const formattedTime = formatTimeAgo(entry.boosted_at || entry.created_at);
    const dealType = entry.delivery_method || "택배";
    const canNegotiate = entry.price_negotiable ? "흥정가능" : "흥정불가";
    const quantity = entry.quantity || 1;
    const comment = entry.comment?.length > 10 ? `${entry.comment.slice(0, 10)}...` : entry.comment;

    return (
      <div className="bg-[#2a2a2a] rounded-lg border border-gray-700 hover:border-yellow-400 transition p-3 flex gap-3">
        <div className="min-w-[48px] min-h-[48px] flex items-start justify-center pt-0.5">
          <Image src={itemImage} alt="아이템" width={48} height={48} className="pixelated" style={{ imageRendering: "pixelated" }} />
        </div>
        <div className="flex-1 text-xs">
          <div className="flex justify-between items-center">
            <p className="text-white font-bold">{itemName}</p>
            <div className="flex items-center gap-1">
              <Image src={avatar} alt="avatar" width={20} height={20} className="rounded-full" />
              <p className="text-gray-300">{name}</p>
            </div>
          </div>

          <hr className="my-1 border-gray-600" />

          <div className="flex justify-between items-center text-[13px]">
            <div className="flex gap-2 items-center">
              <p className="text-gray-300 font-bold">[{quantity}개]</p>
              <p className="text-yellow-400 font-bold">{Number(entry.price || 0).toLocaleString()} 🌕</p>
            </div>
            <p className="text-gray-400 text-[12px]">{formattedTime}</p>
          </div>

          <hr className="my-1 border-gray-600" />

          <div className="flex justify-between items-center mt-1">
            <div className="flex gap-1">
              <span className="px-1 py-0.5 bg-pink-600 text-white rounded text-[11px]">{dealType}</span>
              <span className="px-1 py-0.5 bg-blue-600 text-white rounded text-[11px]">{canNegotiate}</span>
            </div>
            {user && (
              <button
                onClick={() => {
                  setReportItemId(entry.game_item_id);
                  setReportedUserId(entry.user_id);
                  setShowReportModal(true);
                }}
                className="px-1 py-0.5 bg-red-600 text-white rounded text-[11px] font-bold"
              >
                신고하기
              </button>
            )}
          </div>

          <div className="mt-1">
            <div className="relative group w-fit max-w-full">
              <span className="inline-block px-1 py-0.5 border border-gray-400 bg-white text-black rounded text-[12px] max-w-full truncate">
                {comment}
              </span>
              <div className="absolute left-0 bottom-full mb-1 z-20 hidden group-hover:block bg-black text-white text-[11px] rounded px-2 py-1 whitespace-pre-line max-w-xs shadow-lg">
                {entry.comment}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const buyTrades = itemTrades.filter((t) => t.deal_type === "buy");
  const sellTrades = itemTrades.filter((t) => t.deal_type === "sell");

  return (
    <div className="bg-[#0f0f0f] min-h-screen text-white font-maplestory px-4 pt-28 pb-8">
      <div className="w-full max-w-[1600px] mx-auto gap-8 flex px-6">
        {/* 사이드바 */}
        {user && (
          <aside className="w-[280px] bg-[#1c1c1c] rounded-2xl p-6 text-center flex flex-col items-center shadow-md">
            <Image
              src={avatarUrl}
              alt="프로필 이미지"
              width={80}
              height={80}
              className="mb-4 rounded-full border border-gray-600 object-cover"
            />
            <p className="text-xl font-bold">{userMeta?.name || user?.user_metadata?.global_name || "닉네임 없음"}</p>
            <p className="text-sm text-gray-400 mb-4">{(user as any)?.email || "이메일 없음"}</p>

            <div className="w-full mt-2 flex flex-col space-y-2">
              <Link href="/item/new" className="w-full py-2 rounded-xl bg-blue-500 hover:bg-yellow-600 text-white font-semibold transition">
                아이템 등록
              </Link>
              <button onClick={() => setShowModal(true)} className="w-full py-2 rounded-xl bg-gray-500 hover:bg-yellow-600 text-white font-semibold transition">
                건의사항
              </button>
              <Link href="/notice" className="w-full py-2 rounded-xl bg-red-500 hover:bg-yellow-600 text-white font-semibold transition">
                공지사항
              </Link>
              <Link href="/notice/3" className="w-full py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition">
                이용규칙
              </Link>
            </div>
          </aside>
        )}

        {/* 본문 */}
        <div className="flex-1 bg-[#1e1e1e] border border-[#444] rounded-2xl p-8 shadow-md">
          <h1 className="text-2xl font-bold text-white mb-0">{headerName}</h1>

          <div className="flex flex-col items-center mb-6">
            <Image src={headerImage} alt={headerName} width={100} height={100} className="mb-4 pixelated" />
            {headerDesc && <p className="text-gray-300 text-sm text-center">{headerDesc}</p>}
          </div>

          <hr className="border-gray-600 my-6" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 팝니다 */}
            <div>
              <h2 className="text-lg font-bold text-red-400 mb-3">💰 팝니다</h2>
              <div className="space-y-3">
                {sellTrades.length > 0 ? sellTrades.map((entry) => <TradeCard key={entry.id || entry.created_at} entry={entry} />)
                  : <p className="text-sm text-gray-400">등록된 판매글이 없습니다.</p>}
              </div>
            </div>

            {/* 삽니다 */}
            <div>
              <h2 className="text-lg font-bold text-green-400 mb-3">🛒 삽니다</h2>
              <div className="space-y-3">
                {buyTrades.length > 0 ? buyTrades.map((entry) => <TradeCard key={entry.id || entry.created_at} entry={entry} />)
                  : <p className="text-sm text-gray-400">등록된 구매글이 없습니다.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 건의사항 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">건의사항 보내기</h2>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="건의하실 내용을 작성해주세요"
              className="w-full h-32 p-2 border border-gray-300 rounded resize-none text-black"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-400 text-white rounded">취소</button>
              <button
                onClick={async () => {
                  try {
                    await sendFeedbackToDiscord(feedback, userMeta?.name || user?.user_metadata?.global_name || "익명");
                    alert("건의사항이 전송되었습니다!");
                    setFeedback("");
                    setShowModal(false);
                  } catch {
                    alert("전송에 실패했습니다.");
                  }
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded"
              >
                전송
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 신고 모달 */}
      {showReportModal && reportItemId !== null && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          onSubmit={handleReportSubmit}
          itemId={reportItemId}
          reporterName={userMeta?.name || user?.user_metadata?.global_name || "익명"}
          reportedName={reportedUserId ? userMetasMap[reportedUserId!]?.name || "알 수 없음" : "알 수 없음"}
        />
      )}
    </div>
  );

  // 신고 제출 핸들러
  async function handleReportSubmit({
    reason, description, imageFile, itemId, reporterName, reportedName,
  }: {
    reason: string; description: string; imageFile: File | null; itemId: number; reporterName: string; reportedName: string;
  }) {
    try {
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr) console.error("auth 에러:", authErr.message);
      const currentUser = authData?.user || null;
      if (!currentUser) { alert("로그인이 필요합니다."); return; }

      const { data: existingReports, error: checkError } = await supabase
        .from("reports").select("id")
        .eq("reporter_id", currentUser.id)
        .eq("item_id", itemId);
      if (checkError) console.error("중복 신고 확인 실패:", checkError.message);
      else if (existingReports && existingReports.length > 0) { alert("이미 이 아이템을 신고하셨습니다."); return; }

      let imageUrl: string | null = null;
      if (imageFile) {
        try {
          imageUrl = await uploadReportImage(imageFile);
          if (!imageUrl) { alert("이미지 업로드 실패"); return; }
        } catch (e: any) {
          console.error("이미지 업로드 예외:", e?.message || e); alert("이미지 업로드 중 오류가 발생했습니다."); return;
        }
      }

      const { error: insertError } = await supabase.from("reports").insert({
        item_id: itemId, reporter_id: currentUser.id, reporter_name: reporterName,
        reported_name: reportedName, reason, description, image_url: imageUrl,
      });
      if (insertError) { console.error("신고 DB 저장 실패:", insertError.message); alert("신고 저장 중 오류가 발생했습니다."); return; }

      try { await sendReportToDiscord({ reporter: reporterName, reported: reportedName, reason, description, imageUrl }); }
      catch (e: any) { console.error("디스코드 전송 실패:", e?.message || e); alert("디스코드 전송 중 오류가 발생했습니다."); return; }

      alert("신고가 접수되었습니다. 감사합니다!");
      setShowReportModal(false);
    } catch (e: any) {
      console.error("신고 전체 처리 실패:", e?.message || e);
      alert("신고 처리 중 예상치 못한 오류가 발생했습니다.");
    }
  }
}

// 신고 모달 컴포넌트
function ReportModal({
  isOpen, onClose, onSubmit, itemId, reporterName, reportedName,
}: {
  isOpen: boolean; onClose: () => void;
  onSubmit: (params: { reason: string; description: string; imageFile: File | null; itemId: number; reporterName: string; reportedName: string; }) => void;
  itemId: number; reporterName: string; reportedName: string;
}) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!reason.trim()) { alert("신고 사유를 입력해주세요."); return; }
    await onSubmit({ reason, description, imageFile, itemId, reporterName, reportedName });
    setReason(""); setDescription(""); setImageFile(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center">
      <div className="bg-white text-black w-full max-w-md rounded-lg p-6">
        <h2 className="text-lg font-bold mb-4">신고하기</h2>

        <div className="text-sm text-gray-700 mb-2">
          <p><strong>신고자:</strong> {reporterName}</p>
          <p><strong>신고 대상:</strong> {reportedName}</p>
        </div>

        <label className="block mb-2 font-semibold">신고 사유</label>
        <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} className="w-full p-2 border border-gray-300 rounded mb-4" placeholder="예: 다중아이디, 사기, 욕설 등" />

        <label className="block mb-2 font-semibold">상세 내용</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full h-24 p-2 border border-gray-300 rounded mb-4 resize-none" placeholder="상세 설명을 입력해주세요" />

        <label className="block mb-2 font-semibold">이미지 첨부 (선택)</label>
        <div className="flex items-center gap-2">
          <label htmlFor="reportImage" className="cursor-pointer px-4 py-2 bg-gray-200 text-black rounded hover:bg-gray-300 text-sm">📎 파일 선택</label>
          <span className="text-sm text-gray-600">{imageFile?.name || "선택된 파일 없음"}</span>
        </div>

        <input id="reportImage" type="file" accept="image/*" onChange={(e) => {
          const file = e.target.files?.[0] || null;
          if (file && file.size > 5 * 1024 * 1024) { alert("이미지 용량은 5MB 이하만 가능합니다."); return; }
          setImageFile(file);
        }} className="hidden" />

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={() => { setReason(""); setDescription(""); setImageFile(null); onClose(); }} className="px-4 py-2 bg-gray-400 text-white rounded">취소</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-red-600 text-white rounded">신고 제출</button>
        </div>
      </div>
    </div>
  );
}
