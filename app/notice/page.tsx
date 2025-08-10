"use client";

import Link from "next/link";
import { notices } from "@/lib/notices";

export default function NoticePage() {
  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-gray-900 to-black p-4 space-y-4 pt-24">
      {/* ✅ pt-24 추가로 상단 띄움 */}

      <h1 className="text-3xl font-bold text-white mb-6 font-maplestory">
        📢 메렌고고 공지사항
      </h1>

      <div className="w-full max-w-2xl space-y-4">
        {notices.map((notice) => (
          <Link
            key={notice.id}
            href={`/notice/${notice.id}`}
            className="block bg-white/5 border border-white/10 rounded-xl p-5 text-white font-maplestory hover:bg-white/10 transition-all duration-150"
          >
            <div className="flex items-center text-lg font-bold gap-2">
              <span>📌</span>
              <span>{notice.title}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
