import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  return NextResponse.json({ ok: true, pinged: 0, message: 'IndexNow to be implemented in Phase 16' })
}
