// app/(dashboard)/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from 'recharts'
import {
  Activity,
  Award,
  Clock,
  Users,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'

// ——— Static data (unchanged) ———
const xpData = [
  { week: 'Week 1', xp: 2400 },
  { week: 'Week 2', xp: 1398 },
  { week: 'Week 3', xp: 9800 },
  { week: 'Week 4', xp: 3908 },
  { week: 'Week 5', xp: 4800 },
  { week: 'Week 6', xp: 3800 },
  { week: 'Week 7', xp: 4300 },
]

const submissionData = [
  { name: 'Approved', value: 65, color: 'hsl(var(--chart-1))' },
  { name: 'Pending', value: 25, color: 'hsl(var(--chart-2))' },
  { name: 'Rejected', value: 10, color: 'hsl(var(--chart-3))' },
]

const topUsersData = [
  { user: '0x1234...5678', xp: 15420 },
  { user: '0x2345...6789', xp: 12350 },
  { user: '0x3456...7890', xp: 11200 },
  { user: '0x4567...8901', xp: 9800 },
  { user: '0x5678...9012', xp: 8750 },
  { user: '0x6789...0123', xp: 7600 },
  { user: '0x7890...1234', xp: 6900 },
  { user: '0x8901...2345', xp: 6200 },
  { user: '0x9012...3456', xp: 5800 },
  { user: '0x0123...4567', xp: 5400 },
]

const topPartnersData = [
  { partner: 'DeFi Protocol A', quests: 12, xp: 45000 },
  { partner: 'NFT Marketplace B', quests: 8, xp: 32000 },
  { partner: 'Gaming Platform C', quests: 15, xp: 28000 },
  { partner: 'Social Network D', quests: 6, xp: 18000 },
]

const recentActivity = [
  {
    type: 'submission',
    user: '0x1234...5678',
    action: 'submitted quest proof',
    quest: 'DeFi Swap',
    time: '2 min ago',
  },
  { type: 'user', user: '0x2345...6789', action: 'reached Level 5', time: '5 min ago' },
  {
    type: 'quest',
    user: 'Admin',
    action: 'created new quest',
    quest: 'NFT Minting',
    time: '10 min ago',
  },
  {
    type: 'submission',
    user: '0x3456...7890',
    action: 'submission approved',
    quest: 'Social Share',
    time: '15 min ago',
  },
]

// ——— Component ———
export default function DashboardPage() {
  // only this one is fetched live:
  const [activeQuests, setActiveQuests] = useState<number | null>(null)
  const [loadingQuests, setLoadingQuests] = useState(true)

  useEffect(() => {
    async function fetchActiveQuests() {
      setLoadingQuests(true)
      try {
        const { count, error } = await supabase
          .from('admin_quests')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true)

        if (error) {
          console.error('Error loading active quests:', error)
          setActiveQuests(null)
        } else {
          setActiveQuests(count ?? 0)
        }
      } catch (err) {
        console.error('Unexpected error:', err)
        setActiveQuests(null)
      } finally {
        setLoadingQuests(false)
      }
    }

    fetchActiveQuests()
  }, [])

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-4xl font-heading font-bold text-primary">Dashboard</h1>
        <p className="text-muted-foreground text-lg mt-2">
          Overview of your AlphIQ Quests & XP ecosystem
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Active Quests (live) */}
        <Card className="glass-card">
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Active Quests</CardTitle>
            <Activity className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {loadingQuests ? '...' : activeQuests}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-4 w-4 text-mint" />
              <p className="text-xs text-mint">+2 from last month</p>
            </div>
          </CardContent>
        </Card>

        {/* All other cards remain static */}
        <Card className="glass-card">
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pending Submissions</CardTitle>
            <Clock className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">156</div>
            <div className="flex items-center gap-1 mt-1">
              <ArrowDownRight className="h-4 w-4 text-mint" />
              <p className="text-xs text-mint">-12% from yesterday</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total XP Circulated</CardTitle>
            <Award className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">1.23M</div>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-4 w-4 text-mint" />
              <p className="text-xs text-mint">+15% from last week</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Avg Approval Time</CardTitle>
            <Users className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">2.4h</div>
            <div className="flex items-center gap-1 mt-1">
              <ArrowDownRight className="h-4 w-4 text-mint" />
              <p className="text-xs text-mint">-0.5h improvement</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-xl font-heading text-primary">
              XP Distribution Trend
            </CardTitle>
            <CardDescription>Total experience points distributed over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                xp: { label: 'XP', color: 'hsl(var(--chart-1))' },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={xpData}>
                  <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="xp"
                    stroke="var(--color-xp)"
                    fill="var(--color-xp)"
                    fillOpacity={0.3}
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-xl font-heading text-primary">
              Submissions Status
            </CardTitle>
            <CardDescription>
              Distribution of submission review status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                approved: { label: 'Approved', color: 'hsl(var(--chart-1))' },
                pending: { label: 'Pending', color: 'hsl(var(--chart-2))' },
                rejected: { label: 'Rejected', color: 'hsl(var(--chart-3))' },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={submissionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {submissionData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl font-heading text-primary">
              Top Users by XP
            </CardTitle>
            <CardDescription>
              Highest earning users in the ecosystem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                xp: { label: 'XP', color: 'hsl(var(--chart-1))' },
              }}
              className="h-[400px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topUsersData} layout="horizontal">
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                  <YAxis
                    dataKey="user"
                    type="category"
                    width={100}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="xp" fill="var(--color-xp)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-xl font-heading text-primary">
              Recent Activity
            </CardTitle>
            <CardDescription>Latest system events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === 'submission'
                        ? 'bg-primary'
                        : activity.type === 'user'
                        ? 'bg-accent'
                        : 'bg-chart-3'
                    }`}
                  />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">
                      <span className="font-medium text-primary">{activity.user}</span>
                      <span className="text-muted-foreground">
                        {' '}
                        {activity.action}
                      </span>
                      {activity.quest && (
                        <span className="font-medium">
                          {' '}
                          "{activity.quest}"
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Partners (static) */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-xl font-heading text-primary">
            Top Partners
          </CardTitle>
          <CardDescription>
            Partners by quest creation and XP distribution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              xp: { label: 'XP Distributed', color: 'hsl(var(--chart-1))' },
              quests: { label: 'Quests Created', color: 'hsl(var(--chart-2))' },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topPartnersData}>
                <XAxis dataKey="partner" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="xp" fill="var(--color-xp)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
