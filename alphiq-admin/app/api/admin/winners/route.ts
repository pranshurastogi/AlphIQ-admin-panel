// app/api/admin/winners/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const questId = searchParams.get('quest_id')
    const createdBy = searchParams.get('created_by')
    const search = searchParams.get('search')

    let query = supabaseAdmin
      .from('admin_quest_winners')
      .select(`
        *,
        quest:admin_quests(
          id,
          title,
          description,
          created_by,
          is_active,
          creator:admin_user_profiles!admin_quests_created_by_fkey(full_name)
        ),
        submission:admin_quest_submissions(
          id,
          proof_url,
          proof_data,
          submitted_at
        ),
        awarder:admin_user_profiles!admin_quest_winners_awarded_by_fkey(full_name)
      `)
      .order('awarded_at', { ascending: false })

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (questId && questId !== 'all') {
      query = query.eq('quest_id', questId)
    }

    if (createdBy && createdBy !== 'all') {
      query = query.eq('quest.created_by', createdBy)
    }

    if (search) {
      query = query.or(`user_address.ilike.%${search}%,display_name.ilike.%${search}%,tx_hash.ilike.%${search}%`)
    }

    const { data: winners, error } = await query

    if (error) {
      console.error('Error fetching winners:', error)
      return NextResponse.json({ error: 'Failed to fetch winners' }, { status: 500 })
    }

    // Filter out winners with null quest objects (orphaned winners)
    const validWinners = (winners || []).filter(w => w.quest)

    // Calculate stats
    const stats = {
      total: validWinners.length,
      pending: validWinners.filter(w => w.status === 'pending').length,
      awarded: validWinners.filter(w => w.status === 'awarded').length,
      failed: validWinners.filter(w => w.status === 'failed').length,
      cancelled: validWinners.filter(w => w.status === 'cancelled').length,
      totalAmount: validWinners.reduce((sum, w) => sum + (w.winning_amount || 0), 0),
      totalAmountUSD: validWinners.reduce((sum, w) => sum + (w.approx_amount_usd || 0), 0),
    }

    return NextResponse.json({
      winners: validWinners,
      stats
    })
  } catch (error) {
    console.error('Error in winners API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      quest_id, 
      submission_id, 
      user_address, 
      display_name, 
      info, 
      winning_amount, 
      winning_token, 
      approx_amount_usd, 
      exchange_rate_usd, 
      pricing_source, 
      priced_at, 
      status, 
      comments, 
      tx_hash, 
      proof_url, 
      awarded_by 
    } = body

    // Validate required fields
    if (!quest_id || !user_address || !winning_amount) {
      return NextResponse.json({ 
        error: 'Missing required fields: quest_id, user_address, winning_amount' 
      }, { status: 400 })
    }

    // Check if winner already exists for this quest and user
    const { data: existingWinner } = await supabaseAdmin
      .from('admin_quest_winners')
      .select('winner_id')
      .eq('quest_id', quest_id)
      .eq('user_address', user_address)
      .single()

    if (existingWinner) {
      return NextResponse.json({ 
        error: 'Winner already exists for this quest and user' 
      }, { status: 409 })
    }

    const { data: winner, error } = await supabaseAdmin
      .from('admin_quest_winners')
      .insert({
        quest_id,
        submission_id,
        user_address,
        display_name,
        info,
        winning_amount,
        winning_token,
        approx_amount_usd,
        exchange_rate_usd,
        pricing_source,
        priced_at,
        status: status || 'pending',
        comments,
        tx_hash,
        proof_url,
        awarded_by,
        awarded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating winner:', error)
      return NextResponse.json({ error: 'Failed to create winner' }, { status: 500 })
    }

    return NextResponse.json({ winner }, { status: 201 })
  } catch (error) {
    console.error('Error in winners POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { winner_id, ...updateData } = body

    if (!winner_id) {
      return NextResponse.json({ error: 'Missing winner_id' }, { status: 400 })
    }

    const { data: winner, error } = await supabaseAdmin
      .from('admin_quest_winners')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('winner_id', winner_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating winner:', error)
      return NextResponse.json({ error: 'Failed to update winner' }, { status: 500 })
    }

    return NextResponse.json({ winner })
  } catch (error) {
    console.error('Error in winners PUT API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const winner_id = searchParams.get('winner_id')

    if (!winner_id) {
      return NextResponse.json({ error: 'Missing winner_id' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('admin_quest_winners')
      .delete()
      .eq('winner_id', winner_id)

    if (error) {
      console.error('Error deleting winner:', error)
      return NextResponse.json({ error: 'Failed to delete winner' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Winner deleted successfully' })
  } catch (error) {
    console.error('Error in winners DELETE API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
