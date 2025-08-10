// components/Footer.tsx
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="text-gray-400 text-xs text-center mt-20 mb-10">
      © Mapeland.gogo
      <br />
      <Link href="/notice" className="hover:underline">공지사항</Link> |{" "}
      <Link href="/notice/3" className="hover:underline">개인정보처리방침</Link>
      <br />
      Databased on MapleStory.io
    </footer>
  );
}
