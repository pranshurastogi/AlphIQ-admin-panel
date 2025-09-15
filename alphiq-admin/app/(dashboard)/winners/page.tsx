"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Check,
  X,
  Eye,
  Search,
  Filter,
  ExternalLink,
  Clock,
  Award,
  AlertCircle,
  CheckCircle,
  XCircle,
  Download,
  FileText,
  Link,
  Calendar,
  User,
  Trophy,
  Star,
  RefreshCw,
  AlertTriangle,
  FileDown,
  DollarSign,
  Coins,
  TrendingUp,
  Hash,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabaseClient"

interface Winner {
  winner_id: string
  quest_id: number
  submission_id: number | null
  user_address: string
  display_name: string | null
  info: any
  winning_amount: number
  winning_token: string | null
  approx_amount_usd: number | null
  exchange_rate_usd: number | null
  pricing_source: string | null
  priced_at: string | null
  status: "pending" | "awarded" | "failed" | "cancelled"
  comments: string | null
  tx_hash: string | null
  proof_url: string | null
  awarded_by: string | null
  awarded_at: string
  updated_at: string
  quest: {
    id: number
    title: string
    description: string
    created_by: string
    is_active: boolean
    creator?: {
      full_name: string
    }
  }
  submission?: {
    id: number
    proof_url: string
    proof_data: any
    submitted_at: string
  }
  awarder?: {
    full_name: string
  }
}

interface WinnerStats {
  total: number
  pending: number
  awarded: number
  failed: number
  cancelled: number
  totalAmount: number
  totalAmountUSD: number
}

