import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Pie, PieChart, Cell, Line, LineChart, CartesianGrid, Tooltip } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Award, Users, TrendingUp, CheckCircle, Clock } from 'lucide-react'
import { ChartCard } from './ChartCard'

interface PartnerData {
  partner: string
  quests: number
  xp: number
  fullName: string
  questTitles: string[]
  role: string
  approved: boolean
  joinedAt: string | null
  avgXPPerQuest: number
}

interface EnhancedTopPartnersProps {
  data: PartnerData[]
  className?: string
}

export function EnhancedTopPartners({ data, className = '' }: EnhancedTopPartnersProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown'
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    })
  }

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'bg-red-500'
      case 'editor': return 'bg-blue-500'
      case 'viewer': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getApprovalStatus = (approved: boolean) => {
    return approved ? (
      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
        <CheckCircle className="w-3 h-3 mr-1" />
        Approved
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </Badge>
    )
  }

  // Prepare data for different chart types
  const questsData = data.map(partner => ({
    partner: partner.partner,
    quests: partner.quests,
    xp: partner.xp
  }))

  const xpDistributionData = data.map(partner => ({
    name: partner.partner,
    value: partner.xp,
    color: `hsl(${Math.random() * 360}, 70%, 50%)`
  }))

  const efficiencyData = data.map(partner => ({
    partner: partner.partner,
    avgXP: partner.avgXPPerQuest,
    totalXP: partner.xp
  }))

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
            <Users className="h-4 w-4" />
            Total Partners
          </CardTitle>
          <CardContent className="p-0 pt-2">
            <div className="text-2xl font-bold">{data.length}</div>
          </CardContent>
        </Card>
        
        <Card className="p-4">
          <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
            <Award className="h-4 w-4" />
            Total Quests
          </CardTitle>
          <CardContent className="p-0 pt-2">
            <div className="text-2xl font-bold">
              {data.reduce((sum, partner) => sum + partner.quests, 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card className="p-4">
          <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Total XP Distributed
          </CardTitle>
          <CardContent className="p-0 pt-2">
            <div className="text-2xl font-bold">
              {data.reduce((sum, partner) => sum + partner.xp, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        
        <Card className="p-4">
          <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Approved Partners
          </CardTitle>
          <CardContent className="p-0 pt-2">
            <div className="text-2xl font-bold">
              {data.filter(partner => partner.approved).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quest Creation Chart */}
        <ChartCard
          title="Quests by Partner"
          description="Number of quests created by each partner"
        >
          <ChartContainer
            config={{
              quests: { label: 'Quests', color: 'hsl(var(--chart-1))' },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={questsData}>
                <XAxis 
                  dataKey="partner" 
                  stroke="hsl(var(--muted-foreground))"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval="preserveStartEnd"
                />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="quests" fill="var(--color-quests)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </ChartCard>

        {/* XP Distribution Pie Chart */}
        <ChartCard
          title="XP Distribution"
          description="XP distributed by each partner"
        >
          <ChartContainer
            config={{
              xp: { label: 'XP', color: 'hsl(var(--chart-2))' },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={xpDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {xpDistributionData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Efficiency Chart */}
        <ChartCard
          title="Partner Efficiency"
          description="Average XP per quest by partner"
        >
          <ChartContainer
            config={{
              avgXP: { label: 'Avg XP per Quest', color: 'hsl(var(--chart-3))' },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={efficiencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
                <XAxis 
                  dataKey="partner" 
                  stroke="hsl(var(--muted-foreground))"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval="preserveStartEnd"
                />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="avgXP" 
                  stroke="hsl(var(--chart-3))" 
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--chart-3))", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "hsl(var(--chart-3))", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </ChartCard>

        {/* Partner Details Table */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-xl font-heading text-primary">
              Partner Details
            </CardTitle>
            <CardDescription>
              Comprehensive partner information and statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {data.map((partner, index) => (
                <div key={index} className="p-4 bg-muted/30 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-primary">{partner.partner}</h4>
                    {getApprovalStatus(partner.approved)}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Quests:</span>
                      <span className="font-medium">{partner.quests}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Total XP:</span>
                      <span className="font-medium">{partner.xp.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Avg XP/Quest:</span>
                      <span className="font-medium">{partner.avgXPPerQuest}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Joined:</span>
                      <span className="font-medium">{formatDate(partner.joinedAt)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getRoleColor(partner.role)}`}
                    >
                      {partner.role}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {partner.fullName}
                    </span>
                  </div>
                  
                  {partner.questTitles.length > 0 && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Recent Quests: </span>
                      <span className="text-muted-foreground">
                        {partner.questTitles.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
