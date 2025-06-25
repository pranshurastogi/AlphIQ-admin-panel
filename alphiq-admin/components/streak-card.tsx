"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Flame, Calendar, TrendingUp } from "lucide-react"

interface StreakCardProps {
  currentStreak: number
  longestStreak: number
  lastActiveDate: string
  streakMultiplier?: number
}

export function StreakCard({ currentStreak, longestStreak, lastActiveDate, streakMultiplier = 1 }: StreakCardProps) {
  const isActiveToday = new Date(lastActiveDate).toDateString() === new Date().toDateString()

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Flame className={`h-5 w-5 ${isActiveToday ? "text-accent" : "text-muted-foreground"}`} />
          Streak Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-2xl font-bold text-primary">{currentStreak}</p>
            <p className="text-sm text-muted-foreground">Current Streak</p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-lg font-semibold">{longestStreak}</p>
            <p className="text-sm text-muted-foreground">Best Streak</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Last Active: {new Date(lastActiveDate).toLocaleDateString()}</span>
          </div>
          {streakMultiplier > 1 && (
            <Badge variant="secondary" className="bg-accent/20 text-accent">
              <TrendingUp className="h-3 w-3 mr-1" />
              {streakMultiplier}x XP
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
