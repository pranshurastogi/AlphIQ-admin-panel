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
          <CardTitle>All Submissions</CardTitle>
          <CardDescription>
            Review quest submissions and manage approvals
          </CardDescription>
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
