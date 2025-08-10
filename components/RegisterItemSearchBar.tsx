'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import type { Item } from '@/app/item/new/page';

const itemDB: Item[] = [
  { id: 1, name: '월드코인(전체)', image: '/items/월코.png', description: '' },
  { id: 2, name: '고성능 확성기', image: '/items/고확.png', description: '' },
  { id: 3, name: 'SP 초기화 주문서', image: '/items/sp.png', description: '' },
  { id: 4, name: 'AP 초기화 주문서', image: '/items/ap.png', description: '' },
  { id: 5, name: '슬롯 확장권', image: '/items/슬롯.png', description: '' },
  { id: 6, name: '펫장비(투명한리본)', image: '/items/펫장비.png', description: '' },
  { id: 7, name: '5천 메이플 포인트', image: '/items/5천.png', description: '' },
  { id: 8, name: '1만 메이플 포인트', image: '/items/1만.png', description: '' },
  { id: 9, name: '3만 메이플 포인트', image: '/items/3만.png', description: '' },
  { id: 10, name: '호신부적', image: '/items/호부.png', description: '' },
  { id: 11, name: '생명의 물', image: '/items/생물.png', description: '' },
  { id: 12, name: '캐시 펫(품목선택)', image: '/items/펫.png', description: '' },
  { id: 13, name: '아바타 코디 반지 (30일)', image: '/items/코반.png', description: '' },
  { id: 14, name: '아바타 코디 반지 (90일)', image: '/items/코반.png', description: '' }
];

type Props = {
  onSelect: (item: Item) => void;
};

export default function SearchBarWithSelect({ onSelect }: Props) {
  const [search, setSearch] = useState('');
  const [previewItems, setPreviewItems] = useState<Item[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (search.trim() === '') {
      setPreviewItems(itemDB);
      return;
    }
    const filtered = itemDB.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase())
    );
    setPreviewItems(filtered);
  }, [search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: Item) => {
    setSearch(item.name);
    setShowDropdown(false);
    onSelect(item);
  };

  return (
    <div className="w-[320px] relative" ref={containerRef}>
      <input
        ref={inputRef}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setSelectedIndex(null);
        }}
        onFocus={() => setShowDropdown(true)}
        onKeyDown={(e) => {
          if (!previewItems.length) return;
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) =>
              prev === null || prev === previewItems.length - 1 ? 0 : prev + 1
            );
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) =>
              prev === null || prev === 0 ? previewItems.length - 1 : prev - 1
            );
          } else if (e.key === 'Enter') {
            if (selectedIndex !== null && previewItems[selectedIndex]) {
              handleSelect(previewItems[selectedIndex]);
            }
          }
        }}
        className="w-full h-10 px-16 rounded border border-gray-600 bg-black text-white"
        placeholder="등록할 아이템을 선택 하세요"
      />

      {showDropdown && (
        <div className="absolute top-12 left-0 w-full bg-black border border-gray-700 rounded p-3 flex flex-col text-sm z-10 max-h-60 overflow-y-auto">
          <strong className="text-white text-sm mb-1 block">📋 등록 가능한 아이템 목록</strong>
          <ul className="space-y-1">
            {previewItems.map((item, index) => (
              <li
                key={item.id}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer ${
                  selectedIndex === index ? 'bg-yellow-700' : 'hover:bg-gray-800'
                }`}
              >
                <Image src={item.image} alt={item.name} width={24} height={24} />
                <span>{item.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
