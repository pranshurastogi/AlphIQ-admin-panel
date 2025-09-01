import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    // Fetch all metrics in parallel for better performance
    const [
      activeQuestsResult,
      pendingSubmissionsResult,
      totalXPResult,
      approvalTimeResult,
      topUsersResult,
      topPartnersResult,
      partnerProfilesResult,
      submissionStatsResult,
      recentActivityResult,
      xpTrendResult,
      questCategoriesResult
    ] = await Promise.all([
      // Active Quests
      supabase
        .from('admin_quests')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true),
      
      // Pending Submissions
      supabase
        .from('admin_quest_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      
      // Total XP Circulated
      supabase
        .from('admin_user_xp_history')
        .select('change'),
      
      // Average Approval Time (simplified - could be enhanced with actual approval timestamps)
      supabase
        .from('admin_quest_submissions')
        .select('submitted_at, reviewed_at')
        .not('reviewed_at', 'is', null)
        .limit(100),
      
      // Top Users by XP
      supabase
        .from('users')
        .select('address, admin_total_xp, title')
        .order('admin_total_xp', { ascending: false })
        .limit(10),
      
      // Top Partners with detailed information
      supabase
        .from('admin_quests')
        .select(`
          partner_id, 
          xp_reward, 
          title,
          created_at
        `)
        .eq('is_active', true),
      
      // Get partner profiles for names
      supabase
        .from('admin_user_profiles')
        .select('id, full_name, partner_name, partner_id, role, approved, created_at'),
      
      // Submission Status Distribution with more details
      supabase
        .from('admin_quest_submissions')
        .select('status, quest_id, user_address, submitted_at'),
      
      // Recent Activity (simplified - could be enhanced with more activity types)
      supabase
        .from('admin_quest_submissions')
        .select('id, user_address, status, submitted_at, quest_id')
        .order('submitted_at', { ascending: false })
        .limit(10),
      
      // XP Trend with more detailed data
      supabase
        .from('admin_user_xp_history')
        .select('change, created_at, reason, user_address')
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()) // Last 90 days
        .order('created_at', { ascending: true }),
      
      // Get quest categories for XP analysis
      supabase
        .from('admin_quest_categories')
        .select('id, name, description'),
    ])

    // Process results
    const activeQuests = activeQuestsResult.count || 0
    const pendingSubmissions = pendingSubmissionsResult.count || 0
    
    // Calculate total XP
    const totalXP = totalXPResult.data?.reduce((sum, record) => sum + (record.change || 0), 0) || 0
    
    // Calculate average approval time
    const approvalTimes = approvalTimeResult.data?.map(record => {
      if (record.submitted_at && record.reviewed_at) {
        return new Date(record.reviewed_at).getTime() - new Date(record.submitted_at).getTime()
      }
      return 0
    }).filter(time => time > 0) || []
    
    const avgApprovalTime = approvalTimes.length > 0 
      ? Math.round(approvalTimes.reduce((sum, time) => sum + time, 0) / approvalTimes.length / (1000 * 60 * 60))
      : 0
    
    // Process top users
    const topUsers = topUsersResult.data?.map(user => ({
      user: user.address?.slice(0, 6) + '...' + user.address?.slice(-4) || 'Unknown',
      xp: user.admin_total_xp || 0,
      title: user.title || 'No Title'
    })) || []
    
    // Process submission stats with more details
    const submissionStats = submissionStatsResult.data?.reduce((acc, record) => {
      acc[record.status] = (acc[record.status] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}
    
    // Get additional submission details
    const submissionDetails = {
      total: submissionStatsResult.data?.length || 0,
      byStatus: submissionStats,
      averagePerDay: calculateAverageSubmissionsPerDay(submissionStatsResult.data || [])
    }
    
    // Convert to chart format
    const submissionData = [
      { 
        name: 'Approved', 
        value: submissionStats.approved || 0, 
        color: 'hsl(var(--chart-1))',
        percentage: submissionDetails.total > 0 ? Math.round(((submissionStats.approved || 0) / submissionDetails.total) * 100) : 0
      },
      { 
        name: 'Pending', 
        value: submissionStats.pending || 0, 
        color: 'hsl(var(--chart-2))',
        percentage: submissionDetails.total > 0 ? Math.round(((submissionStats.pending || 0) / submissionDetails.total) * 100) : 0
      },
      { 
        name: 'Rejected', 
        value: submissionStats.rejected || 0, 
        color: 'hsl(var(--chart-3))',
        percentage: submissionDetails.total > 0 ? Math.round(((submissionStats.rejected || 0) / submissionDetails.total) * 100) : 0
      },
    ]
    
    // Process recent activity
    const recentActivity = recentActivityResult.data?.map(record => ({
      type: 'submission',
      user: record.user_address?.slice(0, 6) + '...' + record.user_address?.slice(-4) || 'Unknown',
      action: `submission ${record.status}`,
      quest: `Quest #${record.quest_id}`,
      time: getTimeAgo(record.submitted_at)
    })) || []
    
    // Process XP trend with enhanced insights
    const xpTrendData = processXPTrend(xpTrendResult.data || [])
    const xpInsights = generateXPInsights(xpTrendResult.data || [], questCategoriesResult.data || [])
    
    // Process top partners with detailed information
    const partnerStats = topPartnersResult.data?.reduce((acc, record) => {
      const partnerId = record.partner_id
      if (!acc[partnerId]) {
        acc[partnerId] = { 
          quests: 0, 
          xp: 0, 
          questTitles: []
        }
      }
      acc[partnerId].quests += 1
      acc[partnerId].xp += record.xp_reward || 0
      if (record.title) {
        acc[partnerId].questTitles.push(record.title)
      }
      return acc
    }, {} as Record<string, { 
      quests: number; 
      xp: number; 
      questTitles: string[] 
    }>) || {}
    
    // Create a map of partner profiles for easy lookup
    const partnerProfilesMap = new Map()
    partnerProfilesResult.data?.forEach(profile => {
      partnerProfilesMap.set(profile.partner_id, profile)
    })
    
    const topPartners = Object.entries(partnerStats)
      .map(([partnerId, stats]) => {
        const profile = partnerProfilesMap.get(partnerId)
        return {
          partner: profile?.partner_name || 'Unknown Partner',
          quests: stats.quests,
          xp: stats.xp,
          fullName: profile?.full_name || 'Unknown',
          questTitles: stats.questTitles.slice(0, 3), // Show first 3 quest titles
          role: profile?.role || 'viewer',
          approved: profile?.approved || false,
          joinedAt: profile?.created_at || null,
          avgXPPerQuest: stats.quests > 0 ? Math.round(stats.xp / stats.quests) : 0
        }
      })
      .sort((a, b) => b.xp - a.xp)
      .slice(0, 4)

    return NextResponse.json({
      success: true,
      data: {
        activeQuests,
        pendingSubmissions,
        totalXP,
        avgApprovalTime,
        topUsers,
        submissionData,
        submissionDetails,
        recentActivity,
        xpTrend: xpTrendData,
        xpInsights,
        topPartners
      }
    })
  } catch (error) {
    console.error('Dashboard metrics error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard metrics' },
      { status: 500 }
    )
  }
}

