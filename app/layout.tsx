// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "./providers";
import ClientLayout from "@/components/ClientLayout";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ✅ 구글/네이버 소유확인 메타 태그 포함
export const metadata: Metadata = {
  // 퓨니코드로 두는 게 가장 안전 (메랜고고.com = xn--299aa653fsxc.com)
  metadataBase: new URL("https://xn--299aa653fsxc.com"),
  title: "메랜고고",
  description: "빠르고 간편한 거래 플랫폼",
  alternates: {
    // 캐노니컬 URL을 한 곳으로 고정
    canonical: "https://메랜고고.com",
  },
  verification: {
    // ⬇️ 네이버 서치어드바이저 메타 태그 토큰
    other: { "naver-site-verification": "NAVER_SITE_VERIFICATION_TOKEN" },
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0f0f0f] text-white flex flex-col min-h-screen overflow-x-hidden`}
      >
        <Providers>
          <main className="flex-1">
            <ClientLayout>{children}</ClientLayout>
          </main>
        </Providers>
        <Footer />
      </body>
    </html>
  );
}
