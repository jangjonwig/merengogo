// app/notice/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { notices } from "@/lib/notices";

export default function NoticeDetailPage({ params }: any) {
  const id = Number(params?.id);
  const notice = notices.find((n) => n.id === id);

  if (!notice) return notFound();

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-gray-900 to-black p-4">
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl p-6 max-w-2xl w-full text-white font-maplestory space-y-6">
        {/* 📢 공지 타이틀 */}
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <span>📢</span>
          <span>{notice.title}</span>
        </h1>

        <hr className="border-white/20" />

        {/* 📄 내용 */}
        <div className="space-y-4 text-base leading-relaxed">
          {notice.content.map((line, idx) => (
            <p key={idx}>{line}</p>
          ))}
        </div>

        {/* ⬅️ 하단 돌아가기 버튼 */}
        <div className="pt-6">
          <Link
            href="/notice"
            className="inline-block px-4 py-2 rounded-lg border border-white/30 text-sm text-white hover:bg-white/10 transition"
          >
            ← 목록으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}