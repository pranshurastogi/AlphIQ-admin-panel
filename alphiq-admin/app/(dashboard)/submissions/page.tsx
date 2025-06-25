"use client"

import { useState } from "react"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Check,
  X,
  Eye,
  Search,
  Filter,
  ExternalLink,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Submission {
  id: string
  userAddress: string
  questTitle: string
  submittedAt: string
  proofLink: string
  proofType: "transaction" | "file" | "url"
  status: "pending" | "approved" | "rejected"
  reviewNotes?: string
  xpReward: number
}

const mockSubmissions: Submission[] = [
  {
    id: "1",
    userAddress: "0x1234...5678",
    questTitle: "Complete DeFi Swap on Uniswap",
    submittedAt: "2024-01-20T10:30:00Z",
    proofLink: "0xabc123...def456",
    proofType: "transaction",
    status: "pending",
    xpReward: 500,
  },
  {
    id: "2",
    userAddress: "0x2345...6789",
    questTitle: "Mint Your First NFT",
    submittedAt: "2024-01-19T15:45:00Z",
    proofLink: "https://opensea.io/assets/...",
    proofType: "url",
    status: "approved",
    reviewNotes: "Valid NFT mint transaction confirmed",
    xpReward: 300,
  },
  {
    id: "3",
    userAddress: "0x3456...7890",
    questTitle: "Share on Twitter",
    submittedAt: "2024-01-19T09:15:00Z",
    proofLink: "https://twitter.com/user/status/...",
    proofType: "url",
    status: "rejected",
    reviewNotes: "Tweet does not contain required hashtags",
    xpReward: 100,
  },
  {
    id: "4",
    userAddress: "0x4567...8901",
    questTitle: "Complete Web3 Tutorial",
    submittedAt: "2024-01-18T14:20:00Z",
    proofLink: "certificate.pdf",
    proofType: "file",
    status: "pending",
    xpReward: 750,
  },
]

