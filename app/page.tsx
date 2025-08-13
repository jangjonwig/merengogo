'use client';

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "@/app/globals.css";

function HomeLogoSection() {
  return (
<div className="flex justify-center mt-1">
  <Image
    src="/logo/merengogo.png"  // 말풍선 로고 경로
    alt="메렌고고 로고"
    width={280}  // 크기 원하는 만큼 키워도 돼 (예: 180, 200 등)
    height={280}
    priority
  />
</div>
  );
}

type Item = {
  id: number;
  name: string;
  price: string;
  image: string;
  description: string;
};

const itemDB: Item[] = [
  { id: 1, name: "월드코인(전체)", price: "시세변동", image: "/items/월코.png", description: "전체 월드에서 사용 가능한 월드코인입니다." },
  { id: 2, name: "고성능 확성기", price: "1,000 캐시", image: "/items/고확.png", description: "채널에 메시지를 보낼 수 있습니다." },
  { id: 3, name: "SP 초기화 주문서", price: "1,200 캐시", image: "/items/sp.png", description: "스킬 포인트를 초기화합니다." },
  { id: 4, name: "AP 초기화 주문서", price: "1,400 캐시", image: "/items/ap.png", description: "어빌리티 포인트를 초기화합니다." },
  { id: 5, name: "슬롯 확장권", price: "500 캐시", image: "/items/슬롯.png", description: "장비,소비,기타 슬롯을 확장합니다." },
  { id: 6, name: "펫장비(투명한리본)", price: "800 캐시", image: "/items/펫장비.png", description: "투명한 리본 형태의 펫 장비입니다." },
  { id: 7, name: "5천 메이플 포인트", price: "5,000P", image: "/items/5천.png", description: "5,000 메이플 포인트 충전권." },
  { id: 8, name: "1만 메이플 포인트", price: "10,000P", image: "/items/1만.png", description: "10,000 메이플 포인트 충전권." },
  { id: 9, name: "3만 메이플 포인트", price: "30,000P", image: "/items/3만.png", description: "30,000 메이플 포인트 충전권." },
  { id: 10, name: "호신부적", price: "800 캐시", image: "/items/호부.png", description: "부활 시 경험치를 보장하는 아이템입니다." },
  { id: 11, name: "생명의 물", price: "600 캐시", image: "/items/생물.png", description: "펫을 다시 살릴 수 있는 생명의 물입니다." },
  { id: 12, name: "캐시 펫(품목선택)", price: "9,900 캐시", image: "/items/펫.png", description: "원하는 캐시 펫을 선택해 받을 수 있습니다." },
  { id: 13, name: "아바타 코디 반지 (30일)", price: "1,000 캐시", image: "/items/코반.png", description: "30일간 착용 가능한 아바타용 반지입니다." },
  { id: 14, name: "아바타 코디 반지 (90일)", price: "2,500 캐시", image: "/items/코반.png", description: "90일간 착용 가능한 아바타용 반지입니다." }
];

