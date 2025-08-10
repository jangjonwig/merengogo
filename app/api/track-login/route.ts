// app/api/track-login/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function POST(req: Request) {
  try {
    // 1) 표준 Request 헤더에서 직접 읽기 (TS 에러 0)
    const forwarded = req.headers.get("x-forwarded-for") || "";
    const ip =
      forwarded.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "0.0.0.0";

    const uaRaw = req.headers.get("user-agent") || "";
    const ua = uaRaw.toLowerCase();
    const device_type = /mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(ua)
      ? "mobile"
      : "desktop";

    // 2) Supabase 세션 확인
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr) {
      return NextResponse.json({ ok: false, error: userErr.message }, { status: 500 });
    }
    if (!user) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    // 3) user_meta 갱신 (upsert)
    const nowIso = new Date().toISOString();
    const { error: upErr } = await supabase
      .from("user_meta")
      .upsert(
        {
          user_id: user.id,
          ip,
          device_type,
          last_login_at: nowIso,
        },
        { onConflict: "user_id" }
      );

    if (upErr) {
      return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });
    }

    // 4) ip_logs 적재 (실패해도 진행)
    const { error: logErr } = await supabase.from("ip_logs").insert({
      user_id: user.id,
      ip,
    });
    if (logErr) {
      console.warn("[track-login] ip_logs insert failed:", logErr.message);
    }

    return NextResponse.json({
      ok: true,
      ip,
      device_type,
      ua: uaRaw,
      when: nowIso,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 }
    );
  }
}