export default function SubmissionsPage() {
  const [submissions, setSubmissions] =
    useState<Submission[]>(mockSubmissions)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedSubmissions, setSelectedSubmissions] =
    useState<string[]>([])
  const [reviewingSubmission, setReviewingSubmission] =
    useState<Submission | null>(null)
  const [reviewNotes, setReviewNotes] = useState("")
  const { toast } = useToast()

  const filteredSubmissions = submissions.filter((submission) => {
    const matchesSearch =
      submission.userAddress
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      submission.questTitle
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    const matchesStatus =
      statusFilter === "all" ||
      submission.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleSelectSubmission = (
    submissionId: string,
    checked: boolean
  ) => {
    if (checked) {
      setSelectedSubmissions([
        ...selectedSubmissions,
        submissionId,
      ])
    } else {
      setSelectedSubmissions(
        selectedSubmissions.filter((id) => id !== submissionId)
      )
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSubmissions(
        filteredSubmissions.map((s) => s.id)
      )
    } else {
      setSelectedSubmissions([])
    }
  }

  const handleReview = (
    submission: Submission,
    status: "approved" | "rejected"
  ) => {
    setSubmissions(
      submissions.map((s) =>
        s.id === submission.id
          ? { ...s, status, reviewNotes }
          : s
      )
    )
    setReviewingSubmission(null)
    setReviewNotes("")
    toast({
      title: `Submission ${status}`,
      description: `${submission.questTitle} submission has been ${status}.`,
    })
  }

  const handleBatchAction = (action: "approve" | "reject") => {
    const updatedSubmissions = submissions.map((s) =>
      selectedSubmissions.includes(s.id) &&
      s.status === "pending"
        ? {
            ...s,
            status:
              action === "approve"
                ? "approved"
                : "rejected",
          }
        : s
    )
    setSubmissions(updatedSubmissions)
    setSelectedSubmissions([])
    toast({
      title: `Batch ${action}`,
      description: `${selectedSubmissions.length} submissions have been ${action}d.`,
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "default"
      case "pending":
        return "secondary"
      case "rejected":
        return "destructive"
      default:
        return "outline"
    }
  }

  const formatDate = (dateString: string) => {
    return (
      new Date(dateString).toLocaleDateString() +
      " " +
      new Date(dateString).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Submissions Review
          </h1>
          <p className="text-muted-foreground">
            Review and approve quest submissions from users
          </p>
        </div>
        {selectedSubmissions.length > 0 && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleBatchAction("approve")}
              className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
            >
              <Check className="mr-2 h-4 w-4" />
              Approve Selected (
              {selectedSubmissions.length})
            </Button>
            <Button
              variant="outline"
              onClick={() => handleBatchAction("reject")}
              className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
            >
              <X className="mr-2 h-4 w-4" />
              Reject Selected (
              {selectedSubmissions.length})
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Submissions</CardTitle>
          <CardDescription>
            Review quest submissions and manage approvals
          </CardDescription>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user or quest..."
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
                className="max-w-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    All Status
                  </SelectItem>
                  <SelectItem value="pending">
                    Pending
                  </SelectItem>
                  <SelectItem value="approved">
                    Approved
                  </SelectItem>
                  <SelectItem value="rejected">
                    Rejected
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      selectedSubmissions.length ===
                        filteredSubmissions.length &&
                      filteredSubmissions.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>User</TableHead>
                <TableHead>Quest</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Proof</TableHead>
                <TableHead>XP</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedSubmissions.includes(
                        submission.id
                      )}
                      onCheckedChange={(checked) =>
                        handleSelectSubmission(
                          submission.id,
                          checked as boolean
                        )
                      }
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {submission.userAddress}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate">
                      {submission.questTitle}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(submission.submittedAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-xs"
                      >
                        {submission.proofType}
                      </Badge>
                      {submission.proofType === "url" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <a
                            href={submission.proofLink}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">
                    {submission.xpReward} XP
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getStatusColor(
                        submission.status
                      )}
                      className="capitalize"
                    >
                      {submission.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setReviewingSubmission(
                                submission
                              )
                              setReviewNotes(
                                submission.reviewNotes ||
                                  ""
                              )
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </SheetTrigger>
                        <SheetContent>
                          <SheetHeader>
                            <SheetTitle>
                              Review Submission
                            </SheetTitle>
                            <SheetDescription>
                              Review the submission details
                              and provide feedback
                            </SheetDescription>
                          </SheetHeader>
                          {reviewingSubmission && (
                            <div className="space-y-6 mt-6">
                              <div>
                                <Label className="text-sm font-medium">
                                  User Address
                                </Label>
                                <p className="font-mono text-sm mt-1">
                                  {
                                    reviewingSubmission.userAddress
                                  }
                                </p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">
                                  Quest
                                </Label>
                                <p className="text-sm mt-1">
                                  {
                                    reviewingSubmission.questTitle
                                  }
                                </p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">
                                  XP Reward
                                </Label>
                                <p className="text-sm mt-1">
                                  {
                                    reviewingSubmission.xpReward
                                  }{" "}
                                  XP
                                </p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">
                                  Review Notes
                                </Label>
                                <Textarea
                                  value={reviewNotes}
                                  onChange={(e) =>
                                    setReviewNotes(
                                      e.target.value
                                    )
                                  }
                                  placeholder="Enter review notes..."
                                  className="w-full"
                                />
                              </div>
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  onClick={() =>
                                    setReviewingSubmission(
                                      null
                                    )
                                  }
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={() =>
                                    handleReview(
                                      reviewingSubmission,
                                      "approved"
                                    )
                                  }
                                >
                                  <Check className="h-4 w-4" />{" "}
                                  Approve
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() =>
                                    handleReview(
                                      reviewingSubmission,
                                      "rejected"
                                    )
                                  }
                                >
                                  <X className="h-4 w-4" /> Reject
                                </Button>
                              </div>
                            </div>
                          )}
                        </SheetContent>
                      </Sheet>
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
