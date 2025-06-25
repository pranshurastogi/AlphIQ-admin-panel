"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, Filter, Download, Eye } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface AuditLog {
  id: string
  timestamp: string
  actor: string
  action: string
  entity: string
  entityId: string
  details: Record<string, any>
  ipAddress: string
}

const mockAuditLogs: AuditLog[] = [
  {
    id: "1",
    timestamp: "2024-01-25T10:30:00Z",
    actor: "admin@alphiq.com",
    action: "quest.created",
    entity: "quest",
    entityId: "quest_123",
    details: {
      title: "Complete DeFi Swap",
      xpReward: 500,
      category: "DeFi Protocols",
    },
    ipAddress: "192.168.1.100",
  },
  {
    id: "2",
    timestamp: "2024-01-25T09:15:00Z",
    actor: "moderator@alphiq.com",
    action: "submission.approved",
    entity: "submission",
    entityId: "sub_456",
    details: {
      questTitle: "Mint NFT",
      userAddress: "0x1234...5678",
      xpAwarded: 300,
    },
    ipAddress: "192.168.1.101",
  },
  {
    id: "3",
    timestamp: "2024-01-25T08:45:00Z",
    actor: "admin@alphiq.com",
    action: "category.deleted",
    entity: "category",
    entityId: "cat_789",
    details: {
      name: "Old Category",
      questCount: 0,
    },
    ipAddress: "192.168.1.100",
  },
  {
    id: "4",
    timestamp: "2024-01-24T16:20:00Z",
    actor: "moderator@alphiq.com",
    action: "submission.rejected",
    entity: "submission",
    entityId: "sub_321",
    details: {
      questTitle: "Social Share",
      userAddress: "0x9876...4321",
      reason: "Invalid proof provided",
    },
    ipAddress: "192.168.1.102",
  },
  {
    id: "5",
    timestamp: "2024-01-24T14:10:00Z",
    actor: "admin@alphiq.com",
    action: "user.xp_granted",
    entity: "user",
    entityId: "0x1111...2222",
    details: {
      xpAmount: 1000,
      reason: "Community contribution bonus",
      previousXp: 5000,
      newXp: 6000,
    },
    ipAddress: "192.168.1.100",
  },
]

export default function AuditPage() {
  const { hasPermission } = useAuth()
  const [logs] = useState<AuditLog[]>(mockAuditLogs)
  const [searchTerm, setSearchTerm] = useState("")
  const [actionFilter, setActionFilter] = useState<string>("all")
  const [actorFilter, setActorFilter] = useState<string>("all")
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  // Check if user has permission to view audit logs
  if (!hasPermission("*")) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="glass-card max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-primary mb-2">Access Restricted</h2>
            <p className="text-muted-foreground">
              You don't have permission to view audit logs. Contact your administrator for access.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityId.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesAction = actionFilter === "all" || log.action.includes(actionFilter)
    const matchesActor = actorFilter === "all" || log.actor === actorFilter

    return matchesSearch && matchesAction && matchesActor
  })

  const getActionColor = (action: string) => {
    if (action.includes("created") || action.includes("approved")) return "bg-primary/20 text-primary border-primary/30"
    if (action.includes("deleted") || action.includes("rejected"))
      return "bg-destructive/20 text-destructive border-destructive/30"
    if (action.includes("updated") || action.includes("granted")) return "bg-accent/20 text-accent border-accent/30"
    return "bg-secondary/20 text-secondary-foreground border-secondary/30"
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
  }

  const uniqueActions = Array.from(new Set(logs.map((log) => log.action.split(".")[1]))).sort()
  const uniqueActors = Array.from(new Set(logs.map((log) => log.actor))).sort()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary">Audit Logs</h1>
          <p className="text-muted-foreground">System activity and administrative actions</p>
        </div>
        <Button variant="outline" className="bg-white/5 border-white/10">
          <Download className="mr-2 h-4 w-4" />
          Export Logs
        </Button>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-xl font-heading text-primary">System Activity</CardTitle>
          <CardDescription>Comprehensive log of all administrative actions</CardDescription>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm bg-white/5 border-white/10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[140px] bg-white/5 border-white/10">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent className="glass-card border-white/10">
                  <SelectItem value="all">All Actions</SelectItem>
                  {uniqueActions.map((action) => (
                    <SelectItem key={action} value={action} className="capitalize">
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={actorFilter} onValueChange={setActorFilter}>
                <SelectTrigger className="w-[180px] bg-white/5 border-white/10">
                  <SelectValue placeholder="Actor" />
                </SelectTrigger>
                <SelectContent className="glass-card border-white/10">
                  <SelectItem value="all">All Actors</SelectItem>
                  {uniqueActors.map((actor) => (
                    <SelectItem key={actor} value={actor}>
                      {actor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead>Timestamp</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => {
                const { date, time } = formatTimestamp(log.timestamp)
                return (
                  <TableRow key={log.id} className="border-white/10 hover:bg-white/5">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">{date}</div>
                        <div className="text-xs text-muted-foreground">{time}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{log.actor}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getActionColor(log.action)}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium capitalize">{log.entity}</div>
                        <div className="text-xs text-muted-foreground font-mono">{log.entityId}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm text-muted-foreground">{log.ipAddress}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                            className="hover:bg-primary/10 hover:text-primary"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="glass-card border-white/10 max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="text-primary">Audit Log Details</DialogTitle>
                            <DialogDescription>Detailed information about this system event</DialogDescription>
                          </DialogHeader>
                          {selectedLog && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-muted-foreground">Timestamp</label>
                                  <p className="text-sm">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-muted-foreground">Actor</label>
                                  <p className="text-sm font-medium">{selectedLog.actor}</p>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-muted-foreground">Action</label>
                                  <Badge variant="outline" className={getActionColor(selectedLog.action)}>
                                    {selectedLog.action}
                                  </Badge>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-muted-foreground">IP Address</label>
                                  <p className="text-sm font-mono">{selectedLog.ipAddress}</p>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-muted-foreground">Entity Type</label>
                                  <p className="text-sm capitalize">{selectedLog.entity}</p>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-muted-foreground">Entity ID</label>
                                  <p className="text-sm font-mono">{selectedLog.entityId}</p>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Details</label>
                                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                  <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {JSON.stringify(selectedLog.details, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {filteredLogs.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No audit logs found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
