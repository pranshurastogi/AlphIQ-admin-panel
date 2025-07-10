// app/api/admin/metrics/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
)

export async function GET() {
  const today = new Date().toISOString().slice(0, 10)       // e.g. "2025-07-10"
  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
  const ago = oneMonthAgo.toISOString().slice(0, 10)

  // Count active quests right now:
  const { count: nowCount, error: e1 } = await supabaseAdmin
    .from('admin_quests')
    .select('id', {
      count: 'exact',
      head: true,
    })
    .eq('is_active', true)

  // Count how many were active one month ago:
  // (start_at <= ago AND (end_at IS NULL OR end_at >= ago))
  const filter = `end_at.gte.${ago},end_at.is.null`
  const { count: pastCount, error: e2 } = await supabaseAdmin
    .from('admin_quests')
    .select('id', { count: 'exact', head: true })
    .lte('start_at', ago)
    .or(filter)

  if (e1 || e2) {
    console.error(e1 ?? e2)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  return NextResponse.json({
    activeNow: nowCount,
    activeOneMonthAgo: pastCount,
  })
}
