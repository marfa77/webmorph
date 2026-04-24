import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
}
