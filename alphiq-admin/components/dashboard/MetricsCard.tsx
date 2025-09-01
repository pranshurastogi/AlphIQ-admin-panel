import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface MetricsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  change?: {
    value: string
    isPositive: boolean
  }
  loading?: boolean
  className?: string
}

export function MetricsCard({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  loading = false,
  className = ''
}: MetricsCardProps) {
  return (
    <Card className={`glass-card ${className}`}>
      <CardHeader className="flex justify-between pb-2">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
        <Icon className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-primary">
          {loading ? '...' : value}
        </div>
        {change && (
          <div className="flex items-center gap-1 mt-1">
            {change.isPositive ? (
              <ArrowUpRight className="h-4 w-4 text-mint" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-mint" />
            )}
            <p className="text-xs text-mint">{change.value}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
