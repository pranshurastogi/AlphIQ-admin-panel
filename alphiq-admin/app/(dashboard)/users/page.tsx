// app/(dashboard)/users/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/components/auth-provider'
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent
} from '@/components/ui/card'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Eye, Copy, Award } from 'lucide-react'
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { StreakCard } from '@/components/streak-card'

type LevelView = {
  address:    string
  joined_at:  string
  total_xp:   number
  level:      number
  level_name: string
  color_hex:  string
}

type StreakRow = {
  address:          string
  current_streak:   number
  last_login_date:  string
}

type Submission = {
  user_address: string
  status:       'pending'|'approved'|'rejected'
  quest_id?:    number
  reviewed_at?: string
}

type Quest = {
  id:    number
  title: string
}

type XPHistoryRow = {
  change:     number
  created_at: string
}

type User = {
  id:                   string      // use address as id
  address:              string
  joinedAt:             string
  totalXp:              number
  level:                number
  levelName:            string
  levelColor:           string
  currentStreak:        number
  lastActive:           string|null
  completedQuests:      number
  pendingSubmissions:   number
}

// Utility to shorten wallet address
function shortenAddress(address: string, start = 6, end = 4) {
  if (!address || address.length < start + end) return address;
  return `${address.slice(0, start)}…${address.slice(-end)}`;
}

