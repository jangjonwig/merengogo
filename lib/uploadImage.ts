// ✅ 수정된 버전
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { v4 as uuidv4 } from 'uuid';

export async function uploadReportImage(file: File): Promise<string | null> {
  const supabase = createClientComponentClient(); // ✅ 인증된 유저 클라이언트 생성

  const fileExt = file.name.split('.').pop();
  const fileName = `${uuidv4()}.${fileExt}`;
  const filePath = `reports/${fileName}`;

  const { error } = await supabase.storage
    .from('reports')
    .upload(filePath, file);

  if (error) {
    console.error('이미지 업로드 실패:', error.message);
    return null;
  }

  const { data } = supabase.storage
    .from('reports')
    .getPublicUrl(filePath);

  return data?.publicUrl ?? null;
}
