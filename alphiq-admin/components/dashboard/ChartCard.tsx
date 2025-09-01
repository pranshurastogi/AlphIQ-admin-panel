import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { ReactNode } from 'react'

interface ChartCardProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function ChartCard({ title, description, children, className = '' }: ChartCardProps) {
  return (
    <Card className={`glass-card ${className}`}>
      <CardHeader>
        <CardTitle className="text-xl font-heading text-primary">{title}</CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  )
}
