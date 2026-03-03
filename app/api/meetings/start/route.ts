import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

function generateMeetingSessionId(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const v = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? ''

  // YYMMDDHHmmss (예: 260303151613)
  return `${v('year')}${v('month')}${v('day')}${v('hour')}${v('minute')}${v('second')}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const title = typeof body?.title === 'string' && body.title.trim().length > 0
      ? body.title.trim()
      : 'Untitled meeting'

    const supabase = getSupabaseAdmin()

    let sessionId = generateMeetingSessionId()

    // 같은 초에 중복 생성될 경우를 대비해 최대 2회 재시도
    for (let retry = 0; retry < 3; retry += 1) {
      const { data, error } = await supabase
        .from('meeting_sessions')
        .insert({
          id: sessionId,
          title,
          status: 'active',
          started_at: new Date().toISOString(),
        })
        .select('*')
        .single()

      if (!error && data) {
        return NextResponse.json({ session: data }, { status: 201 })
      }

      // primary key 충돌 시 1초 증가 후 재시도
      if (error && String(error.message).toLowerCase().includes('duplicate')) {
        sessionId = generateMeetingSessionId(new Date(Date.now() + 1000 * (retry + 1)))
        continue
      }

      return NextResponse.json({ error: error?.message ?? 'Unknown database error' }, { status: 500 })
    }

    return NextResponse.json({ error: '세션 ID 생성 충돌로 회의를 시작하지 못했습니다.' }, { status: 500 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
