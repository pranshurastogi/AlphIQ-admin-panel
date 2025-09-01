import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Area, AreaChart, XAxis, YAxis, ResponsiveContainer } from 'recharts'

interface XPChartProps {
  data: Array<{ date: string; xp: number; fullDate: string }>
  className?: string
}

export function XPChart({ data, className = 'h-[300px]' }: XPChartProps) {
  return (
    <ChartContainer
      config={{
        xp: { label: 'XP', color: 'hsl(var(--chart-1))' },
      }}
      className={className}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
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
            stroke="var(--color-xp)"
            fill="var(--color-xp)"
            fillOpacity={0.3}
            strokeWidth={3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
