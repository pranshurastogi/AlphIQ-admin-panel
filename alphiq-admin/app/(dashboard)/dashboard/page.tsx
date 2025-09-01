'use client'

import { useDashboardData } from '@/hooks/useDashboardData'
import {
  MetricsCard,
  ChartCard,
  EnhancedXPChart,
  EnhancedSubmissionsChart,
  TopUsersChart,
  EnhancedTopPartners,
  RecentActivity,
  ErrorBoundary,
  LoadingSkeleton
} from '@/components/dashboard'
import { formatXP, formatTime, getChangeIndicator } from '@/lib/dashboard-utils'
import {
  Activity,
  Award,
  Clock,
  Users,
} from 'lucide-react'

export default function DashboardPage() {
  const { data, loading, error, refetch } = useDashboardData()

  if (loading) {
    return <LoadingSkeleton />
  }

  if (!data) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-4xl font-heading font-bold text-primary">Dashboard</h1>
          <p className="text-muted-foreground text-lg mt-2">
            Overview of your AlphIQ Quests & XP ecosystem
          </p>
        </div>
        <ErrorBoundary error={error} onRetry={refetch}>
          <div className="text-center py-12">
            <p className="text-muted-foreground">No data available</p>
          </div>
        </ErrorBoundary>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-4xl font-heading font-bold text-primary">Dashboard</h1>
        <p className="text-muted-foreground text-lg mt-2">
          Overview of your AlphIQ Quests & XP ecosystem
        </p>
      </div>



      <ErrorBoundary error={error} onRetry={refetch}>
        {/* KPI Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricsCard
            title="Active Quests"
            value={data.activeQuests}
            icon={Activity}
            change={getChangeIndicator(data.activeQuests, data.activeQuests - 2)}
          />
          
          <MetricsCard
            title="Pending Submissions"
            value={data.pendingSubmissions}
            icon={Clock}
            change={getChangeIndicator(data.pendingSubmissions, data.pendingSubmissions + 12)}
          />
          
          <MetricsCard
            title="Total XP Circulated"
            value={formatXP(data.totalXP)}
            icon={Award}
            change={getChangeIndicator(data.totalXP, data.totalXP * 0.85)}
          />
          
          <MetricsCard
            title="Avg Approval Time"
            value={formatTime(data.avgApprovalTime)}
            icon={Users}
            change={getChangeIndicator(data.avgApprovalTime, data.avgApprovalTime + 0.5)}
          />
        </div>

                {/* Charts Row 1 */}
        <div className="grid gap-6 lg:grid-cols-2">
          <EnhancedXPChart data={data.xpTrend} insights={data.xpInsights} />

          <ChartCard
            title="Submissions Status"
            description="Distribution of submission review status with detailed breakdown"
          >
            <EnhancedSubmissionsChart 
              data={data.submissionData} 
              details={data.submissionDetails}
            />
          </ChartCard>
        </div>

        {/* Charts Row 2 */}
        <div className="grid gap-6 lg:grid-cols-3">
          <ChartCard
            title="Top Users by XP"
            description="Highest earning users in the ecosystem"
            className="lg:col-span-2"
          >
            <TopUsersChart data={data.topUsers} />
          </ChartCard>

          <ChartCard
            title="Recent Activity"
            description="Latest system events"
          >
            <RecentActivity data={data.recentActivity} />
          </ChartCard>
        </div>

        {/* Enhanced Top Partners */}
        <EnhancedTopPartners data={data.topPartners} />
      </ErrorBoundary>
    </div>
  )
}