export default function HomePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Item[]>(itemDB);
  const [recentSearches, setRecentSearches] = useState<Item[]>([]);
  const [favorites, setFavorites] = useState<Item[]>([]);
  const [showSearchExtras, setShowSearchExtras] = useState(false);
  const [previewItems, setPreviewItems] = useState<Item[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSearchExtras(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (search.trim() === "") {
      setPreviewItems([]);
      return;
    }
    const filtered = itemDB.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));
    setPreviewItems(filtered);
  }, [search]);

  useEffect(() => {
    const stored = localStorage.getItem("recentSearches");
    if (stored) setRecentSearches(JSON.parse(stored));
    const storedFav = localStorage.getItem("favorites");
    if (storedFav) setFavorites(JSON.parse(storedFav));
  }, []);

  const handleSearch = () => {
    const filtered = itemDB.filter(item => item.name.includes(search));
    setResults(filtered);
    const found = itemDB.find(item => item.name === search);
    if (found) {
      setRecentSearches(prev => {
        const filtered = prev.filter(i => i.id !== found.id);
        return [found, ...filtered].slice(0, 10);
      });
    }
  };

  const handleCardClick = (item: Item) => {
    const updated = [item, ...recentSearches.filter(i => i.id !== item.id)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
    router.push(`/item/${item.id}`);
  };

  const toggleFavorite = (item: Item) => {
    const exists = favorites.some(fav => fav.id === item.id);
    const updated = exists
      ? favorites.filter(fav => fav.id !== item.id)
      : [item, ...favorites];
    setFavorites(updated);
    localStorage.setItem("favorites", JSON.stringify(updated));
  };

  return (
    <div className="w-full min-h-screen bg-[#0f0f0f] text-white font-maplestory m-page-sm">
      <div className="max-w-2xl mx-auto p-2"></div>
      <HomeLogoSection />

<div className="w-full max-w-md mx-auto mb-4 px-5">
  <Link href="/notice" className="block">
    <section
      className="flex items-center gap-2 px-3 h-11 rounded-lg
                 bg-yellow-900/30 border border-yellow-600/30
                 whitespace-nowrap overflow-hidden"
    >
      <div className="shrink-0 px-2 py-1 rounded-md
                      bg-yellow-500/15 text-yellow-400 text-sm">
        공지
      </div>
      <span className="min-w-0 flex-1 truncate text-[15px]">
        원활한 메렌고고 이용을 위해 필독 해주세요!
      </span>
    </section>
  </Link>
</div>


      <div
        ref={wrapperRef}
        className="relative flex flex-col gap-2 my-5 w-full max-w-xl mx-auto"
        onFocus={() => setShowSearchExtras(true)}
      >
        <Input
          className="border border-yellow-500 focus:ring-yellow-400 bg-black text-white placeholder-gray-400"
          placeholder="아이템을 검색하세요"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSelectedIndex(null);
          }}
          onFocus={() => setShowSearchExtras(true)}
          onKeyDown={(e) => {
            if (!previewItems.length) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setSelectedIndex(prev => (prev === null || prev === previewItems.length - 1) ? 0 : prev + 1);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setSelectedIndex(prev => (prev === null || prev === 0) ? previewItems.length - 1 : prev - 1);
            } else if (e.key === "Enter") {
              if (selectedIndex !== null && previewItems[selectedIndex]) {
                handleCardClick(previewItems[selectedIndex]);
              } else {
                handleSearch();
              }
            }
          }}
        />
        {showSearchExtras && (
          <div className="absolute top-12 left-0 w-full bg-[#1a1a1a] border border-yellow-400 rounded p-3 text-sm z-10">
            {previewItems.length > 0 && (
              <div className="mb-3">
                <strong className="text-white text-sm mb-1 block">🔎 검색 미리보기</strong>
                <ul className="space-y-1 max-h-40 overflow-y-auto">
                  {previewItems.map((item, index) => (
                    <li
                      key={item.id}
                      className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer ${
                        selectedIndex === index ? "bg-yellow-700" : "hover:bg-gray-800"
                      }`}
                      onMouseEnter={() => setSelectedIndex(index)}
                      onClick={() => handleCardClick(item)}
                    >
                      <Image src={item.image} alt={item.name} width={24} height={24} className="rounded" />
                      <span className="text-white">{item.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex">
              <div className="w-1/2 pr-2 border-r border-gray-600">
                <div className="flex justify-between mb-2">
                  <strong>최근검색</strong>
                  <span className="text-blue-400 cursor-pointer" onClick={() => setRecentSearches([])}>초기화</span>
                </div>
                {recentSearches.length === 0 ? (
                  <p className="text-gray-400">검색 기록 없음</p>
                ) : (
                  <ul className="space-y-1">
                    {recentSearches.map(item => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between cursor-pointer hover:bg-gray-800 px-2 py-1 rounded"
                      >
                        <div onClick={() => handleCardClick(item)} className="flex items-center gap-2">
                          <Image src={item.image} alt={item.name} width={24} height={24} className="rounded" />
                          <span className="text-white text-sm">{item.name}</span>
                        </div>
                        <button onClick={() => toggleFavorite(item)} className="text-yellow-400 hover:text-yellow-300 text-sm">
                          {favorites.some(fav => fav.id === item.id) ? "★" : "☆"}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="w-1/2 pl-2">
                <div className="flex justify-between mb-2">
                  <strong>즐겨찾기</strong>
                </div>
                {favorites.length === 0 ? (
                  <p className="text-gray-400">즐겨찾기 없음</p>
                ) : (
                  <ul className="space-y-1">
                    {favorites.map(item => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between cursor-pointer hover:bg-gray-800 px-2 py-1 rounded"
                      >
                        <div onClick={() => handleCardClick(item)} className="flex items-center gap-2">
                          <Image src={item.image} alt={item.name} width={24} height={24} className="rounded" />
                          <span className="text-white text-sm">{item.name}</span>
                        </div>
                        <button onClick={() => toggleFavorite(item)} className="text-yellow-400 hover:text-yellow-300 text-sm">
                          {favorites.some(fav => fav.id === item.id) ? "★" : "☆"}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

{results.map((item) => (
  <div className="w-full max-w-xl mx-auto" key={item.id}>
  <Card className="mb-2 border-none shadow-none bg-[#1a1a1a] rounded-xl">
    <CardContent className="p-4 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <Image
          src={item.image}
          alt={item.name}
          width={60}
          height={60}
          className="rounded-lg image-render-pixel"
        />
        <div>
          <div className="font-bold text-black text-lg">{item.name}</div>
        </div>
      </div>
      <Button
        onClick={() => handleCardClick(item)}
        className="bg-[#007bff] hover:bg-[#3399ff] text-white text-sm px-4 py-2 rounded-md transition"
      >
        <Search className="w-4 h-4 mr-1" /> 검색
      </Button>
    </CardContent>
  </Card>
</div>
))}
 </div>
  );
}
