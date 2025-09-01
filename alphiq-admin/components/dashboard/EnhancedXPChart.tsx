'use client'

import { useState } from 'react'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Area, AreaChart, XAxis, YAxis, ResponsiveContainer, Bar, BarChart, Line, LineChart, CartesianGrid, Pie, PieChart, Cell } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TrendingUp, TrendingDown, Users, Award, Calendar, BarChart3, PieChart as PieChartIcon, Activity } from 'lucide-react'

interface XPTrendData {
  date: string
  xp: number
  fullDate: string
}

interface XPInsights {
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

interface EnhancedXPChartProps {
  data: XPTrendData[]
  insights: XPInsights
  className?: string
}

type ChartView = 'trend' | 'distribution' | 'reasons'
type TimeFilter = '7d' | '30d' | '60d' | '90d'

export function EnhancedXPChart({ data, insights, className = 'h-[400px]' }: EnhancedXPChartProps) {
  const [chartView, setChartView] = useState<ChartView>('trend')
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('30d')
  const [showInsights, setShowInsights] = useState(true)

  const getFilteredData = () => {
    const days = parseInt(timeFilter.replace('d', ''))
    return data.slice(-days)
  }

  const getDynamicInsights = () => {
    const filteredData = getFilteredData()
    
    if (filteredData.length === 0) return {
      totalXP: 0,
      averageXPPerDay: 0,
      totalUsers: 0,
      growthRate: 0,
      peakDay: null
    }

    // Calculate total XP for filtered period
    const totalXP = filteredData.reduce((sum, day) => sum + day.xp, 0)
    const averageXPPerDay = Math.round(totalXP / filteredData.length)
    
    // Calculate growth rate (comparing first and last third of the period)
    const third = Math.ceil(filteredData.length / 3)
    const firstThird = filteredData.slice(0, third)
    const lastThird = filteredData.slice(-third)
    
    const firstThirdXP = firstThird.reduce((sum, day) => sum + day.xp, 0)
    const lastThirdXP = lastThird.reduce((sum, day) => sum + day.xp, 0)
    const growthRate = firstThirdXP > 0 ? Math.round(((lastThirdXP - firstThirdXP) / firstThirdXP) * 100) : 0
    
    // Find peak day in filtered period
    const peakDay = filteredData.reduce((peak, day) => 
      day.xp > peak.xp ? { date: day.date, xp: day.xp } : peak, 
      { date: '', xp: 0 }
    )
    
    return {
      totalXP,
      averageXPPerDay,
      totalUsers: insights.totalUsers, // Keep total users from full dataset
      growthRate,
      peakDay: peakDay.xp > 0 ? peakDay : null
    }
  }

  const getGrowthIcon = () => {
    const dynamicInsights = getDynamicInsights()
    if (dynamicInsights.growthRate > 0) {
      return <TrendingUp className="h-4 w-4 text-green-500" />
    } else if (dynamicInsights.growthRate < 0) {
      return <TrendingDown className="h-4 w-4 text-red-500" />
    }
    return <Activity className="h-4 w-4 text-gray-500" />
  }

  const getGrowthColor = () => {
    const dynamicInsights = getDynamicInsights()
    if (dynamicInsights.growthRate > 0) return 'text-green-600'
    if (dynamicInsights.growthRate < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const renderChart = () => {
    const filteredData = getFilteredData()

    switch (chartView) {
      case 'trend':
        return (
          <AreaChart data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              angle={-45}
              textAnchor="end"
              height={60}
              interval="preserveStartEnd"
            />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="xp"
              stroke="hsl(var(--chart-1))"
              fill="hsl(var(--chart-1))"
              fillOpacity={0.3}
              strokeWidth={3}
            />
          </AreaChart>
        )

      case 'distribution':
        return (
          <BarChart data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              angle={-45}
              textAnchor="end"
              height={60}
              interval="preserveStartEnd"
            />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="xp" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
          </BarChart>
        )

      case 'reasons':
        const reasonData = insights.topReasons.map(reason => ({
          name: reason.reason,
          value: reason.count,
          color: `hsl(${Math.random() * 360}, 70%, 50%)`
        }))
        return (
          <PieChart>
            <Pie
              data={reasonData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              paddingAngle={5}
              dataKey="value"
            >
              {reasonData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
          </PieChart>
        )



      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">XP Distribution Trend</h3>
          <p className="text-sm text-muted-foreground">
            Comprehensive analysis of experience points distribution over time
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={timeFilter} onValueChange={(value: TimeFilter) => setTimeFilter(value)}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
              <SelectItem value="60d">60 days</SelectItem>
              <SelectItem value="90d">90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={chartView} onValueChange={(value: ChartView) => setChartView(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="trend">Trend</SelectItem>
              <SelectItem value="distribution">Distribution</SelectItem>
              <SelectItem value="reasons">Reasons</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowInsights(!showInsights)}
          >
            {showInsights ? 'Hide' : 'Show'} Insights
          </Button>
        </div>
      </div>

      {/* Insights Cards */}
      {showInsights && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Award className="h-4 w-4" />
              Total XP ({timeFilter})
            </CardTitle>
            <CardContent className="p-0 pt-2">
              <div className="text-2xl font-bold">{getDynamicInsights().totalXP.toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card className="p-4">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Avg XP/Day ({timeFilter})
            </CardTitle>
            <CardContent className="p-0 pt-2">
              <div className="text-2xl font-bold">{getDynamicInsights().averageXPPerDay.toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card className="p-4">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Users
            </CardTitle>
            <CardContent className="p-0 pt-2">
              <div className="text-2xl font-bold">{insights.totalUsers}</div>
            </CardContent>
          </Card>
          
          <Card className="p-4">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              {getGrowthIcon()}
              Growth Rate ({timeFilter})
            </CardTitle>
            <CardContent className="p-0 pt-2">
              <div className={`text-2xl font-bold ${getGrowthColor()}`}>
                {getDynamicInsights().growthRate > 0 ? '+' : ''}{getDynamicInsights().growthRate}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Additional Insights */}
      {showInsights && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Peak Day */}
          {getDynamicInsights().peakDay && (
            <Card className="p-4">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Peak Day ({timeFilter})
              </CardTitle>
              <CardContent className="p-0 pt-2">
                <div className="text-lg font-bold">{getDynamicInsights().peakDay.date}</div>
                <div className="text-sm text-muted-foreground">
                  {getDynamicInsights().peakDay.xp.toLocaleString()} XP distributed
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Top Reasons */}
          <Card className="p-4">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Top XP Reasons
            </CardTitle>
            <CardContent className="p-0 pt-2">
              <div className="space-y-2">
                {insights.topReasons.slice(0, 3).map((reason, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="truncate">{reason.reason}</span>
                    <Badge variant="secondary">{reason.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Chart */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-xl font-heading text-primary">
            {chartView === 'trend' && 'XP Trend Over Time'}
            {chartView === 'distribution' && 'XP Distribution by Day'}
            {chartView === 'reasons' && 'XP Distribution by Reason'}
          </CardTitle>
          <CardDescription>
            {chartView === 'trend' && 'Experience points distribution trend over the selected period'}
            {chartView === 'distribution' && 'Daily XP distribution showing patterns and spikes'}
            {chartView === 'reasons' && 'Breakdown of XP distribution by reason/category'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              xp: { label: 'XP', color: 'hsl(var(--chart-1))' },
            }}
            className={className}
          >
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
