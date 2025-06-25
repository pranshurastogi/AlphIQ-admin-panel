"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { Search, Eye, Copy, Award } from "lucide-react"
import { StreakCard } from "@/components/streak-card"

interface User {
  id: string
  address: string
  ensName?: string
  totalXp: number
  level: number
  currentStreak: number
  longestStreak: number
  joinedAt: string
  lastActive: string
  completedQuests: number
  pendingSubmissions: number
}

const mockUsers: User[] = [
  {
    id: "1",
    address: "0x1234567890abcdef1234567890abcdef12345678",
    ensName: "alice.eth",
    totalXp: 15420,
    level: 8,
    currentStreak: 12,
    longestStreak: 25,
    joinedAt: "2024-01-15",
    lastActive: "2024-01-25",
    completedQuests: 23,
    pendingSubmissions: 2,
  },
  {
    id: "2",
    address: "0x2345678901bcdef12345678901bcdef123456789",
    totalXp: 12350,
    level: 7,
    currentStreak: 8,
    longestStreak: 15,
    joinedAt: "2024-01-20",
    lastActive: "2024-01-24",
    completedQuests: 18,
    pendingSubmissions: 1,
  },
  {
    id: "3",
    address: "0x3456789012cdef123456789012cdef1234567890",
    ensName: "bob.eth",
    totalXp: 11200,
    level: 6,
    currentStreak: 5,
    longestStreak: 20,
    joinedAt: "2024-02-01",
    lastActive: "2024-01-23",
    completedQuests: 16,
    pendingSubmissions: 0,
  },
]

const mockXpHistory = [
  { date: "2024-01-01", xp: 0 },
  { date: "2024-01-05", xp: 500 },
  { date: "2024-01-10", xp: 1200 },
  { date: "2024-01-15", xp: 2800 },
  { date: "2024-01-20", xp: 4500 },
  { date: "2024-01-25", xp: 6200 },
]

const mockCompletedQuests = [
  { id: "1", title: "Complete DeFi Swap", xp: 500, completedAt: "2024-01-20" },
  { id: "2", title: "Mint NFT", xp: 300, completedAt: "2024-01-18" },
  { id: "3", title: "Social Share", xp: 100, completedAt: "2024-01-15" },
]

export default function UsersPage() {
  const [users] = useState<User[]>(mockUsers)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const filteredUsers = users.filter(
    (user) =>
      user.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.ensName?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getLevelColor = (level: number) => {
    if (level >= 8) return "bg-accent/20 text-accent border-accent/30"
    if (level >= 5) return "bg-primary/20 text-primary border-primary/30"
    return "bg-secondary/20 text-secondary-foreground border-secondary/30"
  }

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary">Users & XP</h1>
          <p className="text-muted-foreground">Manage users and track XP distribution</p>
        </div>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-xl font-heading text-primary">All Users</CardTitle>
          <CardDescription>User profiles and XP tracking</CardDescription>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by address or ENS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm bg-white/5 border-white/10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead>User</TableHead>
                <TableHead>Total XP</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Streak</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className="border-white/10 hover:bg-white/5">
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">
                          {user.ensName || `${user.address.slice(0, 6)}...${user.address.slice(-4)}`}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyAddress(user.address)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      {user.ensName && (
                        <p className="text-xs text-muted-foreground font-mono">{user.address.slice(0, 10)}...</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" />
                      <span className="font-bold text-primary">{user.totalXp.toLocaleString()}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getLevelColor(user.level)}>
                      Level {user.level}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="text-accent font-semibold">{user.currentStreak}</span>
                      <span className="text-muted-foreground text-sm">days</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{new Date(user.joinedAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-sm">{new Date(user.lastActive).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                          className="hover:bg-primary/10 hover:text-primary"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </SheetTrigger>
                      <SheetContent className="w-[600px] sm:w-[800px] glass-card border-white/10">
                        <SheetHeader>
                          <SheetTitle className="text-primary">User Profile</SheetTitle>
                          <SheetDescription>Detailed view of user activity and XP history</SheetDescription>
                        </SheetHeader>
                        {selectedUser && (
                          <div className="space-y-6 mt-6">
                            {/* User Header */}
                            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                              <div>
                                <h3 className="text-lg font-semibold">
                                  {selectedUser.ensName ||
                                    `${selectedUser.address.slice(0, 8)}...${selectedUser.address.slice(-6)}`}
                                </h3>
                                <p className="text-sm text-muted-foreground font-mono">{selectedUser.address}</p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyAddress(selectedUser.address)}
                                className="bg-white/5 border-white/10"
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Address
                              </Button>
                            </div>

                            {/* Stats Cards */}
                            <div className="grid grid-cols-3 gap-4">
                              <Card className="glass-card">
                                <CardContent className="p-4 text-center">
                                  <div className="text-2xl font-bold text-primary">
                                    {selectedUser.totalXp.toLocaleString()}
                                  </div>
                                  <p className="text-sm text-muted-foreground">Total XP</p>
                                </CardContent>
                              </Card>
                              <Card className="glass-card">
                                <CardContent className="p-4 text-center">
                                  <div className="text-2xl font-bold text-accent">Level {selectedUser.level}</div>
                                  <p className="text-sm text-muted-foreground">Current Level</p>
                                </CardContent>
                              </Card>
                              <Card className="glass-card">
                                <CardContent className="p-4 text-center">
                                  <div className="text-2xl font-bold text-primary">{selectedUser.completedQuests}</div>
                                  <p className="text-sm text-muted-foreground">Completed Quests</p>
                                </CardContent>
                              </Card>
                            </div>

                            {/* Streak Card */}
                            <StreakCard
                              currentStreak={selectedUser.currentStreak}
                              longestStreak={selectedUser.longestStreak}
                              lastActiveDate={selectedUser.lastActive}
                              streakMultiplier={selectedUser.currentStreak >= 7 ? 1.5 : 1}
                            />

                            {/* XP Timeline */}
                            <Card className="glass-card">
                              <CardHeader>
                                <CardTitle className="text-lg text-primary">XP Timeline</CardTitle>
                                <CardDescription>XP accumulation over time</CardDescription>
                              </CardHeader>
                              <CardContent>
                                <ChartContainer
                                  config={{
                                    xp: {
                                      label: "XP",
                                      color: "hsl(var(--chart-1))",
                                    },
                                  }}
                                  className="h-[200px]"
                                >
                                  <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={mockXpHistory}>
                                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                                      <YAxis stroke="hsl(var(--muted-foreground))" />
                                      <ChartTooltip content={<ChartTooltipContent />} />
                                      <Area
                                        type="monotone"
                                        dataKey="xp"
                                        stroke="var(--color-xp)"
                                        fill="var(--color-xp)"
                                        fillOpacity={0.3}
                                        strokeWidth={2}
                                      />
                                    </AreaChart>
                                  </ResponsiveContainer>
                                </ChartContainer>
                              </CardContent>
                            </Card>

                            {/* Completed Quests */}
                            <Card className="glass-card">
                              <CardHeader>
                                <CardTitle className="text-lg text-primary">Recent Completed Quests</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-3">
                                  {mockCompletedQuests.map((quest) => (
                                    <div
                                      key={quest.id}
                                      className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                                    >
                                      <div>
                                        <p className="font-medium">{quest.title}</p>
                                        <p className="text-sm text-muted-foreground">
                                          {new Date(quest.completedAt).toLocaleDateString()}
                                        </p>
                                      </div>
                                      <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
                                        +{quest.xp} XP
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        )}
                      </SheetContent>
                    </Sheet>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
