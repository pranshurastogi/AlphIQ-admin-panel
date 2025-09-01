import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Pie, PieChart, Cell, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardTitle } from '@/components/ui/card'

interface SubmissionData {
  name: string
  value: number
  color: string
  percentage: number
}

interface SubmissionDetails {
  total: number
  byStatus: Record<string, number>
  averagePerDay: number
}

interface EnhancedSubmissionsChartProps {
  data: SubmissionData[]
  details: SubmissionDetails
  className?: string
}

export function EnhancedSubmissionsChart({ data, details, className = 'h-[300px]' }: EnhancedSubmissionsChartProps) {


  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <CardTitle className="text-sm text-muted-foreground">Total Submissions</CardTitle>
          <CardContent className="p-0 pt-2">
            <div className="text-2xl font-bold">{details.total}</div>
          </CardContent>
        </Card>
        <Card className="p-4">
          <CardTitle className="text-sm text-muted-foreground">Avg per Day</CardTitle>
          <CardContent className="p-0 pt-2">
            <div className="text-2xl font-bold">{details.averagePerDay}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pie Chart */}
      <ChartContainer
        config={{
          approved: { label: 'Approved', color: 'hsl(var(--chart-1))' },
          pending: { label: 'Pending', color: 'hsl(var(--chart-2))' },
          rejected: { label: 'Rejected', color: 'hsl(var(--chart-3))' },
        }}
        className={className}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Status Breakdown */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Status Breakdown</h4>
        <div className="space-y-2">
          {data.map((status) => (
            <div key={status.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: status.color }}
                />
                <span className="text-sm">{status.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{status.value}</span>
                <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-md">
                  {status.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>


    </div>
  )
}
