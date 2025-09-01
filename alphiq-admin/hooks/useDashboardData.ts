import { useState, useEffect } from 'react'

export interface DashboardMetrics {
  activeQuests: number
  pendingSubmissions: number
  totalXP: number
  avgApprovalTime: number
  topUsers: Array<{
    user: string
    xp: number
    title: string
  }>
  submissionData: Array<{
    name: string
    value: number
    color: string
    percentage: number
  }>
  recentActivity: Array<{
    type: string
    user: string
    action: string
    quest: string
    time: string
  }>
  xpTrend: Array<{
    date: string
    xp: number
    fullDate: string
  }>
  xpInsights: {
    totalXP: number
    averageXPPerDay: number
    topReasons: Array<{ reason: string; count: number }>
    userDistribution: {
      totalUsers: number
      topEarners: Array<{ user: string; xp: number }>
    }
    growthRate: number
    peakDay: { date: string; xp: number } | null
    totalUsers: number
  }
  topPartners: Array<{
    partner: string
    quests: number
    xp: number
    fullName: string
    questTitles: string[]
    role: string
    approved: boolean
    joinedAt: string | null
    avgXPPerQuest: number
  }>
  submissionDetails: {
    total: number
    byStatus: Record<string, number>
    averagePerDay: number
  }
}

interface UseDashboardDataReturn {
  data: DashboardMetrics | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useDashboardData(refreshInterval = 300000): UseDashboardDataReturn { // 5 minutes default
  const [data, setData] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/dashboard/metrics')
      const result = await response.json()
      
      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error || 'Failed to fetch dashboard data')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    
    // Set up periodic refresh
    const interval = setInterval(fetchData, refreshInterval)
    
    return () => clearInterval(interval)
  }, [refreshInterval])

  const refetch = async () => {
    await fetchData()
  }

  return {
    data,
    loading,
    error,
    refetch
  }
}
