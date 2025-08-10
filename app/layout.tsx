import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "./providers";
import ClientLayout from "@/components/ClientLayout";
import Footer from "@/components/Footer"; // ⬅️ 추가

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "메렌고고",
  description: "빠르고 간편한 거래 플랫폼",
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
        <Footer /> {/* ⬅️ 하단 고정 */}
      </body>
    </html>
  );
}
