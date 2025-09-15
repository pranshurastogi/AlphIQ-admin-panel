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
  Image as ImageIcon,
  FileText,
  Link,
  Calendar,
  User,
  Trophy,
  Star,
  RefreshCw,
  AlertTriangle,
  FileDown,
  Crown,
  Coins,
  DollarSign,
  Edit,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabaseClient"

interface Submission {
  id: number
  quest_id: number
  user_address: string
  proof_url: string
  proof_data: any
  submitted_at: string
  status: "pending" | "approved" | "rejected"
  reviewed_by: string | null
  reviewed_at: string | null
  review_notes: string | null
  quest: {
    id: number
    title: string
    description: string
    xp_reward: number
    multiplier: number
    category_id: number
    created_by: string
    is_active: boolean
    category: {
      id: number
      name: string
    }
    creator?: {
      full_name: string
    }
  }
}

interface SubmissionStats {
  total: number
  pending: number
  approved: number
  rejected: number
}

export default function SubmissionsPage() {
  const { profile, hasPermission } = useAuth()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [createdByFilter, setCreatedByFilter] = useState<string>("all")
  const [questFilter, setQuestFilter] = useState<string>("all")
  const [selectedSubmissions, setSelectedSubmissions] = useState<number[]>([])
  const [reviewingSubmission, setReviewingSubmission] = useState<Submission | null>(null)
  const [reviewNotes, setReviewNotes] = useState("")
  const [stats, setStats] = useState<SubmissionStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  })
  const [isReviewing, setIsReviewing] = useState(false)
  const { toast } = useToast()

  // XP Verification State
  const [isVerifying, setIsVerifying] = useState(false)
  const [xpVerificationResults, setXpVerificationResults] = useState<{
    totalDiscrepancies: number
    totalXPDiscrepancy: number
    discrepancies: Array<{
      address: string
      currentXP: number
      expectedXP: number
      difference: number
    }>
  } | null>(null)
  const [xpVerificationModal, setXpVerificationModal] = useState(false)
  const [isRepairing, setIsRepairing] = useState(false)
  const [repairHistory, setRepairHistory] = useState<Array<{
    timestamp: string
    action: string
    details: string
    changes: Array<{
      address: string
      oldXP: number
      newXP: number
      difference: number
    }>
  }>>([])
  const [showRepairConfirmation, setShowRepairConfirmation] = useState(false)

  // Winner Selection State
  const [selectingWinner, setSelectingWinner] = useState<Submission | null>(null)
  const [winnerForm, setWinnerForm] = useState({
    display_name: '',
    winning_amount: '',
    winning_token: 'ALPH',
    custom_token: '',
    approx_amount_usd: '',
    exchange_rate_usd: '',
    pricing_source: '',
    status: 'pending' as 'pending' | 'approved' | 'claimable' | 'paid' | 'failed' | 'expired' | 'cancelled' | 'rejected' | 'revoked',
    comments: '',
    tx_hash: '',
    proof_url: '',
  })
  const [useCustomToken, setUseCustomToken] = useState(false)
  const [isCreatingWinner, setIsCreatingWinner] = useState(false)
  const [winnerSubmissions, setWinnerSubmissions] = useState<Set<number>>(new Set())
  const [editingWinnerFromSubmission, setEditingWinnerFromSubmission] = useState<{submission: Submission, winner: any} | null>(null)
  const [editWinnerForm, setEditWinnerForm] = useState({
    display_name: '',
    winning_amount: '',
    winning_token: '',
    custom_token: '',
    approx_amount_usd: '',
    exchange_rate_usd: '',
    pricing_source: '',
    status: 'pending' as 'pending' | 'approved' | 'claimable' | 'paid' | 'failed' | 'expired' | 'cancelled' | 'rejected' | 'revoked',
    comments: '',
    tx_hash: '',
    proof_url: '',
  })
  const [useCustomTokenEdit, setUseCustomTokenEdit] = useState(false)
  const [isUpdatingWinnerFromSubmission, setIsUpdatingWinnerFromSubmission] = useState(false)

  // Helper function to verify XP consistency across all users
  const verifyXPConsistency = async () => {
    try {
      setIsVerifying(true)
      console.log('🔍 Verifying XP consistency across all users...')
      
      // Get all users with their current admin_total_xp
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('address, admin_total_xp')
        .order('admin_total_xp', { ascending: false })

      if (usersError) {
        console.error('Error fetching users for XP verification:', usersError)
        toast({
          title: "Error",
          description: "Failed to fetch users for XP verification",
          variant: "destructive",
        })
        return
      }

      let totalDiscrepancies = 0
      let totalXPDiscrepancy = 0
      const discrepancies: Array<{
        address: string
        currentXP: number
        expectedXP: number
        difference: number
      }> = []

      for (const user of users) {
        // Calculate expected XP from history
        const { data: history, error: historyError } = await supabase
          .from('admin_user_xp_history')
          .select('change')
          .eq('user_address', user.address)

        if (historyError) {
          console.error(`Error fetching XP history for ${user.address}:`, historyError)
          continue
        }

        const expectedXP = history.reduce((sum, record) => sum + (record.change || 0), 0)
        const currentXP = user.admin_total_xp || 0
        const discrepancy = currentXP - expectedXP

        if (discrepancy !== 0) {
          totalDiscrepancies++
          totalXPDiscrepancy += Math.abs(discrepancy)
          discrepancies.push({
            address: user.address,
            currentXP,
            expectedXP,
            difference: discrepancy
          })
          console.warn(`⚠️ XP discrepancy for ${user.address}: Expected ${expectedXP}, Got ${currentXP}, Difference: ${discrepancy}`)
        }
      }

      const results = {
        totalDiscrepancies,
        totalXPDiscrepancy,
        discrepancies
      }

      setXpVerificationResults(results)

      if (totalDiscrepancies === 0) {
        console.log('✅ All users have consistent XP values!')
        toast({
          title: "XP Verification Complete",
          description: "✅ All users have consistent XP values!",
        })
      } else {
        console.warn(`⚠️ Found ${totalDiscrepancies} users with XP discrepancies. Total XP difference: ${totalXPDiscrepancy}`)
        toast({
          title: "XP Verification Complete",
          description: `⚠️ Found ${totalDiscrepancies} users with XP discrepancies. Total XP difference: ${totalXPDiscrepancy}`,
        })
        // Open modal to show results
        setXpVerificationModal(true)
      }

      return results
    } catch (error) {
      console.error('Error verifying XP consistency:', error)
      toast({
        title: "Error",
        description: "Failed to verify XP consistency",
        variant: "destructive",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  // Helper function to repair XP discrepancies
  const repairXPDiscrepancies = async () => {
    if (!xpVerificationResults) return

    try {
      setIsRepairing(true)
      console.log('🔧 Starting XP repair process...')

      const changes: Array<{
        address: string
        oldXP: number
        newXP: number
        difference: number
      }> = []

      // Repair each discrepancy
      for (const discrepancy of xpVerificationResults.discrepancies) {
        const { error: updateError } = await supabase
          .from('users')
          .update({
            admin_total_xp: discrepancy.expectedXP,
            updated_at: new Date().toISOString(),
          })
          .eq('address', discrepancy.address)

        if (updateError) {
          console.error(`Failed to repair XP for ${discrepancy.address}:`, updateError)
          toast({
            title: "Error",
            description: `Failed to repair XP for ${discrepancy.address}`,
            variant: "destructive",
          })
          continue
        }

        changes.push({
          address: discrepancy.address,
          oldXP: discrepancy.currentXP,
          newXP: discrepancy.expectedXP,
          difference: discrepancy.difference
        })

        console.log(`✅ Repaired XP for ${discrepancy.address}: ${discrepancy.currentXP} → ${discrepancy.expectedXP}`)
      }

      // Record repair action in history
      const repairRecord = {
        timestamp: new Date().toISOString(),
        action: 'XP Repair',
        details: `Fixed ${changes.length} XP discrepancies. Total XP difference: ${xpVerificationResults.totalXPDiscrepancy}`,
        changes
      }

      setRepairHistory(prev => [repairRecord, ...prev])

      // Show success message
      toast({
        title: "XP Repair Complete",
        description: `✅ Successfully repaired ${changes.length} XP discrepancies!`,
      })

      // Close modal and refresh results
      setXpVerificationModal(false)
      setXpVerificationResults(null)

      console.log('🔧 XP repair process completed successfully')

    } catch (error) {
      console.error('Error during XP repair:', error)
      toast({
        title: "Error",
        description: "Failed to repair XP discrepancies",
        variant: "destructive",
      })
    } finally {
      setIsRepairing(false)
    }
  }

  // Helper function to rollback last repair
  const rollbackLastRepair = async () => {
    if (repairHistory.length === 0) return

    try {
      const lastRepair = repairHistory[0]
      console.log('🔄 Rolling back last XP repair...')

      // Rollback each change
      for (const change of lastRepair.changes) {
        const { error: updateError } = await supabase
          .from('users')
          .update({
            admin_total_xp: change.oldXP,
            updated_at: new Date().toISOString(),
          })
          .eq('address', change.address)

        if (updateError) {
          console.error(`Failed to rollback XP for ${change.address}:`, updateError)
          toast({
            title: "Error",
            description: `Failed to rollback XP for ${change.address}`,
            variant: "destructive",
          })
          continue
        }

        console.log(`🔄 Rolled back XP for ${change.address}: ${change.newXP} → ${change.oldXP}`)
      }

      // Remove from history
      setRepairHistory(prev => prev.slice(1))

      toast({
        title: "Rollback Complete",
        description: `✅ Successfully rolled back last XP repair!`,
      })

      console.log('🔄 XP rollback completed successfully')

    } catch (error) {
      console.error('Error during XP rollback:', error)
      toast({
        title: "Error",
        description: "Failed to rollback XP changes",
        variant: "destructive",
      })
    }
  }

  // Helper function to manage XP updates and verify consistency
  const manageXPUpdate = async (userAddress: string, xpChange: number, submissionId: number, reason: string) => {
    try {
      // 1. Check if XP history already exists for this submission to prevent duplicates
      const { data: existingHistory } = await supabase
        .from('admin_user_xp_history')
        .select('id')
        .eq('submission_id', submissionId)
        .eq('change', xpChange)
        .single()

      if (existingHistory) {
        console.log(`XP history already exists for submission ${submissionId}, skipping duplicate`)
        return { success: true, skipped: true, message: 'XP already awarded' }
      }

      // 2. Get current user XP before update
      const { data: userBefore, error: userBeforeError } = await supabase
        .from('users')
        .select('admin_total_xp')
        .eq('address', userAddress)
        .single()

      if (userBeforeError) {
        console.error('Error getting user XP before update:', userBeforeError)
        return { success: false, error: userBeforeError }
      }

      const xpBefore = userBefore?.admin_total_xp || 0

      // 3. Add XP history record - the database trigger will automatically update admin_total_xp
      const { error: historyError } = await supabase
        .from('admin_user_xp_history')
        .insert({
          user_address: userAddress,
          change: xpChange,
          reason: reason,
          submission_id: submissionId,
        })

      if (historyError) {
        console.error('Error adding XP history:', historyError)
        return { success: false, error: historyError }
      }

      // 4. Wait a moment for the database trigger to execute
      await new Promise(resolve => setTimeout(resolve, 100))

      // 5. Verify XP was updated correctly
      const { data: userAfter, error: userAfterError } = await supabase
        .from('users')
        .select('admin_total_xp')
        .eq('address', userAddress)
        .single()

      if (userAfterError) {
        console.error('Error getting user XP after update:', userAfterError)
        return { success: false, error: userAfterError }
      }

      const xpAfter = userAfter?.admin_total_xp || 0
      const expectedXP = xpBefore + xpChange

      // 6. Verify XP consistency
      if (xpAfter !== expectedXP) {
        console.error(`XP mismatch detected! Expected: ${expectedXP}, Got: ${xpAfter}`)
        
        // Try to fix the XP manually if the trigger failed
        const { error: fixError } = await supabase
          .from('users')
          .update({
            admin_total_xp: expectedXP,
            updated_at: new Date().toISOString(),
          })
          .eq('address', userAddress)

        if (fixError) {
          console.error('Failed to fix XP manually:', fixError)
          return { 
            success: false, 
            error: new Error(`XP mismatch detected and couldn't be fixed. Expected: ${expectedXP}, Got: ${xpAfter}`)
          }
        }

        console.log(`XP fixed manually: ${xpAfter} → ${expectedXP}`)
        return { 
          success: true, 
          fixed: true, 
          message: `XP updated: ${xpBefore} → ${expectedXP} (fixed manually)` 
        }
      }

      console.log(`XP updated successfully: ${xpBefore} → ${xpAfter}`)
      return { 
        success: true, 
        message: `XP updated: ${xpBefore} → ${xpAfter}`,
        xpBefore,
        xpAfter,
        xpChange
      }

    } catch (error) {
      console.error('Error in manageXPUpdate:', error)
      return { success: false, error }
    }
  }

  // Fetch submissions based on user role - using direct Supabase access like quests page
  const fetchSubmissions = async () => {
    if (!profile) return

    setLoading(true)
    try {
      let query = supabase
        .from('admin_quest_submissions')
        .select(`
          *,
          quest:admin_quests(
            id,
            title,
            description,
            xp_reward,
            multiplier,
            category_id,
            created_by,
            is_active,
            category:admin_quest_categories(id, name),
            creator:admin_user_profiles!admin_quests_created_by_fkey(full_name)
          )
        `)
        .order('submitted_at', { ascending: false })

      // Apply role-based filtering - same logic as quests page
      if (profile.role !== 'super_admin') {
        // Non-super admins can only see submissions for quests they created
        query = query.eq('quest.created_by', profile.id)
      }

      const { data: submissions, error } = await query

      if (error) {
        console.error('Error fetching submissions:', error)
        toast({
          title: "Error",
          description: "Failed to load submissions",
          variant: "destructive",
        })
        return
      }

      // Filter out submissions with null quest objects (orphaned submissions)
      const validSubmissions = (submissions || []).filter(s => s.quest)

      setSubmissions(validSubmissions)
      
      // Check which submissions are already winners
      const submissionIds = validSubmissions.map(s => s.id)
      if (submissionIds.length > 0) {
        const { data: winners } = await supabase
          .from('admin_quest_winners')
          .select('submission_id')
          .in('submission_id', submissionIds)
          .not('submission_id', 'is', null)
        
        const winnerSubmissionIds = new Set((winners || []).map(w => w.submission_id))
        setWinnerSubmissions(winnerSubmissionIds)
      }
      
      // Calculate stats
      const stats = {
        total: validSubmissions.length,
        pending: validSubmissions.filter((s: Submission) => s.status === 'pending').length,
        approved: validSubmissions.filter((s: Submission) => s.status === 'approved').length,
        rejected: validSubmissions.filter((s: Submission) => s.status === 'rejected').length,
      }
      setStats(stats)
    } catch (error) {
      console.error('Error fetching submissions:', error)
      toast({
        title: "Error",
        description: "Failed to load submissions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubmissions()
  }, [profile])

  const filteredSubmissions = submissions.filter((submission) => {
    const matchesSearch =
      submission.user_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.quest.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || submission.status === statusFilter
    const matchesCategory = categoryFilter === "all" || submission.quest.category?.name === categoryFilter
    const matchesCreatedBy = createdByFilter === "all" || submission.quest.created_by === createdByFilter
    const matchesQuest = questFilter === "all" || submission.quest_id.toString() === questFilter
    return matchesSearch && matchesStatus && matchesCategory && matchesCreatedBy && matchesQuest
  })

  const handleSelectSubmission = (submissionId: number, checked: boolean) => {
    if (checked) {
      setSelectedSubmissions([...selectedSubmissions, submissionId])
    } else {
      setSelectedSubmissions(selectedSubmissions.filter((id) => id !== submissionId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSubmissions(filteredSubmissions.map((s) => s.id))
    } else {
      setSelectedSubmissions([])
    }
  }

  const handleReview = async (submission: Submission, status: "approved" | "rejected") => {
    if (!profile) return

    setIsReviewing(true)
    try {
      // Check permissions - same logic as quests page
      if (profile.role !== 'super_admin' && submission.quest.created_by !== profile.id) {
        toast({
          title: "Error",
          description: "Insufficient permissions to review this submission",
          variant: "destructive",
        })
        return
      }

      // Get current submission status to handle XP changes
      const currentStatus = submission.status
      const xpReward = submission.quest.xp_reward * submission.quest.multiplier

      // Handle XP changes based on status transition
      let xpChange = 0
      let xpHistoryReason = ""

      if (currentStatus === 'pending' && status === 'approved') {
        // New approval - add XP
        xpChange = xpReward
        xpHistoryReason = `Quest approved: ${submission.quest.title}`
      } else if (currentStatus === 'approved' && status === 'rejected') {
        // Change from approved to rejected - remove XP
        xpChange = -xpReward
        xpHistoryReason = `Quest rejected: ${submission.quest.title}`
      } else if (currentStatus === 'rejected' && status === 'approved') {
        // Change from rejected to approved - add XP
        xpChange = xpReward
        xpHistoryReason = `Quest approved: ${submission.quest.title}`
      }

      // 1. Update submission status
      const { error: submissionError } = await supabase
        .from('admin_quest_submissions')
        .update({
          status,
          reviewed_by: profile.id,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes,
        })
        .eq('id', submission.id)

      if (submissionError) {
        throw submissionError
      }

      // 2. Handle XP changes if needed
      if (xpChange !== 0) {
        // Use the helper function to manage XP updates and verify consistency
        const xpResult = await manageXPUpdate(submission.user_address, xpChange, submission.id, xpHistoryReason)

        if (!xpResult.success) {
          console.error('Error managing XP update:', xpResult.error)
          toast({
            title: "Error",
            description: "Failed to update XP and submission status",
            variant: "destructive",
          })
          return
        }

        // Log XP update result
        if (xpResult.fixed) {
          console.warn(`⚠️ XP was fixed manually: ${xpResult.message}`)
        } else if (xpResult.skipped) {
          console.log(`ℹ️ XP update skipped: ${xpResult.message}`)
        } else {
          console.log(`✅ XP updated successfully: ${xpResult.message}`)
        }
      }

      // Update local state
      setSubmissions(submissions.map((s) =>
        s.id === submission.id
          ? {
              ...s,
              status,
              reviewed_by: profile.id,
              reviewed_at: new Date().toISOString(),
              review_notes: reviewNotes,
            }
          : s
      ))

      setReviewingSubmission(null)
      setReviewNotes("")
      
      // Show appropriate message
      const xpMessage = xpChange > 0 
        ? ` and awarded ${xpChange} XP` 
        : xpChange < 0 
        ? ` and removed ${Math.abs(xpChange)} XP`
        : ''
      
      toast({
        title: `Submission ${status}`,
        description: `${submission.quest.title} submission has been ${status}${xpMessage}.`,
      })

      // Refresh stats
      fetchSubmissions()
    } catch (error) {
      console.error('Error reviewing submission:', error)
      toast({
        title: "Error",
        description: "Failed to update submission and XP",
        variant: "destructive",
      })
    } finally {
      setIsReviewing(false)
    }
  }

  const handleBatchAction = async (action: "approve" | "reject") => {
    if (!profile || selectedSubmissions.length === 0) return

    setIsReviewing(true)
    try {
      // Check permissions for all selected submissions
      const selectedSubs = submissions.filter(s => selectedSubmissions.includes(s.id))
      const unauthorizedSubs = selectedSubs.filter(s => 
        profile.role !== 'super_admin' && s.quest.created_by !== profile.id
      )

      if (unauthorizedSubs.length > 0) {
        toast({
          title: "Error",
          description: "Insufficient permissions for some submissions",
          variant: "destructive",
        })
        return
      }

      // Process each submission individually to handle XP properly
      let processedCount = 0
      let totalXPAwarded = 0

      for (const submissionId of selectedSubmissions) {
        const submission = submissions.find(s => s.id === submissionId && s.status === 'pending')
        if (!submission) continue

        const xpReward = submission.quest.xp_reward * submission.quest.multiplier
        const xpChange = action === "approve" ? xpReward : 0
        const xpHistoryReason = action === "approve" 
          ? `Quest approved: ${submission.quest.title}`
          : `Quest rejected: ${submission.quest.title}`

        // Update submission status
        const { error: submissionError } = await supabase
          .from('admin_quest_submissions')
          .update({
            status: action === "approve" ? "approved" : "rejected",
            reviewed_by: profile.id,
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', submissionId)

        if (submissionError) {
          console.error(`Error updating submission ${submissionId}:`, submissionError)
          continue
        }

        // Handle XP for approved submissions
        if (action === "approve" && xpChange > 0) {
          // Use the helper function to manage XP updates and verify consistency
          const xpResult = await manageXPUpdate(submission.user_address, xpChange, submissionId, xpHistoryReason)

          if (!xpResult.success) {
            console.error(`Error managing XP update for submission ${submissionId}:`, xpResult.error)
            continue
          }

          // Log XP update result
          if (xpResult.fixed) {
            console.warn(`⚠️ XP was fixed manually for submission ${submissionId}: ${xpResult.message}`)
          } else if (xpResult.skipped) {
            console.log(`ℹ️ XP update skipped for submission ${submissionId}: ${xpResult.message}`)
          } else {
            console.log(`✅ XP updated successfully for submission ${submissionId}: ${xpResult.message}`)
          }

          totalXPAwarded += xpChange
        }

        processedCount++
      }

      // Update local state
      setSubmissions(submissions.map((s) =>
        selectedSubmissions.includes(s.id) && s.status === 'pending'
          ? {
              ...s,
              status: action === "approve" ? "approved" : "rejected",
              reviewed_by: profile.id,
              reviewed_at: new Date().toISOString(),
            }
          : s
      ))

      setSelectedSubmissions([])
      
      // Show appropriate message
      const xpMessage = action === "approve" && totalXPAwarded > 0 
        ? ` and awarded ${totalXPAwarded} XP total`
        : ''
      
      toast({
        title: `Batch ${action}`,
        description: `${processedCount} submissions have been ${action}d${xpMessage}.`,
      })

      // Refresh stats
      fetchSubmissions()
    } catch (error) {
      console.error('Error batch updating submissions:', error)
      toast({
        title: "Error",
        description: "Failed to update submissions and XP",
        variant: "destructive",
      })
    } finally {
      setIsReviewing(false)
    }
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4" />
      case "pending":
        return <Clock className="h-4 w-4" />
      case "rejected":
        return <XCircle className="h-4 w-4" />
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

  const getProofTypeIcon = (proofUrl: string) => {
    if (proofUrl.startsWith('http')) {
      return <Link className="h-4 w-4" />
    } else if (proofUrl.includes('.jpg') || proofUrl.includes('.png') || proofUrl.includes('.jpeg')) {
      return <ImageIcon className="h-4 w-4" />
    } else {
      return <FileText className="h-4 w-4" />
    }
  }

  const renderProofData = (proofData: any) => {
    if (!proofData) return null

    // Check if proof_data contains image URLs
    const imageUrls: string[] = []
    
    const findImageUrls = (obj: any): void => {
      if (typeof obj === 'string') {
        // Check if it's an image URL
        if (obj.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) || obj.startsWith('data:image/')) {
          imageUrls.push(obj)
        }
      } else if (typeof obj === 'object' && obj !== null) {
        Object.values(obj).forEach(findImageUrls)
      }
    }
    
    findImageUrls(proofData)

    if (imageUrls.length > 0) {
      return (
        <div className="space-y-4">
          <Label className="text-sm font-medium">Images Found</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {imageUrls.map((url, index) => (
              <div key={index} className="space-y-2">
                <img 
                  src={url} 
                  alt={`Proof image ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg border"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
                <p className="text-xs text-muted-foreground truncate">{url}</p>
              </div>
            ))}
          </div>
          <div>
            <Label className="text-sm font-medium">Raw Data</Label>
            <div className="mt-1 p-3 bg-muted rounded-lg border">
              <pre className="text-xs overflow-auto max-h-32 whitespace-pre-wrap">
                {JSON.stringify(proofData, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )
    }

    // If no images, show as regular JSON
    return (
      <div>
        <Label className="text-sm font-medium">Proof Data</Label>
        <div className="mt-1 p-3 bg-muted rounded-lg border">
          <pre className="text-xs overflow-auto max-h-64 whitespace-pre-wrap">
            {JSON.stringify(proofData, null, 2)}
          </pre>
        </div>
      </div>
    )
  }

  const canReviewSubmission = (submission: Submission) => {
    if (!profile) return false
    
    // Super admin can review all submissions
    if (profile.role === 'super_admin') return true
    
    // Other roles can only review submissions for quests they created
    return submission.quest.created_by === profile.id
  }

  const canSelectWinner = (submission: Submission) => {
    if (!profile) return false
    
    // Super admin can select winners for all submissions
    if (profile.role === 'super_admin') return true
    
    // Sub admin can only select winners for quests they created
    if (profile.role === 'sub_admin' && submission.quest.created_by === profile.id) return true
    
    return false
  }

  const handleSelectWinner = (submission: Submission) => {
    setSelectingWinner(submission)
    // Pre-fill form with submission data
    setWinnerForm({
      display_name: '',
      winning_amount: '',
      winning_token: 'ALPH',
      custom_token: '',
      approx_amount_usd: '',
      exchange_rate_usd: '',
      pricing_source: '',
      status: 'pending',
      comments: '',
      tx_hash: '',
      proof_url: submission.proof_url,
    })
    setUseCustomToken(false)
  }

  const handleCreateWinner = async () => {
    if (!selectingWinner || !profile) return

    setIsCreatingWinner(true)
    try {
      // Validate required fields
      if (!winnerForm.winning_amount || parseFloat(winnerForm.winning_amount) <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid winning amount",
          variant: "destructive",
        })
        return
      }

      // Validate custom token if using custom token
      if (useCustomToken && (!winnerForm.custom_token || winnerForm.custom_token.trim() === '')) {
        toast({
          title: "Error",
          description: "Please enter a custom token name",
          variant: "destructive",
        })
        return
      }

      // Check if winner already exists for this quest and user
      const { data: existingWinner } = await supabase
        .from('admin_quest_winners')
        .select('winner_id')
        .eq('quest_id', selectingWinner.quest_id)
        .eq('user_address', selectingWinner.user_address)
        .single()

      if (existingWinner) {
        toast({
          title: "Error",
          description: "Winner already exists for this quest and user",
          variant: "destructive",
        })
        return
      }

      // Create winner record
      const { data: winner, error } = await supabase
        .from('admin_quest_winners')
        .insert({
          quest_id: selectingWinner.quest_id,
          submission_id: selectingWinner.id,
          user_address: selectingWinner.user_address,
          display_name: winnerForm.display_name || null,
          info: null,
          winning_amount: parseFloat(winnerForm.winning_amount),
          winning_token: useCustomToken ? winnerForm.custom_token.trim() : winnerForm.winning_token || null,
          approx_amount_usd: winnerForm.approx_amount_usd ? parseFloat(winnerForm.approx_amount_usd) : null,
          exchange_rate_usd: winnerForm.exchange_rate_usd ? parseFloat(winnerForm.exchange_rate_usd) : null,
          pricing_source: winnerForm.pricing_source || null,
          priced_at: winnerForm.pricing_source ? new Date().toISOString() : null,
          status: winnerForm.status,
          comments: winnerForm.comments || null,
          tx_hash: winnerForm.tx_hash || null,
          proof_url: winnerForm.proof_url || null,
          awarded_by: profile.id,
          awarded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating winner:', error)
        toast({
          title: "Error",
          description: "Failed to create winner record",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Winner Selected",
        description: `Successfully selected ${selectingWinner.user_address} as winner for "${selectingWinner.quest.title}"`,
      })

      // Update local state to mark this submission as a winner
      setWinnerSubmissions(prev => new Set([...prev, selectingWinner.id]))

      // Reset form and close dialog
      setSelectingWinner(null)
    setWinnerForm({
      display_name: '',
      winning_amount: '',
      winning_token: 'ALPH',
      custom_token: '',
      approx_amount_usd: '',
      exchange_rate_usd: '',
      pricing_source: '',
      status: 'pending',
      comments: '',
      tx_hash: '',
      proof_url: '',
    })
    setUseCustomToken(false)

    } catch (error) {
      console.error('Error creating winner:', error)
      toast({
        title: "Error",
        description: "Failed to create winner record",
        variant: "destructive",
      })
    } finally {
      setIsCreatingWinner(false)
    }
  }

  const handleEditWinnerFromSubmission = async (submission: Submission) => {
    try {
      // Fetch the winner data for this submission
      const { data: winner, error } = await supabase
        .from('admin_quest_winners')
        .select('*')
        .eq('submission_id', submission.id)
        .single()

      if (error || !winner) {
        toast({
          title: "Error",
          description: "No winner record found for this submission",
          variant: "destructive",
        })
        return
      }

      setEditingWinnerFromSubmission({ submission, winner })
      setEditWinnerForm({
        display_name: winner.display_name || '',
        winning_amount: winner.winning_amount.toString(),
        winning_token: winner.winning_token || '',
        custom_token: '',
        approx_amount_usd: winner.approx_amount_usd?.toString() || '',
        exchange_rate_usd: winner.exchange_rate_usd?.toString() || '',
        pricing_source: winner.pricing_source || '',
        status: winner.status,
        comments: winner.comments || '',
        tx_hash: winner.tx_hash || '',
        proof_url: winner.proof_url || '',
      })

      // Check if token is in predefined list
      const predefinedTokens = ['ALPH', 'USDT', 'USDC', 'BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'DOT', 'MATIC', 'AVAX', 'LINK', 'UNI']
      if (winner.winning_token && !predefinedTokens.includes(winner.winning_token)) {
        setUseCustomTokenEdit(true)
        setEditWinnerForm(prev => ({ ...prev, custom_token: winner.winning_token || '' }))
      } else {
        setUseCustomTokenEdit(false)
      }
    } catch (error) {
      console.error('Error fetching winner data:', error)
      toast({
        title: "Error",
        description: "Failed to fetch winner data",
        variant: "destructive",
      })
    }
  }

  const handleUpdateWinnerFromSubmission = async () => {
    if (!editingWinnerFromSubmission || !profile) return

    setIsUpdatingWinnerFromSubmission(true)
    try {
      // Validate required fields
      if (!editWinnerForm.winning_amount || parseFloat(editWinnerForm.winning_amount) <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid winning amount",
          variant: "destructive",
        })
        return
      }

      // Validate custom token if using custom token
      if (useCustomTokenEdit && (!editWinnerForm.custom_token || editWinnerForm.custom_token.trim() === '')) {
        toast({
          title: "Error",
          description: "Please enter a custom token name",
          variant: "destructive",
        })
        return
      }

      console.log('Updating winner from submission with data:', {
        winner_id: editingWinnerFromSubmission.winner.winner_id,
        status: editWinnerForm.status,
        formData: editWinnerForm
      })

      // Update winner record
      const { data: winner, error } = await supabase
        .from('admin_quest_winners')
        .update({
          display_name: editWinnerForm.display_name || null,
          winning_amount: parseFloat(editWinnerForm.winning_amount),
          winning_token: useCustomTokenEdit ? editWinnerForm.custom_token.trim() : editWinnerForm.winning_token || null,
          approx_amount_usd: editWinnerForm.approx_amount_usd ? parseFloat(editWinnerForm.approx_amount_usd) : null,
          exchange_rate_usd: editWinnerForm.exchange_rate_usd ? parseFloat(editWinnerForm.exchange_rate_usd) : null,
          pricing_source: editWinnerForm.pricing_source || null,
          priced_at: editWinnerForm.pricing_source ? new Date().toISOString() : null,
          status: editWinnerForm.status,
          comments: editWinnerForm.comments || null,
          tx_hash: editWinnerForm.tx_hash || null,
          proof_url: editWinnerForm.proof_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq('winner_id', editingWinnerFromSubmission.winner.winner_id)
        .select()
        .single()

      if (error) {
        console.error('Error updating winner:', error)
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        toast({
          title: "Error",
          description: `Failed to update winner record: ${error.message}`,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Winner Updated",
        description: `Successfully updated winner record for ${editingWinnerFromSubmission.submission.user_address}`,
      })

      // Reset form and close dialog
      setEditingWinnerFromSubmission(null)
      setEditWinnerForm({
        display_name: '',
        winning_amount: '',
        winning_token: '',
        custom_token: '',
        approx_amount_usd: '',
        exchange_rate_usd: '',
        pricing_source: '',
        status: 'pending',
        comments: '',
        tx_hash: '',
        proof_url: '',
      })
      setUseCustomTokenEdit(false)

    } catch (error) {
      console.error('Error updating winner:', error)
      toast({
        title: "Error",
        description: "Failed to update winner record",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingWinnerFromSubmission(false)
    }
  }

  // CSV Export functionality with different export types
  const exportToCSV = (exportType: 'full' | 'summary' | 'selected' = 'full') => {
    try {
      let dataToExport: any[] = []
      let filename = ''

      // Determine which data to export
      if (exportType === 'selected' && selectedSubmissions.length > 0) {
        dataToExport = submissions
          .filter(s => selectedSubmissions.includes(s.id))
          .map(submission => createExportRow(submission))
        filename = `submissions_selected_${new Date().toISOString().split('T')[0]}.csv`
      } else if (exportType === 'summary') {
        dataToExport = filteredSubmissions.map(submission => ({
          'Submission ID': submission.id,
          'User Address': submission.user_address,
          'Quest Title': submission.quest.title,
          'Category': submission.quest.category?.name || 'Unknown',
          'Total XP': submission.quest.xp_reward * submission.quest.multiplier,
          'Status': submission.status,
          'Submitted At': formatDate(submission.submitted_at),
          'Reviewed At': submission.reviewed_at ? formatDate(submission.reviewed_at) : '',
        }))
        filename = `submissions_summary_${new Date().toISOString().split('T')[0]}${getFilterInfo()}.csv`
      } else {
        // Full export
        dataToExport = filteredSubmissions.map(submission => createExportRow(submission))
        filename = `submissions_full_${new Date().toISOString().split('T')[0]}${getFilterInfo()}.csv`
      }

      if (dataToExport.length === 0) {
        toast({
          title: "No Data to Export",
          description: "No submissions match the current filters",
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
        description: `Exported ${dataToExport.length} submissions to CSV (${exportType} format)`,
      })
    } catch (error) {
      console.error('Error exporting CSV:', error)
      toast({
        title: "Export Failed",
        description: "Failed to export submissions to CSV",
        variant: "destructive",
      })
    }
  }

  // Helper function to create a full export row
  const createExportRow = (submission: Submission) => ({
    'Submission ID': submission.id,
    'User Address': submission.user_address,
    'Quest ID': submission.quest_id,
    'Quest Title': submission.quest.title,
    'Quest Description': submission.quest.description.replace(/\n/g, ' ').replace(/,/g, ';'),
    'Category': submission.quest.category?.name || 'Unknown',
    'XP Reward': submission.quest.xp_reward,
    'Multiplier': submission.quest.multiplier,
    'Total XP': submission.quest.xp_reward * submission.quest.multiplier,
    'Status': submission.status,
    'Submitted At': formatDate(submission.submitted_at),
    'Reviewed By': submission.reviewed_by || '',
    'Reviewed At': submission.reviewed_at ? formatDate(submission.reviewed_at) : '',
    'Review Notes': submission.review_notes ? submission.review_notes.replace(/\n/g, ' ').replace(/,/g, ';') : '',
    'Proof URL': submission.proof_url,
    'Proof Type': getProofTypeText(submission.proof_url),
    'Has Proof Data': submission.proof_data ? 'Yes' : 'No',
    'Quest Creator': submission.quest.creator?.full_name || submission.quest.created_by,
    'Quest Active': submission.quest.is_active ? 'Yes' : 'No',
    'Export Date': new Date().toISOString(),
    'Filter Applied': getFilterInfo().replace('_', '') || 'None'
  })

  // Helper function to get proof type as text
  const getProofTypeText = (proofUrl: string) => {
    if (proofUrl.startsWith('http')) {
      return 'Link'
    } else if (proofUrl.includes('.jpg') || proofUrl.includes('.png') || proofUrl.includes('.jpeg')) {
      return 'Image'
    } else {
      return 'File'
    }
  }

  // Helper function to generate filter info for filename
  const getFilterInfo = () => {
    const filters = []
    if (searchTerm) filters.push('search')
    if (statusFilter !== 'all') filters.push(`status-${statusFilter}`)
    if (categoryFilter !== 'all') filters.push(`category-${categoryFilter}`)
    if (createdByFilter !== 'all') filters.push('creator-filtered')
    if (questFilter !== 'all') filters.push('quest-filtered')
    
    return filters.length > 0 ? `_${filters.join('_')}` : '_all'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Submissions Review</h1>
            <p className="text-muted-foreground">
              Review and approve quest submissions from users
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
          <h1 className="text-3xl font-bold">Submissions Review</h1>
          <p className="text-muted-foreground">
            Review and approve quest submissions from users
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                disabled={loading || filteredSubmissions.length === 0}
                title="Export submissions to CSV"
              >
                <FileDown className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => exportToCSV('full')}
                disabled={filteredSubmissions.length === 0}
              >
                <FileText className="h-4 w-4 mr-2" />
                Full Export ({filteredSubmissions.length} records)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => exportToCSV('summary')}
                disabled={filteredSubmissions.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Summary Export ({filteredSubmissions.length} records)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => exportToCSV('selected')}
                disabled={selectedSubmissions.length === 0}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Selected Only ({selectedSubmissions.length} records)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            onClick={verifyXPConsistency}
            disabled={loading || isVerifying}
            title="Verify XP consistency across all users"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Verify XP {isVerifying && '(Verifying...)'}
          </Button>
          <Button
            variant="outline"
            onClick={fetchSubmissions}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Trophy className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
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
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">{stats.approved}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold">{stats.rejected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Submissions</CardTitle>
              <CardDescription>
                Review quest submissions and manage approvals
                {filteredSubmissions.length !== submissions.length && (
                  <span className="ml-2 text-blue-600 font-medium">
                    ({filteredSubmissions.length} of {submissions.length} shown)
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user or quest..."
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
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
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
                    new Map(submissions.map(s => [s.quest_id, { id: s.quest_id, title: s.quest.title }])).values()
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
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Array.from(new Set(submissions.map(s => s.quest.category?.name).filter(Boolean))).map(category => (
                    <SelectItem key={category} value={category!}>
                      {category}
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
                  {Array.from(new Set(submissions.map(s => s.quest.created_by))).map(creator => {
                    const creatorSubmission = submissions.find(s => s.quest.created_by === creator)
                    const creatorName = creatorSubmission?.quest.creator?.full_name || creator.slice(0, 8) + '...' + creator.slice(-6)
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
                  setCategoryFilter("all")
                  setCreatedByFilter("all")
                  setQuestFilter("all")
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {selectedSubmissions.length > 0 && (
            <div className="mb-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {selectedSubmissions.length} submission(s) selected
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleBatchAction("approve")}
                    disabled={isReviewing}
                    className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Approve Selected
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleBatchAction("reject")}
                    disabled={isReviewing}
                    className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Reject Selected
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="min-w-[1200px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        selectedSubmissions.length === filteredSubmissions.length &&
                        filteredSubmissions.length > 0
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="w-48">User</TableHead>
                  <TableHead className="w-64">Quest</TableHead>
                  <TableHead className="w-32">Category</TableHead>
                  <TableHead className="w-32">Submitted</TableHead>
                  <TableHead className="w-40">Proof</TableHead>
                  <TableHead className="w-24">XP</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                  <TableHead className="w-32 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {filteredSubmissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center space-y-2">
                      <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No submissions found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubmissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedSubmissions.includes(submission.id)}
                        onCheckedChange={(checked) =>
                          handleSelectSubmission(submission.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {submission.user_address.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-mono text-sm font-medium">
                            {submission.user_address.slice(0, 8)}...{submission.user_address.slice(-6)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {submission.user_address}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div>
                        <p className="font-medium truncate">{submission.quest.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {submission.quest.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {submission.quest.category?.name || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>{formatDate(submission.submitted_at)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {getProofTypeIcon(submission.proof_url)}
                        </Badge>
                        {submission.proof_data && (
                          <Badge variant="secondary" className="text-xs">
                            {(() => {
                              const imageUrls: string[] = []
                              const findImageUrls = (obj: any): void => {
                                if (typeof obj === 'string') {
                                  if (obj.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) || obj.startsWith('data:image/')) {
                                    imageUrls.push(obj)
                                  }
                                } else if (typeof obj === 'object' && obj !== null) {
                                  Object.values(obj).forEach(findImageUrls)
                                }
                              }
                              findImageUrls(submission.proof_data)
                              return imageUrls.length > 0 ? 'Images' : 'Data'
                            })()}
                          </Badge>
                        )}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Proof Details</DialogTitle>
                              <DialogDescription>
                                Review the submission proof and associated data
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6">
                              <div>
                                <Label className="text-sm font-medium">Proof URL</Label>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Input value={submission.proof_url} readOnly />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                  >
                                    <a
                                      href={submission.proof_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  </Button>
                                </div>
                              </div>
                              
                              {submission.proof_data && renderProofData(submission.proof_data)}
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium">Submission ID</Label>
                                  <p className="text-sm mt-1 font-mono">{submission.id}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Quest ID</Label>
                                  <p className="text-sm mt-1 font-mono">{submission.quest_id}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Submitted At</Label>
                                  <p className="text-sm mt-1">{formatDate(submission.submitted_at)}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Status</Label>
                                  <Badge variant={getStatusColor(submission.status)} className="mt-1">
                                    {submission.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Award className="h-3 w-3 text-yellow-500" />
                        <span className="font-mono text-sm">
                          {submission.quest.xp_reward} XP
                        </span>
                        {submission.quest.multiplier > 1 && (
                          <Badge variant="secondary" className="text-xs">
                            x{submission.quest.multiplier}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusColor(submission.status)}
                        className="capitalize flex items-center space-x-1"
                      >
                        {getStatusIcon(submission.status)}
                        <span>{submission.status}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {submission.status === 'approved' && canSelectWinner(submission) && (
                          <>
                            {winnerSubmissions.has(submission.id) ? (
                              <div className="flex items-center gap-1">
                                <Badge variant="default" className="bg-purple-100 text-purple-700 border-purple-200">
                                  <Crown className="h-3 w-3 mr-1" />
                                  Winner
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditWinnerFromSubmission(submission)}
                                  disabled={isUpdatingWinnerFromSubmission}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  title="Edit Winner Data"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSelectWinner(submission)}
                                disabled={isCreatingWinner}
                                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                title="Select as Winner"
                              >
                                <Crown className="h-4 w-4" />
                              </Button>
                            )}
                          </>
                        )}
                        {submission.status === 'pending' && canReviewSubmission(submission) && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReview(submission, "approved")}
                              disabled={isReviewing}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReview(submission, "rejected")}
                              disabled={isReviewing}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setReviewingSubmission(submission)
                                setReviewNotes(submission.review_notes || "")
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </SheetTrigger>
                          <SheetContent className="w-[400px] sm:w-[540px]">
                            <SheetHeader>
                              <SheetTitle>Review Submission</SheetTitle>
                              <SheetDescription>
                                Review the submission details and provide feedback
                              </SheetDescription>
                            </SheetHeader>
                            {reviewingSubmission && (
                              <div className="space-y-6 mt-6">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium">User Address</Label>
                                    <p className="font-mono text-sm mt-1 break-all">
                                      {reviewingSubmission.user_address}
                                    </p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Quest</Label>
                                    <p className="text-sm mt-1 font-medium">
                                      {reviewingSubmission.quest.title}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium">Category</Label>
                                    <p className="text-sm mt-1">
                                      {reviewingSubmission.quest.category?.name || 'Unknown'}
                                    </p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">XP Reward</Label>
                                    <p className="text-sm mt-1 font-medium">
                                      {reviewingSubmission.quest.xp_reward} XP
                                      {reviewingSubmission.quest.multiplier > 1 && (
                                        <span className="text-muted-foreground ml-1">
                                          (x{reviewingSubmission.quest.multiplier})
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                </div>

                                <div>
                                  <Label className="text-sm font-medium">Quest Description</Label>
                                  <p className="text-sm mt-1 text-muted-foreground">
                                    {reviewingSubmission.quest.description}
                                  </p>
                                </div>

                                <div>
                                  <Label className="text-sm font-medium">Proof URL</Label>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <Input value={reviewingSubmission.proof_url} readOnly />
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      asChild
                                    >
                                      <a
                                        href={reviewingSubmission.proof_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <ExternalLink className="h-3 w-3" />
                                      </a>
                                    </Button>
                                  </div>
                                </div>

                                {reviewingSubmission.proof_data && renderProofData(reviewingSubmission.proof_data)}

                                <div>
                                  <Label className="text-sm font-medium">Review Notes</Label>
                                  <Textarea
                                    value={reviewNotes}
                                    onChange={(e) => setReviewNotes(e.target.value)}
                                    placeholder="Enter review notes..."
                                    className="w-full mt-1"
                                    rows={3}
                                  />
                                </div>

                                {reviewingSubmission.status !== 'pending' && (
                                  <div className="p-3 bg-muted rounded-lg">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <User className="h-4 w-4" />
                                      <span className="text-sm font-medium">Reviewed by</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {reviewingSubmission.reviewed_by || 'Unknown'}
                                    </p>
                                    {reviewingSubmission.reviewed_at && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {formatDate(reviewingSubmission.reviewed_at)}
                                      </p>
                                    )}
                                  </div>
                                )}

                                {reviewingSubmission.status === 'pending' && canReviewSubmission(reviewingSubmission) && (
                                  <div className="flex justify-end space-x-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => setReviewingSubmission(null)}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      onClick={() => handleReview(reviewingSubmission, "approved")}
                                      disabled={isReviewing}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <Check className="h-4 w-4 mr-2" />
                                      Approve
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      onClick={() => handleReview(reviewingSubmission, "rejected")}
                                      disabled={isReviewing}
                                    >
                                      <X className="h-4 w-4 mr-2" />
                                      Reject
                                    </Button>
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

      {/* Winner Selection Dialog */}
      {selectingWinner && (
        <Dialog open={!!selectingWinner} onOpenChange={() => setSelectingWinner(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-purple-600" />
                Select Winner
              </DialogTitle>
              <DialogDescription>
                Select this submission as a winner and configure the reward details
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Submission Info */}
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Submission Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">User Address</Label>
                    <p className="font-mono break-all">{selectingWinner.user_address}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Quest</Label>
                    <p className="font-medium">{selectingWinner.quest.title}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Submitted At</Label>
                    <p>{formatDate(selectingWinner.submitted_at)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">XP Reward</Label>
                    <p>{selectingWinner.quest.xp_reward * selectingWinner.quest.multiplier} XP</p>
                  </div>
                </div>
              </div>

              {/* Winner Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="display_name">Display Name (Optional)</Label>
                    <Input
                      id="display_name"
                      value={winnerForm.display_name}
                      onChange={(e) => setWinnerForm(prev => ({ ...prev, display_name: e.target.value }))}
                      placeholder="Winner's display name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="winning_token">Token</Label>
                    <div className="space-y-2">
                      <Select
                        value={useCustomToken ? "custom" : winnerForm.winning_token}
                        onValueChange={(value) => {
                          if (value === "custom") {
                            setUseCustomToken(true)
                          } else {
                            setUseCustomToken(false)
                            setWinnerForm(prev => ({ ...prev, winning_token: value }))
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALPH">ALPH</SelectItem>
                          <SelectItem value="USDT">USDT</SelectItem>
                          <SelectItem value="USDC">USDC</SelectItem>
                          <SelectItem value="BTC">BTC</SelectItem>
                          <SelectItem value="ETH">ETH</SelectItem>
                          <SelectItem value="BNB">BNB</SelectItem>
                          <SelectItem value="ADA">ADA</SelectItem>
                          <SelectItem value="SOL">SOL</SelectItem>
                          <SelectItem value="DOT">DOT</SelectItem>
                          <SelectItem value="MATIC">MATIC</SelectItem>
                          <SelectItem value="AVAX">AVAX</SelectItem>
                          <SelectItem value="LINK">LINK</SelectItem>
                          <SelectItem value="UNI">UNI</SelectItem>
                          <SelectItem value="custom">Custom Token</SelectItem>
                        </SelectContent>
                      </Select>
                      {useCustomToken && (
                        <div className="space-y-1">
                          <Input
                            placeholder="Enter custom token name (e.g., MYTOKEN)"
                            value={winnerForm.custom_token}
                            onChange={(e) => setWinnerForm(prev => ({ ...prev, custom_token: e.target.value.toUpperCase() }))}
                            className="mt-2"
                          />
                          <p className="text-xs text-muted-foreground">
                            Enter the token symbol or name (will be converted to uppercase)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="winning_amount">Winning Amount *</Label>
                    <Input
                      id="winning_amount"
                      type="number"
                      step="0.000001"
                      value={winnerForm.winning_amount}
                      onChange={(e) => setWinnerForm(prev => ({ ...prev, winning_amount: e.target.value }))}
                      placeholder="0.000000"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="approx_amount_usd">USD Value (Optional)</Label>
                    <Input
                      id="approx_amount_usd"
                      type="number"
                      step="0.01"
                      value={winnerForm.approx_amount_usd}
                      onChange={(e) => setWinnerForm(prev => ({ ...prev, approx_amount_usd: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="exchange_rate_usd">Exchange Rate USD (Optional)</Label>
                    <Input
                      id="exchange_rate_usd"
                      type="number"
                      step="0.000001"
                      value={winnerForm.exchange_rate_usd}
                      onChange={(e) => setWinnerForm(prev => ({ ...prev, exchange_rate_usd: e.target.value }))}
                      placeholder="0.000000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pricing_source">Pricing Source (Optional)</Label>
                    <Select
                      value={winnerForm.pricing_source}
                      onValueChange={(value) => setWinnerForm(prev => ({ ...prev, pricing_source: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="coingecko">CoinGecko</SelectItem>
                        <SelectItem value="coinmarketcap">CoinMarketCap</SelectItem>
                        <SelectItem value="binance">Binance</SelectItem>
                        <SelectItem value="manual">Manual Entry</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={winnerForm.status}
                    onValueChange={(value: 'pending' | 'approved' | 'claimable' | 'paid' | 'failed' | 'expired' | 'cancelled' | 'rejected' | 'revoked') => 
                      setWinnerForm(prev => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="claimable">Claimable</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="revoked">Revoked</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tx_hash">Transaction Hash (Optional)</Label>
                  <Input
                    id="tx_hash"
                    value={winnerForm.tx_hash}
                    onChange={(e) => setWinnerForm(prev => ({ ...prev, tx_hash: e.target.value }))}
                    placeholder="Transaction hash if already sent"
                  />
                </div>

                <div>
                  <Label htmlFor="proof_url">Proof URL</Label>
                  <Input
                    id="proof_url"
                    value={winnerForm.proof_url}
                    onChange={(e) => setWinnerForm(prev => ({ ...prev, proof_url: e.target.value }))}
                    placeholder="URL to proof or evidence"
                  />
                </div>

                <div>
                  <Label htmlFor="comments">Comments (Optional)</Label>
                  <Textarea
                    id="comments"
                    value={winnerForm.comments}
                    onChange={(e) => setWinnerForm(prev => ({ ...prev, comments: e.target.value }))}
                    placeholder="Additional notes or comments"
                    rows={3}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setSelectingWinner(null)}
                  disabled={isCreatingWinner}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateWinner}
                  disabled={isCreatingWinner || !winnerForm.winning_amount || (useCustomToken && !winnerForm.custom_token.trim())}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isCreatingWinner ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Creating Winner...
                    </>
                  ) : (
                    <>
                      <Crown className="h-4 w-4 mr-2" />
                      Select Winner
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Winner from Submission Dialog */}
      {editingWinnerFromSubmission && (
        <Dialog open={!!editingWinnerFromSubmission} onOpenChange={() => setEditingWinnerFromSubmission(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-blue-600" />
                Edit Winner Data
              </DialogTitle>
              <DialogDescription>
                Update winner details for this submission
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Submission Info */}
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Submission Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">User Address</Label>
                    <p className="font-mono break-all">{editingWinnerFromSubmission.submission.user_address}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Quest</Label>
                    <p className="font-medium">{editingWinnerFromSubmission.submission.quest.title}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Winner ID</Label>
                    <p className="font-mono text-xs">{editingWinnerFromSubmission.winner.winner_id}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Awarded At</Label>
                    <p>{formatDate(editingWinnerFromSubmission.winner.awarded_at)}</p>
                  </div>
                </div>
              </div>

              {/* Edit Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_sub_display_name">Display Name (Optional)</Label>
                    <Input
                      id="edit_sub_display_name"
                      value={editWinnerForm.display_name}
                      onChange={(e) => setEditWinnerForm(prev => ({ ...prev, display_name: e.target.value }))}
                      placeholder="Winner's display name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_sub_winning_token">Token</Label>
                    <div className="space-y-2">
                      <Select
                        value={useCustomTokenEdit ? "custom" : editWinnerForm.winning_token}
                        onValueChange={(value) => {
                          if (value === "custom") {
                            setUseCustomTokenEdit(true)
                          } else {
                            setUseCustomTokenEdit(false)
                            setEditWinnerForm(prev => ({ ...prev, winning_token: value }))
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALPH">ALPH</SelectItem>
                          <SelectItem value="USDT">USDT</SelectItem>
                          <SelectItem value="USDC">USDC</SelectItem>
                          <SelectItem value="BTC">BTC</SelectItem>
                          <SelectItem value="ETH">ETH</SelectItem>
                          <SelectItem value="BNB">BNB</SelectItem>
                          <SelectItem value="ADA">ADA</SelectItem>
                          <SelectItem value="SOL">SOL</SelectItem>
                          <SelectItem value="DOT">DOT</SelectItem>
                          <SelectItem value="MATIC">MATIC</SelectItem>
                          <SelectItem value="AVAX">AVAX</SelectItem>
                          <SelectItem value="LINK">LINK</SelectItem>
                          <SelectItem value="UNI">UNI</SelectItem>
                          <SelectItem value="custom">Custom Token</SelectItem>
                        </SelectContent>
                      </Select>
                      {useCustomTokenEdit && (
                        <div className="space-y-1">
                          <Input
                            placeholder="Enter custom token name (e.g., MYTOKEN)"
                            value={editWinnerForm.custom_token}
                            onChange={(e) => setEditWinnerForm(prev => ({ ...prev, custom_token: e.target.value.toUpperCase() }))}
                            className="mt-2"
                          />
                          <p className="text-xs text-muted-foreground">
                            Enter the token symbol or name (will be converted to uppercase)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_sub_winning_amount">Winning Amount *</Label>
                    <Input
                      id="edit_sub_winning_amount"
                      type="number"
                      step="0.000001"
                      value={editWinnerForm.winning_amount}
                      onChange={(e) => setEditWinnerForm(prev => ({ ...prev, winning_amount: e.target.value }))}
                      placeholder="0.000000"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_sub_approx_amount_usd">USD Value (Optional)</Label>
                    <Input
                      id="edit_sub_approx_amount_usd"
                      type="number"
                      step="0.01"
                      value={editWinnerForm.approx_amount_usd}
                      onChange={(e) => setEditWinnerForm(prev => ({ ...prev, approx_amount_usd: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_sub_exchange_rate_usd">Exchange Rate USD (Optional)</Label>
                    <Input
                      id="edit_sub_exchange_rate_usd"
                      type="number"
                      step="0.000001"
                      value={editWinnerForm.exchange_rate_usd}
                      onChange={(e) => setEditWinnerForm(prev => ({ ...prev, exchange_rate_usd: e.target.value }))}
                      placeholder="0.000000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_sub_pricing_source">Pricing Source (Optional)</Label>
                    <Select
                      value={editWinnerForm.pricing_source}
                      onValueChange={(value) => setEditWinnerForm(prev => ({ ...prev, pricing_source: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="coingecko">CoinGecko</SelectItem>
                        <SelectItem value="coinmarketcap">CoinMarketCap</SelectItem>
                        <SelectItem value="binance">Binance</SelectItem>
                        <SelectItem value="manual">Manual Entry</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit_sub_status">Status</Label>
                  <Select
                    value={editWinnerForm.status}
                    onValueChange={(value: 'pending' | 'approved' | 'claimable' | 'paid' | 'failed' | 'expired' | 'cancelled' | 'rejected' | 'revoked') => {
                      console.log('Status changed to:', value)
                      setEditWinnerForm(prev => ({ ...prev, status: value }))
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="claimable">Claimable</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="revoked">Revoked</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="edit_sub_tx_hash">Transaction Hash (Optional)</Label>
                  <Input
                    id="edit_sub_tx_hash"
                    value={editWinnerForm.tx_hash}
                    onChange={(e) => setEditWinnerForm(prev => ({ ...prev, tx_hash: e.target.value }))}
                    placeholder="Transaction hash if already sent"
                  />
                </div>

                <div>
                  <Label htmlFor="edit_sub_proof_url">Proof URL</Label>
                  <Input
                    id="edit_sub_proof_url"
                    value={editWinnerForm.proof_url}
                    onChange={(e) => setEditWinnerForm(prev => ({ ...prev, proof_url: e.target.value }))}
                    placeholder="URL to proof or evidence"
                  />
                </div>

                <div>
                  <Label htmlFor="edit_sub_comments">Comments (Optional)</Label>
                  <Textarea
                    id="edit_sub_comments"
                    value={editWinnerForm.comments}
                    onChange={(e) => setEditWinnerForm(prev => ({ ...prev, comments: e.target.value }))}
                    placeholder="Additional notes or comments"
                    rows={3}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setEditingWinnerFromSubmission(null)}
                  disabled={isUpdatingWinnerFromSubmission}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateWinnerFromSubmission}
                  disabled={isUpdatingWinnerFromSubmission || !editWinnerForm.winning_amount || (useCustomTokenEdit && !editWinnerForm.custom_token.trim())}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isUpdatingWinnerFromSubmission ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Updating Winner...
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Update Winner
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* XP Verification Results Modal */}
      {xpVerificationModal && xpVerificationResults && (
        <Dialog open={xpVerificationModal} onOpenChange={setXpVerificationModal}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>XP Verification Results</DialogTitle>
              <DialogDescription>
                Summary of XP discrepancies found and potential repairs.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Summary</h3>
                <Badge variant="outline" className="text-xs">
                  Total Discrepancies: {xpVerificationResults.totalDiscrepancies}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Found {xpVerificationResults.totalDiscrepancies} users with XP discrepancies.
                Total XP difference: {xpVerificationResults.totalXPDiscrepancy}.
              </p>

              <h3 className="text-lg font-semibold">Detailed Discrepancies</h3>
              {xpVerificationResults.discrepancies.length === 0 ? (
                <p className="text-muted-foreground">No XP discrepancies found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-40">User Address</TableHead>
                        <TableHead className="w-20">Current XP</TableHead>
                        <TableHead className="w-20">Expected XP</TableHead>
                        <TableHead className="w-20">Difference</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {xpVerificationResults.discrepancies.map((discrepancy, index) => (
                        <TableRow key={index}>
                          <TableCell>{discrepancy.address}</TableCell>
                          <TableCell>{discrepancy.currentXP}</TableCell>
                          <TableCell>{discrepancy.expectedXP}</TableCell>
                          <TableCell className={`font-mono ${discrepancy.difference > 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {discrepancy.difference}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <h3 className="text-lg font-semibold">Repair Options</h3>
              <p className="text-sm text-muted-foreground">
                Click "Repair XP" to attempt to fix these discrepancies.
                This will update the admin_total_xp for all users with discrepancies.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={repairXPDiscrepancies}
                  disabled={isRepairing}
                >
                  <Star className="h-4 w-4 mr-2" />
                  Repair XP
                </Button>
                <Button
                  variant="outline"
                  onClick={rollbackLastRepair}
                  disabled={isRepairing || repairHistory.length === 0}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Rollback
                </Button>
              </div>

              <h3 className="text-lg font-semibold">Repair History</h3>
              {repairHistory.length === 0 ? (
                <p className="text-muted-foreground">No XP repairs have been performed yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-32">Timestamp</TableHead>
                        <TableHead className="w-16">Action</TableHead>
                        <TableHead className="w-40">Details</TableHead>
                        <TableHead className="w-40">Changes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {repairHistory.map((record, index) => (
                        <TableRow key={index}>
                          <TableCell>{formatDate(record.timestamp)}</TableCell>
                          <TableCell>{record.action}</TableCell>
                          <TableCell>{record.details}</TableCell>
                          <TableCell>
                            <div className="flex flex-col space-y-1">
                              {record.changes.map((change, subIndex) => (
                                <div key={subIndex} className="text-xs text-muted-foreground">
                                  {change.address}: {change.oldXP} → {change.newXP} (Difference: {change.difference})
                                </div>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
