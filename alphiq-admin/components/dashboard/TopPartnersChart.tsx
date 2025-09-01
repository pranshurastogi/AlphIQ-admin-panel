import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'

interface TopPartnersChartProps {
  data: Array<{ 
    partner: string; 
    quests: number; 
    xp: number; 
    fullName: string; 
    questTitles: string[] 
  }>
  className?: string
}

export function TopPartnersChart({ data, className = 'h-[300px]' }: TopPartnersChartProps) {
  return (
    <ChartContainer
      config={{
        xp: { label: 'XP Distributed', color: 'hsl(var(--chart-1))' },
        quests: { label: 'Quests Created', color: 'hsl(var(--chart-2))' },
      }}
      className={className}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
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
          <Bar dataKey="xp" fill="var(--color-xp)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