export default function WinnersPage() {
  const { profile, hasPermission } = useAuth()
  const [winners, setWinners] = useState<Winner[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [questFilter, setQuestFilter] = useState<string>("all")
  const [createdByFilter, setCreatedByFilter] = useState<string>("all")
  const [selectedWinners, setSelectedWinners] = useState<string[]>([])
  const [viewingWinner, setViewingWinner] = useState<Winner | null>(null)
  const [stats, setStats] = useState<WinnerStats>({
    total: 0,
    pending: 0,
    awarded: 0,
    failed: 0,
    cancelled: 0,
    totalAmount: 0,
    totalAmountUSD: 0,
  })
  const { toast } = useToast()

  // Check if user has access to winners page
  useEffect(() => {
    if (profile && !hasPermission("winners.view")) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to view winners",
        variant: "destructive",
      })
    }
  }, [profile, hasPermission, toast])

  // Fetch winners based on user role
  const fetchWinners = async () => {
    if (!profile) return

    setLoading(true)
    try {
      let query = supabase
        .from('admin_quest_winners')
        .select(`
          *,
          quest:admin_quests(
            id,
            title,
            description,
            created_by,
            is_active,
            creator:admin_user_profiles!admin_quests_created_by_fkey(full_name)
          ),
          submission:admin_quest_submissions(
            id,
            proof_url,
            proof_data,
            submitted_at
          ),
          awarder:admin_user_profiles!admin_quest_winners_awarded_by_fkey(full_name)
        `)
        .order('awarded_at', { ascending: false })

      // Apply role-based filtering
      if (profile.role !== 'super_admin') {
        // Non-super admins can only see winners for quests they created
        query = query.eq('quest.created_by', profile.id)
      }

      const { data: winners, error } = await query

      if (error) {
        console.error('Error fetching winners:', error)
        toast({
          title: "Error",
          description: "Failed to load winners",
          variant: "destructive",
        })
        return
      }

      // Filter out winners with null quest objects (orphaned winners)
      const validWinners = (winners || []).filter(w => w.quest)

      setWinners(validWinners)
      
      // Calculate stats
      const stats = {
        total: validWinners.length,
        pending: validWinners.filter((w: Winner) => w.status === 'pending').length,
        awarded: validWinners.filter((w: Winner) => w.status === 'awarded').length,
        failed: validWinners.filter((w: Winner) => w.status === 'failed').length,
        cancelled: validWinners.filter((w: Winner) => w.status === 'cancelled').length,
        totalAmount: validWinners.reduce((sum, w: Winner) => sum + (w.winning_amount || 0), 0),
        totalAmountUSD: validWinners.reduce((sum, w: Winner) => sum + (w.approx_amount_usd || 0), 0),
      }
      setStats(stats)
    } catch (error) {
      console.error('Error fetching winners:', error)
      toast({
        title: "Error",
        description: "Failed to load winners",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (profile && hasPermission("winners.view")) {
      fetchWinners()
    }
  }, [profile])

  const filteredWinners = winners.filter((winner) => {
    const matchesSearch =
      winner.user_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      winner.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      winner.quest.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      winner.tx_hash?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || winner.status === statusFilter
    const matchesQuest = questFilter === "all" || winner.quest_id.toString() === questFilter
    const matchesCreatedBy = createdByFilter === "all" || winner.quest.created_by === createdByFilter
    return matchesSearch && matchesStatus && matchesQuest && matchesCreatedBy
  })

  const handleSelectWinner = (winnerId: string, checked: boolean) => {
    if (checked) {
      setSelectedWinners([...selectedWinners, winnerId])
    } else {
      setSelectedWinners(selectedWinners.filter((id) => id !== winnerId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedWinners(filteredWinners.map((w) => w.winner_id))
    } else {
      setSelectedWinners([])
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "awarded":
        return "default"
      case "pending":
        return "secondary"
      case "failed":
        return "destructive"
      case "cancelled":
        return "outline"
      default:
        return "outline"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "awarded":
        return <CheckCircle className="h-4 w-4" />
      case "pending":
        return <Clock className="h-4 w-4" />
      case "failed":
        return <XCircle className="h-4 w-4" />
      case "cancelled":
        return <X className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() +
      " " +
      new Date(dateString).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
  }

  const formatAmount = (amount: number, token?: string) => {
    if (amount === 0) return "0"
    const formatted = amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6,
    })
    return token ? `${formatted} ${token}` : formatted
  }

  const formatUSD = (amount: number | null) => {
    if (!amount) return "N/A"
    return `$${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  // CSV Export functionality
  const exportToCSV = (exportType: 'full' | 'summary' | 'selected' = 'full') => {
    try {
      let dataToExport: any[] = []
      let filename = ''

      // Determine which data to export
      if (exportType === 'selected' && selectedWinners.length > 0) {
        dataToExport = winners
          .filter(w => selectedWinners.includes(w.winner_id))
          .map(winner => createExportRow(winner))
        filename = `winners_selected_${new Date().toISOString().split('T')[0]}.csv`
      } else if (exportType === 'summary') {
        dataToExport = filteredWinners.map(winner => ({
          'Winner ID': winner.winner_id,
          'User Address': winner.user_address,
          'Display Name': winner.display_name || '',
          'Quest Title': winner.quest.title,
          'Winning Amount': formatAmount(winner.winning_amount, winner.winning_token),
          'USD Value': formatUSD(winner.approx_amount_usd),
          'Status': winner.status,
          'Awarded At': formatDate(winner.awarded_at),
          'TX Hash': winner.tx_hash || '',
        }))
        filename = `winners_summary_${new Date().toISOString().split('T')[0]}${getFilterInfo()}.csv`
      } else {
        // Full export
        dataToExport = filteredWinners.map(winner => createExportRow(winner))
        filename = `winners_full_${new Date().toISOString().split('T')[0]}${getFilterInfo()}.csv`
      }

      if (dataToExport.length === 0) {
        toast({
          title: "No Data to Export",
          description: "No winners match the current filters",
          variant: "destructive",
        })
        return
      }

      // Create CSV content with proper formatting and BOM for Excel compatibility
      const headers = Object.keys(dataToExport[0] || {})
      const csvContent = [
        // BOM for UTF-8 (helps with Excel compatibility)
        '\uFEFF',
        // Header row
        headers.join(','),
        // Data rows
        ...dataToExport.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row]
            // Escape commas, quotes, and newlines in CSV
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
              return `"${value.replace(/"/g, '""')}"`
            }
            return value
          }).join(',')
        )
      ].join('\n')

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Export Successful",
        description: `Exported ${dataToExport.length} winners to CSV (${exportType} format)`,
      })
    } catch (error) {
      console.error('Error exporting CSV:', error)
      toast({
        title: "Export Failed",
        description: "Failed to export winners to CSV",
        variant: "destructive",
      })
    }
  }

  // Helper function to create a full export row
  const createExportRow = (winner: Winner) => ({
    'Winner ID': winner.winner_id,
    'Quest ID': winner.quest_id,
    'Submission ID': winner.submission_id || '',
    'User Address': winner.user_address,
    'Display Name': winner.display_name || '',
    'Quest Title': winner.quest.title,
    'Quest Description': winner.quest.description.replace(/\n/g, ' ').replace(/,/g, ';'),
    'Winning Amount': formatAmount(winner.winning_amount, winner.winning_token),
    'Winning Token': winner.winning_token || '',
    'USD Value': formatUSD(winner.approx_amount_usd),
    'Exchange Rate': winner.exchange_rate_usd || '',
    'Pricing Source': winner.pricing_source || '',
    'Priced At': winner.priced_at ? formatDate(winner.priced_at) : '',
    'Status': winner.status,
    'Comments': winner.comments ? winner.comments.replace(/\n/g, ' ').replace(/,/g, ';') : '',
    'TX Hash': winner.tx_hash || '',
    'Proof URL': winner.proof_url || '',
    'Awarded By': winner.awarder?.full_name || winner.awarded_by || '',
    'Awarded At': formatDate(winner.awarded_at),
    'Updated At': formatDate(winner.updated_at),
    'Quest Creator': winner.quest.creator?.full_name || winner.quest.created_by,
    'Quest Active': winner.quest.is_active ? 'Yes' : 'No',
    'Export Date': new Date().toISOString(),
    'Filter Applied': getFilterInfo().replace('_', '') || 'None'
  })

  // Helper function to generate filter info for filename
  const getFilterInfo = () => {
    const filters = []
    if (searchTerm) filters.push('search')
    if (statusFilter !== 'all') filters.push(`status-${statusFilter}`)
    if (questFilter !== 'all') filters.push('quest-filtered')
    if (createdByFilter !== 'all') filters.push('creator-filtered')
    
    return filters.length > 0 ? `_${filters.join('_')}` : '_all'
  }

  // Check if user has access
  if (!profile || !hasPermission("winners.view")) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quest Winners</h1>
            <p className="text-muted-foreground">
              Manage and view quest winners and their rewards
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground">
              You don't have permission to view quest winners.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quest Winners</h1>
            <p className="text-muted-foreground">
              Manage and view quest winners and their rewards
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quest Winners</h1>
          <p className="text-muted-foreground">
            Manage and view quest winners and their rewards
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                disabled={loading || filteredWinners.length === 0}
                title="Export winners to CSV"
              >
                <FileDown className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => exportToCSV('full')}
                disabled={filteredWinners.length === 0}
              >
                <FileText className="h-4 w-4 mr-2" />
                Full Export ({filteredWinners.length} records)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => exportToCSV('summary')}
                disabled={filteredWinners.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Summary Export ({filteredWinners.length} records)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => exportToCSV('selected')}
                disabled={selectedWinners.length === 0}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Selected Only ({selectedWinners.length} records)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            onClick={fetchWinners}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Trophy className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Winners</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Awarded</p>
                <p className="text-2xl font-bold">{stats.awarded}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold">{stats.failed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Coins className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">{formatAmount(stats.totalAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total USD</p>
                <p className="text-2xl font-bold">{formatUSD(stats.totalAmountUSD)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Winners</CardTitle>
              <CardDescription>
                View and manage quest winners and their rewards
                {filteredWinners.length !== winners.length && (
                  <span className="ml-2 text-blue-600 font-medium">
                    ({filteredWinners.length} of {winners.length} shown)
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                CSV export respects current filters
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user, quest, or TX hash..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="awarded">Awarded</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={questFilter} onValueChange={setQuestFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Quest" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Quests</SelectItem>
                  {Array.from(
                    new Map(winners.map(w => [w.quest_id, { id: w.quest_id, title: w.quest.title }])).values()
                  ).map(quest => (
                    <SelectItem key={quest.id} value={quest.id.toString()}>
                      {quest.title.length > 30 ? quest.title.slice(0, 30) + '...' : quest.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={createdByFilter} onValueChange={setCreatedByFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Created By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Creators</SelectItem>
                  {Array.from(new Set(winners.map(w => w.quest.created_by))).map(creator => {
                    const creatorWinner = winners.find(w => w.quest.created_by === creator)
                    const creatorName = creatorWinner?.quest.creator?.full_name || creator.slice(0, 8) + '...' + creator.slice(-6)
                    return (
                      <SelectItem key={creator} value={creator}>
                        {creatorName}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("all")
                  setQuestFilter("all")
                  setCreatedByFilter("all")
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {selectedWinners.length > 0 && (
            <div className="mb-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {selectedWinners.length} winner(s) selected
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={true}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Batch Actions (Coming Soon)
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="min-w-[1400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        selectedWinners.length === filteredWinners.length &&
                        filteredWinners.length > 0
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="w-48">Winner</TableHead>
                  <TableHead className="w-64">Quest</TableHead>
                  <TableHead className="w-32">Amount</TableHead>
                  <TableHead className="w-32">USD Value</TableHead>
                  <TableHead className="w-32">Awarded</TableHead>
                  <TableHead className="w-40">TX Hash</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                  <TableHead className="w-32 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWinners.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No winners found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWinners.map((winner) => (
                    <TableRow key={winner.winner_id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedWinners.includes(winner.winner_id)}
                          onCheckedChange={(checked) =>
                            handleSelectWinner(winner.winner_id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {winner.display_name 
                                ? winner.display_name.slice(0, 2).toUpperCase()
                                : winner.user_address.slice(0, 2).toUpperCase()
                              }
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {winner.display_name || `${winner.user_address.slice(0, 8)}...${winner.user_address.slice(-6)}`}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {winner.user_address}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div>
                          <p className="font-medium truncate">{winner.quest.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {winner.quest.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Coins className="h-3 w-3 text-yellow-500" />
                          <span className="font-mono text-sm">
                            {formatAmount(winner.winning_amount, winner.winning_token)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="h-3 w-3 text-green-500" />
                          <span className="text-sm">
                            {formatUSD(winner.approx_amount_usd)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span>{formatDate(winner.awarded_at)}</span>
                        </div>
                        {winner.awarder && (
                          <p className="text-xs text-muted-foreground">
                            by {winner.awarder.full_name}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {winner.tx_hash ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              <Hash className="h-3 w-3 mr-1" />
                              TX
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                            >
                              <a
                                href={`https://explorer.alephium.org/transactions/${winner.tx_hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No TX</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getStatusColor(winner.status)}
                          className="capitalize flex items-center space-x-1"
                        >
                          {getStatusIcon(winner.status)}
                          <span>{winner.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Sheet>
                            <SheetTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewingWinner(winner)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </SheetTrigger>
                            <SheetContent className="w-[400px] sm:w-[540px]">
                              <SheetHeader>
                                <SheetTitle>Winner Details</SheetTitle>
                                <SheetDescription>
                                  View detailed information about this winner
                                </SheetDescription>
                              </SheetHeader>
                              {viewingWinner && (
                                <div className="space-y-6 mt-6">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium">Winner ID</Label>
                                      <p className="font-mono text-sm mt-1 break-all">
                                        {viewingWinner.winner_id}
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">User Address</Label>
                                      <p className="font-mono text-sm mt-1 break-all">
                                        {viewingWinner.user_address}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {viewingWinner.display_name && (
                                    <div>
                                      <Label className="text-sm font-medium">Display Name</Label>
                                      <p className="text-sm mt-1">{viewingWinner.display_name}</p>
                                    </div>
                                  )}

                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium">Quest</Label>
                                      <p className="text-sm mt-1 font-medium">
                                        {viewingWinner.quest.title}
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Status</Label>
                                      <Badge variant={getStatusColor(viewingWinner.status)} className="mt-1">
                                        {viewingWinner.status}
                                      </Badge>
                                    </div>
                                  </div>

                                  <div>
                                    <Label className="text-sm font-medium">Quest Description</Label>
                                    <p className="text-sm mt-1 text-muted-foreground">
                                      {viewingWinner.quest.description}
                                    </p>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium">Winning Amount</Label>
                                      <p className="text-sm mt-1 font-medium">
                                        {formatAmount(viewingWinner.winning_amount, viewingWinner.winning_token)}
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">USD Value</Label>
                                      <p className="text-sm mt-1 font-medium">
                                        {formatUSD(viewingWinner.approx_amount_usd)}
                                      </p>
                                    </div>
                                  </div>

                                  {viewingWinner.exchange_rate_usd && (
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label className="text-sm font-medium">Exchange Rate</Label>
                                        <p className="text-sm mt-1">
                                          ${viewingWinner.exchange_rate_usd}
                                        </p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Pricing Source</Label>
                                        <p className="text-sm mt-1">
                                          {viewingWinner.pricing_source || 'N/A'}
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {viewingWinner.tx_hash && (
                                    <div>
                                      <Label className="text-sm font-medium">Transaction Hash</Label>
                                      <div className="flex items-center space-x-2 mt-1">
                                        <Input value={viewingWinner.tx_hash} readOnly />
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          asChild
                                        >
                                          <a
                                            href={`https://explorer.alephium.org/transactions/${viewingWinner.tx_hash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                          >
                                            <ExternalLink className="h-3 w-3" />
                                          </a>
                                        </Button>
                                      </div>
                                    </div>
                                  )}

                                  {viewingWinner.proof_url && (
                                    <div>
                                      <Label className="text-sm font-medium">Proof URL</Label>
                                      <div className="flex items-center space-x-2 mt-1">
                                        <Input value={viewingWinner.proof_url} readOnly />
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          asChild
                                        >
                                          <a
                                            href={viewingWinner.proof_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                          >
                                            <ExternalLink className="h-3 w-3" />
                                          </a>
                                        </Button>
                                      </div>
                                    </div>
                                  )}

                                  {viewingWinner.comments && (
                                    <div>
                                      <Label className="text-sm font-medium">Comments</Label>
                                      <p className="text-sm mt-1 text-muted-foreground">
                                        {viewingWinner.comments}
                                      </p>
                                    </div>
                                  )}

                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium">Awarded At</Label>
                                      <p className="text-sm mt-1">{formatDate(viewingWinner.awarded_at)}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Updated At</Label>
                                      <p className="text-sm mt-1">{formatDate(viewingWinner.updated_at)}</p>
                                    </div>
                                  </div>

                                  {viewingWinner.awarder && (
                                    <div className="p-3 bg-muted rounded-lg">
                                      <div className="flex items-center space-x-2 mb-2">
                                        <User className="h-4 w-4" />
                                        <span className="text-sm font-medium">Awarded by</span>
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        {viewingWinner.awarder.full_name}
                                      </p>
                                    </div>
                                  )}

                                  {viewingWinner.submission && (
                                    <div>
                                      <Label className="text-sm font-medium">Related Submission</Label>
                                      <div className="mt-1 p-3 bg-muted rounded-lg">
                                        <p className="text-sm">
                                          <strong>Submission ID:</strong> {viewingWinner.submission.id}
                                        </p>
                                        <p className="text-sm">
                                          <strong>Submitted At:</strong> {formatDate(viewingWinner.submission.submitted_at)}
                                        </p>
                                        {viewingWinner.submission.proof_url && (
                                          <div className="mt-2">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              asChild
                                            >
                                              <a
                                                href={viewingWinner.submission.proof_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                              >
                                                <ExternalLink className="h-3 w-3 mr-2" />
                                                View Proof
                                              </a>
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </SheetContent>
                          </Sheet>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
