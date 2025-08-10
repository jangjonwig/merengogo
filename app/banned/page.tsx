export default function BannedPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0f0f0f] text-white p-6">
      <div className="max-w-lg w-full bg-black/40 border border-white/10 rounded-2xl p-6 space-y-3">
        <h1 className="text-2xl font-bold">🚫 접속이 제한되었습니다</h1>
        <p className="text-sm text-gray-300">
          관리자에 의해 계정 사용이 제한되었습니다. 사유가 궁금하시다면 운영자에게 문의해 주세요.
        </p>
        <a
          href="/"
          className="inline-block mt-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
        >
          홈으로
        </a>
      </div>
    </main>
  );
}
