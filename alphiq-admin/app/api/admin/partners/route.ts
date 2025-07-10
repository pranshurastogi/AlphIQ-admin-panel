// app/api/admin/partners/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkSupabaseConnection } from '@/lib/supabaseClient'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
)

export async function GET() {
  // Check DB connection first
  const dbStatus = await checkSupabaseConnection(supabaseAdmin)
  if (!dbStatus.connected) {
    const details = typeof dbStatus.error === 'object' && dbStatus.error && 'message' in dbStatus.error ? dbStatus.error.message : String(dbStatus.error)
    console.error('Supabase DB connection failed:', dbStatus.error)
    return NextResponse.json({ error: 'Database connection failed', details }, { status: 500 })
  }

  // Join quests → partners, group by partner_name
  const { data, error } = await supabaseAdmin
    .from('admin_quests')
    .select(`
      partner:partner_id (
        partner_name
      ),
      id,
      xp_reward
    `)

  if (error) {
    const details = typeof error === 'object' && error && 'message' in error ? error.message : String(error)
    console.error('Supabase query error:', error)
    return NextResponse.json({ error: 'Database query error', details }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'No data returned from database.' }, { status: 500 })
  }

  // Aggregate in-memory
  const agg: Record<string, { quests: number; xp: number }> = {}
  data.forEach((row) => {
    let name = 'Unknown Partner'
    if (row.partner) {
      if (Array.isArray(row.partner) && row.partner.length > 0 && row.partner[0].partner_name) {
        name = String(row.partner[0].partner_name)
      } else if (typeof row.partner === 'object' && 'partner_name' in row.partner) {
        name = String(row.partner.partner_name)
      }
    }
    if (!agg[name]) agg[name] = { quests: 0, xp: 0 }
    agg[name].quests++
    agg[name].xp += row.xp_reward
  })

  // to array, sorted by xp descending
  const partners = Object.entries(agg)
    .map(([partner, { quests, xp }]) => ({ partner, quests, xp }))
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 10)

  return NextResponse.json(partners)
}
