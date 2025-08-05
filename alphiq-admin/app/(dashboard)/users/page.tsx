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
import { Search, Eye, Copy, Award, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
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

// Updated User type to match new schema
type User = {
  id: string
  address: string
  joinedAt: string
  totalXp: number
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
  const [sortField, setSortField] = useState<'totalXp' | 'address' | 'joinedAt'>('totalXp')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // 1) Load top-level data
  useEffect(() => {
    async function loadAll() {
      setLoading(true); setError(null)
      try {
        // Fetch users table with new schema fields
        const { data: userData, error: userErr } = await supabase
          .from('users')
          .select('id, address, joined_at, admin_total_xp')
        if (userErr) throw userErr

        // assemble users[]
        const all: User[] = userData.map(u => ({
          id:       u.id,
          address:  u.address,
          joinedAt: u.joined_at,
          totalXp:  u.admin_total_xp,
        }))
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

  if (loading) return <p className="py-8 text-center">Loading users…</p>
  if (error)   return <p className="py-8 text-center text-red-400">{error}</p>

  // Sort and filter users
  const sortedAndFiltered = users
    .filter(u => u.address.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let aValue: string | number
      let bValue: string | number
      
      switch (sortField) {
        case 'totalXp':
          aValue = a.totalXp ?? 0
          bValue = b.totalXp ?? 0
          break
        case 'address':
          aValue = a.address.toLowerCase()
          bValue = b.address.toLowerCase()
          break
        case 'joinedAt':
          aValue = new Date(a.joinedAt).getTime()
          bValue = new Date(b.joinedAt).getTime()
          break
        default:
          return 0
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
      }
    })

  const handleSort = (field: 'totalXp' | 'address' | 'joinedAt') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const getSortIcon = (field: 'totalXp' | 'address' | 'joinedAt') => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
  }

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

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Award className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{sortedAndFiltered.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Award className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total XP</p>
                <p className="text-2xl font-bold">
                  {sortedAndFiltered.reduce((sum, user) => sum + (user.totalXp ?? 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ArrowUpDown className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sorted By</p>
                <p className="text-2xl font-bold capitalize">
                  {sortField === 'totalXp' ? 'XP' : sortField === 'address' ? 'User' : 'Joined Date'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            User XP overview - Sorted by {sortField === 'totalXp' ? 'XP' : sortField === 'address' ? 'User Address' : 'Join Date'} 
            ({sortDirection === 'desc' ? 'High to Low' : 'Low to High'})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('address')}
                    className="h-auto p-0 font-medium"
                  >
                    User
                    {getSortIcon('address')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('totalXp')}
                    className="h-auto p-0 font-medium"
                  >
                    Total XP
                    {getSortIcon('totalXp')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('joinedAt')}
                    className="h-auto p-0 font-medium"
                  >
                    Joined
                    {getSortIcon('joinedAt')}
                  </Button>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAndFiltered.map(u => (
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
                  <TableCell>{isNaN(new Date(u.joinedAt).getTime()) ? '—' : new Date(u.joinedAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={()=>navigator.clipboard.writeText(u.address)}>
                      <Copy className="h-4 w-4" />
                    </Button>
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
