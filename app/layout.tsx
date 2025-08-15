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
  // 퓨니코드로 두는 게 가장 안전 (메렌지지.com = xn--299aa653fsxc.com)
  metadataBase: new URL("https://xn--299aa653fsxc.com"),
  title: "메랜고고 - 메랜고고.COM",
  description:
    "월드코인 통합 · 5천 메이플 포인트 · 1만 메이플 포인트 · 3만 메이플 포인트 · 캐시 펫(선택식) · MSW 아바타 코디반지(30일) · 슬롯 확장권 · 고성능 확성기",
  alternates: {
    canonical: "https://메랜고고.com",
  },
  verification: {
    other: {
      "naver-site-verification":
        "a4cdc9f25220e728dec601b086aa6cf2efdd0618",
    },
  },
  robots: {
    index: true,
    follow: true,
  },

  // ✅ 파비콘/아이콘 (캐시 무효화를 위해 ?v=2 부착)
  icons: {
    icon: [
      { url: "/favicon.ico?v=2" }, // public/favicon.ico
      { url: "/icon.png?v=2", type: "image/png", sizes: "32x32" }, // app/icon.png도 자동 노출되지만 명시
    ],
    apple: [{ url: "/apple-icon.png?v=2", sizes: "180x180" }], // app/apple-icon.png
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
