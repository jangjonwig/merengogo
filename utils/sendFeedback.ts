// ✅ 기존 건의사항 함수 유지
export async function sendFeedbackToDiscord(message: string, username: string) {
  const webhookUrl = "https://discord.com/api/webhooks/1402323246019379291/OSAoHS44ECkM4p8BmJqq-nOlQwztxvFEL0G5TXH6_0g2l7cxrlxG_9O7GvZS23IT16Jp";

  const payload = {
    username: "건의사항",
    content: `📨 새 건의사항 도착!\n\n👤 사용자: ${username}\n💬 내용: ${message}\n🕓 시간: ${new Date().toLocaleString("ko-KR")}`
  };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error("디스코드 전송 실패");
  }
}

// ✅ 신고 알림 함수 추가
export async function sendReportToDiscord({
  reporter,
  reported,
  reason,
  description,
  imageUrl
}: {
  reporter: string;
  reported: string;
  reason: string;
  description?: string;
  imageUrl?: string | null;
}) {
  const webhookUrl = "https://discord.com/api/webhooks/1402323246019379291/OSAoHS44ECkM4p8BmJqq-nOlQwztxvFEL0G5TXH6_0g2l7cxrlxG_9O7GvZS23IT16Jp";

  const payload = {
    username: "🚨 신고 접수",
    content: `🚨 **신고 접수됨**
**신고자**: ${reporter}
**신고 대상**: ${reported}
**사유**: ${reason}
${description ? `**내용**: ${description}` : ""}
${imageUrl ? `📎 첨부 이미지: ${imageUrl}` : ""}
🕓 시간: ${new Date().toLocaleString("ko-KR")}`
  };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error("신고 디스코드 전송 실패");
  }
}
