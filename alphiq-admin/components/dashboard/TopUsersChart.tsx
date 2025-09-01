import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Line, LineChart, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from 'recharts'

interface TopUsersChartProps {
  data: Array<{ user: string; xp: number; title: string }>
  className?: string
}

export function TopUsersChart({ data, className = 'h-[400px]' }: TopUsersChartProps) {
  // Sort data by XP for better line chart visualization
  const sortedData = [...data].sort((a, b) => a.xp - b.xp)
  
  return (
    <ChartContainer
      config={{
        xp: { label: 'XP', color: 'hsl(var(--chart-1))' },
      }}
      className={className}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={sortedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
          <XAxis 
            dataKey="user" 
            stroke="hsl(var(--muted-foreground))"
            angle={-45}
            textAnchor="end"
            height={80}
            interval="preserveStartEnd"
          />
          <YAxis stroke="hsl(var(--muted-foreground))" />
          <Tooltip 
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-background border rounded-lg p-3 shadow-lg">
                    <p className="font-medium">{label}</p>
                    <p className="text-primary">
                      XP: {payload[0].value?.toLocaleString()}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Rank: {sortedData.findIndex(d => d.user === label) + 1}
                    </p>
                  </div>
                )
              }
              return null
            }}
          />
          <Line 
            type="monotone" 
            dataKey="xp" 
            stroke="hsl(var(--chart-1))" 
            strokeWidth={3}
            dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: "hsl(var(--chart-1))", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
