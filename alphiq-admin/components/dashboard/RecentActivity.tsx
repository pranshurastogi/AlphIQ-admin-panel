interface ActivityItem {
  type: string
  user: string
  action: string
  quest?: string
  time: string
}

interface RecentActivityProps {
  data: ActivityItem[]
  className?: string
}

export function RecentActivity({ data, className = '' }: RecentActivityProps) {
  // Limit to 10 items and add scroll bar
  const limitedData = data.slice(0, 10)
  
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="max-h-80 overflow-y-auto pr-2 space-y-4">
        {limitedData.map((activity, index) => (
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
      
      {data.length > 10 && (
        <div className="text-xs text-muted-foreground text-center">
          Showing 10 of {data.length} activities
        </div>
      )}
    </div>
  )
}