export default function UsersPage() {
  const { user }         = useAuth()
  const { toast }        = useToast()
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string|null>(null)

  const [users,    setUsers]    = useState<User[]>([])
  const [search,   setSearch]   = useState('')
  const [detail,   setDetail]   = useState<User|null>(null)
  const [xpSeries, setXpSeries] = useState<Array<{date:string;xp:number}>>([])
  const [recentQs, setRecentQs] = useState<Array<{ title:string; reviewed_at:string; xpChange:number }>>([])

  // 1) Load top-level data
  useEffect(() => {
    async function loadAll() {
      setLoading(true); setError(null)
      try {
        // 1a) users table
        const { data: userData, error: userErr } = await supabase
          .from('users')
          .select('address, joined_at, total_xp')
        if (userErr) throw userErr

        // 1a.2) user_levels view
        const { data: levelData, error: levelErr } = await supabase
          .from('user_levels')
          .select('address, level, level_name, color_hex')
        if (levelErr) throw levelErr
        const levelMap = Object.fromEntries(
          levelData.map(l => [l.address, l])
        )

        // 1b) streaks
        const { data: stData, error: stErr } = await supabase
          .from<StreakRow>('user_streaks')
          .select('*')
        if (stErr) throw stErr
        const streakMap = Object.fromEntries(
          stData.map(s => [s.address, s])
        )

        // 1c) submissions
        const { data: subData, error: subErr } = await supabase
          .from<Submission>('admin_quest_submissions')
          .select('user_address,status,quest_id,reviewed_at')
        if (subErr) throw subErr
        const stats: Record<string, {completed:number;pending:number}> = {}
        subData.forEach(s => {
          const m = stats[s.user_address] ??= { completed:0, pending:0 }
          if (s.status === 'approved')   m.completed++
          else if (s.status === 'pending') m.pending++
        })

        // assemble users[]
        const all: User[] = userData.map(u => {
          const st = streakMap[u.address]
          const lvl = levelMap[u.address]
          return {
            id:                 u.address,
            address:            u.address,
            joinedAt:           u.joined_at,
            totalXp:            u.total_xp,
            level:              lvl?.level ?? 0,
            levelName:          lvl?.level_name ?? '',
            levelColor:         lvl?.color_hex ?? '',
            currentStreak:      st?.current_streak ?? 0,
            lastActive:         st?.last_login_date ?? null,
            completedQuests:    stats[u.address]?.completed ?? 0,
            pendingSubmissions: stats[u.address]?.pending   ?? 0
          }
        })
        setUsers(all)
      } catch (e:any) {
        console.error('[UsersPage] loadAll', e)
        setError('Failed to load users')
      } finally {
        setLoading(false)
      }
    }
    loadAll()
  }, [])

  // 2) When detail opens, load XP history & recent quests
  useEffect(() => {
    if (!detail) return
    setXpSeries([])
    setRecentQs([])

    async function loadDetail() {
      try {
        // XP history
        const { data: xpData, error: xpErr } = await supabase
          .from<XPHistoryRow>('admin_user_xp_history')
          .select('change,created_at')
          .eq('user_address', detail.address)
          .order('created_at',{ ascending:true })
        if (xpErr) throw xpErr

        let cum = 0
        const series = xpData.map(r => {
          cum += r.change
          return {
            date: format(new Date(r.created_at), 'yyyy-MM-dd'),
            xp: cum
          }
        })
        setXpSeries(series)

        // recent approved quests
        const { data: recSubs, error: recErr } = await supabase
          .from<Submission>('admin_quest_submissions')
          .select('quest_id,reviewed_at')
          .eq('user_address', detail.address)
          .eq('status','approved')
          .order('reviewed_at',{ descending:true })
          .limit(5)
        if (recErr) throw recErr

        // fetch titles
        const qids = recSubs.map(r => r.quest_id).filter(Boolean) as number[]
        const { data: quests, error: qErr } = await supabase
          .from<Quest>('admin_quests')
          .select('id,title')
          .in('id', qids)
        if (qErr) throw qErr

        const titleMap = Object.fromEntries(quests.map(q => [q.id, q.title]))
        setRecentQs(recSubs.map(r => ({
          title:       titleMap[r.quest_id!] ?? `#${r.quest_id}`,
          reviewed_at: format(new Date(r.reviewed_at!), 'yyyy-MM-dd'),
          xpChange:    detail.totalXp // or fetch actual xp per quest—here assume formData
        })))
      } catch (e:any) {
        console.error('[UsersPage] loadDetail', e)
      }
    }
    loadDetail()
  }, [detail])

  if (loading) return <p className="py-8 text-center">Loading users…</p>
  if (error)   return <p className="py-8 text-center text-red-400">{error}</p>

  const filtered = users.filter(u =>
    u.address.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users & XP</h1>
          <p className="text-sm text-muted-foreground">Manage users and track XP distribution</p>
        </div>
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by address…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>User XP & streak overview</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
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
              {filtered.map(u => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono" title={u.address}>{shortenAddress(u.address)}</span>
                      <Button variant="ghost" size="sm" onClick={()=>navigator.clipboard.writeText(u.address)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Award className="h-4 w-4 text-primary"/>
                      <span className="font-bold text-primary">{(u.totalXp ?? 0).toLocaleString()}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge style={{
                      backgroundColor:`${u.levelColor}20`,
                      borderColor: u.levelColor,
                      color: u.levelColor
                    }}>
                      {u.levelName}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 items-baseline">
                      <span className="font-semibold text-accent">{u.currentStreak}</span>
                      <span className="text-xs text-muted-foreground">days</span>
                    </div>
                  </TableCell>
                  <TableCell>{isNaN(new Date(u.joinedAt).getTime()) ? '—' : new Date(u.joinedAt).toLocaleDateString()}</TableCell>
                  <TableCell>{u.lastActive ? new Date(u.lastActive).toLocaleDateString() : '—'}</TableCell>
                  <TableCell className="text-right">
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={()=>setDetail(u)}>
                          <Eye className="h-4 w-4"/>
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="right" className="w-[600px] glass-card max-h-screen">
                        <div className="h-full overflow-y-auto p-4">
                          <SheetHeader>
                            <SheetTitle>User Profile</SheetTitle>
                            <SheetDescription>Details & history for {u.address}</SheetDescription>
                          </SheetHeader>
                          {/* header */}
                          <div className="p-4 bg-white/5 rounded-lg mb-6 flex justify-between">
                            <div>
                              <h3 className="font-semibold" title={u.address}>{shortenAddress(u.address)}</h3>
                              <p className="text-xs text-muted-foreground">{shortenAddress(u.address)}</p>
                            </div>
                            <Button variant="outline" onClick={()=>navigator.clipboard.writeText(u.address)}>
                              <Copy className="h-4 w-4 mr-1"/>Copy
                            </Button>
                          </div>

                          {/* stats cards */}
                          <div className="grid grid-cols-3 gap-4 mb-6">
                            <Card className="glass-card">
                              <CardContent className="text-center">
                                <p className="text-2xl font-bold text-primary">{(u.totalXp ?? 0).toLocaleString()}</p>
                                <p className="text-sm text-muted-foreground">Total XP</p>
                              </CardContent>
                            </Card>
                            <Card className="glass-card">
                              <CardContent className="text-center">
                                <p className="text-xl font-semibold">{u.levelName}</p>
                                <p className="text-sm text-muted-foreground">Level</p>
                              </CardContent>
                            </Card>
                            <Card className="glass-card">
                              <CardContent className="text-center">
                                <p className="text-xl font-semibold">{u.completedQuests}</p>
                                <p className="text-sm text-muted-foreground">Quests Done</p>
                              </CardContent>
                            </Card>
                          </div>

                          {/* streak */}
                          <StreakCard
                            currentStreak={u.currentStreak}
                            longestStreak={u.currentStreak}
                            lastActiveDate={u.lastActive ?? u.joinedAt}
                          />

                          {/* XP timeline */}
                          <Card className="glass-card mt-6">
                            <CardHeader>
                              <CardTitle>XP Timeline</CardTitle>
                              <CardDescription>Cumulative XP over time</CardDescription>
                            </CardHeader>
                            <CardContent className="h-48">
                              {xpSeries.length > 0
                                ? <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={xpSeries}>
                                      <XAxis dataKey="date" stroke="#888"/>
                                      <YAxis stroke="#888"/>
                                      <Area type="monotone" dataKey="xp" stroke="#00E6B0" fill="#00E6B0" fillOpacity={0.3}/>
                                    </AreaChart>
                                  </ResponsiveContainer>
                                : <p className="text-center text-sm text-muted-foreground">No history</p>
                              }
                            </CardContent>
                          </Card>

                          {/* recent quests */}
                          <Card className="glass-card mt-6 mb-10">
                            <CardHeader>
                              <CardTitle>Recent Completed Quests</CardTitle>
                            </CardHeader>
                            <CardContent>
                              {recentQs.length > 0
                                ? recentQs.map((q,i) => (
                                    <div key={i} className="flex justify-between py-2 border-b last:border-b-0">
                                      <div>
                                        <p className="font-medium">{q.title}</p>
                                        <p className="text-xs text-muted-foreground">{q.reviewed_at}</p>
                                      </div>
                                      <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
                                        +{ /* ideally fetch per‐quest xp change */ detail?.totalXp ?? 0 } XP
                                      </Badge>
                                    </div>
                                  ))
                                : <p className="text-sm text-muted-foreground">No completed quests</p>
                              }
                            </CardContent>
                          </Card>

                          <DialogClose asChild>
                            <Button variant="outline" className="w-full mb-4">Close</Button>
                          </DialogClose>
                        </div>
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
