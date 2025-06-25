"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Copy, Trash2, Search, Filter } from "lucide-react"
import Link from "next/link"

interface Quest {
  id: string
  title: string
  category: string
  xpReward: number
  startDate: string
  endDate: string
  prerequisites: number
  status: "active" | "paused" | "ended"
  submissions: number
}

const mockQuests: Quest[] = [
  {
    id: "1",
    title: "Complete DeFi Swap on Uniswap",
    category: "DeFi Protocols",
    xpReward: 500,
    startDate: "2024-01-15",
    endDate: "2024-03-15",
    prerequisites: 0,
    status: "active",
    submissions: 45,
  },
  {
    id: "2",
    title: "Mint Your First NFT",
    category: "NFT Collections",
    xpReward: 300,
    startDate: "2024-02-01",
    endDate: "2024-04-01",
    prerequisites: 1,
    status: "active",
    submissions: 23,
  },
  {
    id: "3",
    title: "Share on Twitter",
    category: "Social Media",
    xpReward: 100,
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    prerequisites: 0,
    status: "active",
    submissions: 156,
  },
  {
    id: "4",
    title: "Complete Web3 Tutorial",
    category: "Education",
    xpReward: 750,
    startDate: "2024-01-10",
    endDate: "2024-02-10",
    prerequisites: 0,
    status: "ended",
    submissions: 89,
  },
]

export default function QuestsPage() {
  const [quests] = useState<Quest[]>(mockQuests)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  const filteredQuests = quests.filter((quest) => {
    const matchesSearch = quest.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || quest.status === statusFilter
    const matchesCategory = categoryFilter === "all" || quest.category === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "paused":
        return "secondary"
      case "ended":
        return "outline"
      default:
        return "default"
    }
  }

  const categories = Array.from(new Set(quests.map((q) => q.category)))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quests Management</h1>
          <p className="text-muted-foreground">Create and manage quests for your community</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Import CSV</Button>
          <Button asChild>
            <Link href="/quests/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Quest
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Quests</CardTitle>
          <CardDescription>Manage your quest library and track performance</CardDescription>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search quests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="ended">Ended</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
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
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>XP Reward</TableHead>
                <TableHead>Active Window</TableHead>
                <TableHead>Prerequisites</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submissions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuests.map((quest) => (
                <TableRow key={quest.id}>
                  <TableCell className="font-medium max-w-xs">
                    <div className="truncate">{quest.title}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{quest.category}</Badge>
                  </TableCell>
                  <TableCell className="font-mono">{quest.xpReward} XP</TableCell>
                  <TableCell className="text-sm">
                    <div>{quest.startDate}</div>
                    <div className="text-muted-foreground">to {quest.endDate}</div>
                  </TableCell>
                  <TableCell>
                    {quest.prerequisites > 0 ? (
                      <Badge variant="secondary">{quest.prerequisites}</Badge>
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(quest.status)} className="capitalize">
                      {quest.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{quest.submissions}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/quests/${quest.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