function getTimeAgo(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
}

function processXPTrend(data: Array<{ change: number, created_at: string }>) {
  const days = 30 // Show last 30 days instead of weeks
  const dayData = []
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    
    const dayXP = data
      .filter(record => {
        const recordDate = new Date(record.created_at)
        return recordDate.toDateString() === date.toDateString()
      })
      .reduce((sum, record) => sum + (record.change || 0), 0)
    
    dayData.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      xp: dayXP,
      fullDate: date.toISOString().split('T')[0]
    })
  }
  
  return dayData
}

function calculateAverageSubmissionsPerDay(submissions: Array<{ submitted_at: string }>) {
  if (submissions.length === 0) return 0
  
  const dates = [...new Set(submissions.map(s => s.submitted_at.split('T')[0]))]
  return Math.round(submissions.length / dates.length)
}

function generateXPInsights(xpData: Array<{ change: number, created_at: string, reason: string, user_address: string }>, categories: Array<{ id: number, name: string, description: string }>) {
  if (xpData.length === 0) return {
    totalXP: 0,
    averageXPPerDay: 0,
    topReasons: [],
    userDistribution: {},
    categoryBreakdown: {},
    growthRate: 0,
    peakDay: null,
    totalUsers: 0
  }

  // Calculate basic metrics
  const totalXP = xpData.reduce((sum, record) => sum + (record.change || 0), 0)
  const uniqueDates = [...new Set(xpData.map(record => record.created_at.split('T')[0]))]
  const averageXPPerDay = Math.round(totalXP / uniqueDates.length)
  
  // Top reasons for XP
  const reasonCounts = xpData.reduce((acc, record) => {
    acc[record.reason] = (acc[record.reason] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const topReasons = Object.entries(reasonCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([reason, count]) => ({ reason, count }))
  
  // User distribution
  const userXP = xpData.reduce((acc, record) => {
    acc[record.user_address] = (acc[record.user_address] || 0) + (record.change || 0)
    return acc
  }, {} as Record<string, number>)
  
  const userDistribution = {
    totalUsers: Object.keys(userXP).length,
    topEarners: Object.entries(userXP)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([user, xp]) => ({ user: user.slice(0, 6) + '...' + user.slice(-4), xp }))
  }
  
  // Growth rate (comparing first and last week)
  const sortedData = xpData.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  const firstWeek = sortedData.slice(0, Math.ceil(sortedData.length / 4))
  const lastWeek = sortedData.slice(-Math.ceil(sortedData.length / 4))
  
  const firstWeekXP = firstWeek.reduce((sum, record) => sum + (record.change || 0), 0)
  const lastWeekXP = lastWeek.reduce((sum, record) => sum + (record.change || 0), 0)
  const growthRate = firstWeekXP > 0 ? Math.round(((lastWeekXP - firstWeekXP) / firstWeekXP) * 100) : 0
  
  // Peak day
  const dailyXP = xpData.reduce((acc, record) => {
    const date = record.created_at.split('T')[0]
    acc[date] = (acc[date] || 0) + (record.change || 0)
    return acc
  }, {} as Record<string, number>)
  
  const peakDay = Object.entries(dailyXP)
    .sort(([,a], [,b]) => b - a)[0]
  
  return {
    totalXP,
    averageXPPerDay,
    topReasons,
    userDistribution,
    growthRate,
    peakDay: peakDay ? { date: peakDay[0], xp: peakDay[1] } : null,
    totalUsers: userDistribution.totalUsers
  }
}
