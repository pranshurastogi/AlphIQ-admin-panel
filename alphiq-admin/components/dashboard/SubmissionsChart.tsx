import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Pie, PieChart, Cell, ResponsiveContainer } from 'recharts'

interface SubmissionsChartProps {
  data: Array<{ name: string; value: number; color: string }>
  className?: string
}

export function SubmissionsChart({ data, className = 'h-[300px]' }: SubmissionsChartProps) {
  return (
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
  )
}
