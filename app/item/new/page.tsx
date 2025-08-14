'use client';

import { useState } from 'react';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import RegisterItemSearchBar from '@/components/RegisterItemSearchBar';

export type Item = {
  id: number;
  name: string;
  image: string;
  description: string;
};

export default function ItemRegisterPage() {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [dealType, setDealType] = useState<'buy' | 'sell' | null>(null);
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isNegotiable, setIsNegotiable] = useState<'가능' | '불가능' | null>(null);
  const [method, setMethod] = useState<'택배' | '자유시장' | null>(null);
  const [comment, setComment] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const user = useUser();
  const supabase = useSupabaseClient();

  const formatPrice = (num: string) => {
    const n = parseInt(num);
    if (isNaN(n)) return '';
    if (n >= 10000) return `${Math.floor(n / 10000)}만`;
    return `${n.toLocaleString()}원`;
  };

const handleSubmit = async () => {
  if (!selectedItem || !dealType || !price || !isNegotiable || !method || !confirmed) {
    alert('모든 항목을 입력해주세요!');
    return;
  }

  if (quantity < 1 || quantity > 999) {
    alert('❌ 수량은 1~999 사이여야 합니다.');
    return;
  }

  const userId = user?.id;
  const userMeta = user?.user_metadata;

  if (!userId) {
    console.error('❌ 유저 ID를 가져올 수 없습니다.');
    alert('로그인 후 등록해주세요.');
    return;
  }

  // ✅ 중복 등록 방지 로직 시작
  const { data: existingItems, error: checkError } = await supabase
    .from('items')
    .select('id')
    .eq('user_id', userId)
    .eq('item_name', selectedItem.name)
    .eq('status', 'active'); // 거래 완료되지 않은 것만 확인

  if (checkError) {
    console.error('❌ 중복 확인 실패:', checkError.message);
    alert('등록 중 오류가 발생했습니다. 다시 시도해주세요.');
    return;
  }

  if (existingItems.length > 0) {
    alert('❌ 중복 아이템은 1회만 등록 가능합니다.');
    return;
  }
  // ✅ 중복 등록 방지 로직 끝

  const nickname = userMeta?.global_name || userMeta?.name || userMeta?.username || null;
  const avatar = userMeta?.avatar_url || null;

  const { error } = await supabase.from('items').insert([
    {
      user_id: userId,
      game_item_id: selectedItem.id,
      item_name: selectedItem.name,
      item_image: selectedItem.image,
      deal_type: dealType,
      price: parseInt(price),
      quantity,
      negotiable: isNegotiable === '가능',
      delivery_method: method,
      comment,
      discord_name: nickname,
      discord_avatar_url: avatar,
      status: 'active', // 명시적으로 상태 저장
    },
  ]);

  if (error) {
    console.error('❌ 등록 실패:', error.message);
    alert('등록에 실패했습니다. 다시 시도해주세요.');
  } else {
    alert('✅ 등록이 완료되었습니다!');
    setSelectedItem(null);
    setDealType(null);
    setPrice('');
    setQuantity(1);
    setIsNegotiable(null);
    setMethod(null);
    setComment('');
    setConfirmed(false);
  }
};

  return (
    <div className="min-h-screen pt-24 px-4 font-maplestory bg-[#0f0f0f] text-white">
      <div className="bg-[#2b2b2b] text-white p-4 rounded text-center mb-6">
        메랜고고 아이템 등록 페이지입니다.<br />
        등록하실 아이템을 검색해주세요.
      </div>

      <div className="flex justify-center mb-10">
        <RegisterItemSearchBar
          onSelect={(item: Item) => {
            setSelectedItem(item);
            setDealType(null);
          }}
        />
      </div>


      {selectedItem && (
        <div className="text-center space-y-6 animate-fade-in">
          <div className="flex flex-col items-center gap-2">
            <img
              src={selectedItem.image}
              alt={selectedItem.name}
              className="w-20 h-20 object-cover rounded shadow"
            />
            <p className="text-lg font-semibold mt-2">{selectedItem.name}</p>
          </div>

          <div>
            <p className="text-md font-bold mb-5">거래타입을 선택해주세요</p>
            <div className="flex justify-center gap-5">
              <button
                onClick={() => setDealType('buy')}
                className={`px-6 py-2 rounded font-bold border ${
                  dealType === 'buy'
                    ? 'bg-green-600 border-green-700 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700'
                }`}
              >
                삽니다
              </button>
              <button
                onClick={() => setDealType('sell')}
                className={`px-6 py-2 rounded font-bold border ${
                  dealType === 'sell'
                    ? 'bg-blue-600 border-blue-700 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                }`}
              >
                팝니다
              </button>
            </div>
          </div>

          {dealType && (
            <div className="mt-6 space-y-3 animate-fade-in">
              {/* 가격 입력 */}
              <div className="flex flex-col items-center">
                <label className="font-bold mb-2">가격</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="가격을 입력하세요"
                  className="w-[220px] h-10 px-4 rounded border border-gray-600 bg-black text-white text-center"
                />
                <div className="text-sm text-gray-400 mt-1">{formatPrice(price)}</div>
              </div>

              {/* 수량 입력 */}
              <div className="flex flex-col items-center">
                <label className="font-bold mb-2">수량</label>
                <input
                  type="number"
                  value={quantity}
                  min={1}
                  max={999}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  placeholder="예: 1"
                  className="w-[220px] h-10 px-4 rounded border border-gray-600 bg-black text-white text-center"
                />
              </div>

              {/* 흥정 여부 */}
              <div>
                <p className="font-bold mb-2">가격 흥정여부</p>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => setIsNegotiable('가능')}
                    className={`px-5 py-2 rounded border ${
                      isNegotiable === '가능'
                        ? 'bg-green-600 border-green-700 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-300'
                    }`}
                  >
                    가능
                  </button>
                  <button
                    onClick={() => setIsNegotiable('불가능')}
                    className={`px-5 py-2 rounded border ${
                      isNegotiable === '불가능'
                        ? 'bg-red-600 border-red-700 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-300'
                    }`}
                  >
                    불가능
                  </button>
                </div>
              </div>

              {/* 거래 방식 */}
              <div>
                <p className="font-bold mb-2">거래 선호 방식</p>
                <div className="flex justify-center gap-4">
                  {['택배', '자유시장'].map((key) => (
                    <button
                      key={key}
                      onClick={() => setMethod(key as '택배' | '자유시장')}
                      className={`px-5 py-2 rounded border ${
                        method === key
                          ? 'bg-yellow-600 border-yellow-700 text-white'
                          : 'bg-gray-800 border-gray-700 text-gray-300'
                      }`}
                    >
                      {key}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-red-400 mt-2">
                  (주의사항) 택배 거래시 해당 아이템 또는 금액이 맞는지 반드시 확인 부탁드립니다.
                </p>
              </div>

              {/* 코멘트 */}
              <div className="flex flex-col items-center">
                <label className="font-bold mb-2">코멘트 ({comment.length}/60)</label>
                <textarea
                  maxLength={60}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-[320px] h-20 px-4 py-2 rounded border border-gray-600 bg-black text-white"
                  placeholder="최대 60자까지 입력 가능합니다."
                />
                <p className="text-sm text-red-400 mt-1">
                  (주의사항) 업자는 [업자]라고 꼭 표기 해주세요.
                </p>
              </div>

              {/* 체크박스 */}
              <div className="bg-[#2b2b2b] border border-yellow-600 text-yellow-200 text-sm p-4 rounded leading-relaxed">
                <p className="font-bold mb-2 text-center">
                  ⚠ 미숙지, 규정위반으로 문제 발생 시 책임은 본인에게 있습니다.
                </p>
                <div className="flex justify-center my-2">
                  <label className="cursor-pointer flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={confirmed}
                      onChange={(e) => setConfirmed(e.target.checked)}
                    />
                    <span className="text-blue-300 underline">위 내용을 확인했습니다.</span>
                  </label>
                </div>
                <p className="text-red-400 mt-3">
                  제재 대상자가 돈을 주고 대리등록을 요청하는 경우가 발견되고 있습니다.
                  <br />
                  타인의 요구에 의해 아이템을 등록하지 마시길 바랍니다.
                </p>
              </div>

              {/* 등록 버튼 */}
              <div className="text-center">
                <button
                  onClick={handleSubmit}
                  disabled={!confirmed}
                  className="mt-6 px-8 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                >
                  등록하기
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
