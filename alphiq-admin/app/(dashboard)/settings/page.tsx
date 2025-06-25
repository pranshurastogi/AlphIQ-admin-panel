"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Settings, Mail, Shield } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"

interface AdminUser {
  id: string
  email: string
  name: string
  role: "super-admin" | "moderator" | "viewer"
  createdAt: string
  lastLogin: string
  status: "active" | "inactive"
}

const mockAdminUsers: AdminUser[] = [
  {
    id: "1",
    email: "admin@alphiq.com",
    name: "Super Admin",
    role: "super-admin",
    createdAt: "2024-01-01",
    lastLogin: "2024-01-25",
    status: "active",
  },
  {
    id: "2",
    email: "moderator@alphiq.com",
    name: "Content Moderator",
    role: "moderator",
    createdAt: "2024-01-15",
    lastLogin: "2024-01-24",
    status: "active",
  },
  {
    id: "3",
    email: "viewer@alphiq.com",
    name: "Analytics Viewer",
    role: "viewer",
    createdAt: "2024-02-01",
    lastLogin: "2024-01-20",
    status: "active",
  },
]

export default function SettingsPage() {
  const { hasPermission } = useAuth()
  const { toast } = useToast()
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(mockAdminUsers)
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [newUser, setNewUser] = useState({
    email: "",
    name: "",
    role: "viewer" as AdminUser["role"],
  })

  const [systemSettings, setSystemSettings] = useState({
    defaultXpMultiplier: 1.0,
    maxSubmissionsPerDay: 10,
    autoApprovalEnabled: false,
    emailNotificationsEnabled: true,
    maintenanceMode: false,
    registrationEnabled: true,
  })

  const [emailTemplates, setEmailTemplates] = useState({
    welcomeSubject: "Welcome to AlphIQ!",
    welcomeBody: "Welcome to the AlphIQ community! Start completing quests to earn XP.",
    approvalSubject: "Quest Submission Approved",
    approvalBody: "Congratulations! Your quest submission has been approved and XP has been awarded.",
    rejectionSubject: "Quest Submission Needs Review",
    rejectionBody: "Your quest submission requires additional information. Please review and resubmit.",
  })

  const handleAddUser = () => {
    if (!newUser.email || !newUser.name) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    const user: AdminUser = {
      id: Date.now().toString(),
      ...newUser,
      createdAt: new Date().toISOString().split("T")[0],
      lastLogin: "Never",
      status: "active",
    }

    setAdminUsers([...adminUsers, user])
    setNewUser({ email: "", name: "", role: "viewer" })
    setIsAddUserOpen(false)

    toast({
      title: "User Added",
      description: `${newUser.name} has been added as ${newUser.role}.`,
    })
  }

  const handleRemoveUser = (userId: string) => {
    setAdminUsers(adminUsers.filter((user) => user.id !== userId))
    toast({
      title: "User Removed",
      description: "Admin user has been removed from the system.",
    })
  }

  const handleSystemSettingChange = (key: keyof typeof systemSettings, value: any) => {
    setSystemSettings((prev) => ({ ...prev, [key]: value }))
    toast({
      title: "Setting Updated",
      description: `${key} has been updated successfully.`,
    })
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "super-admin":
        return "bg-accent/20 text-accent border-accent/30"
      case "moderator":
        return "bg-primary/20 text-primary border-primary/30"
      case "viewer":
        return "bg-secondary/20 text-secondary-foreground border-secondary/30"
      default:
        return "bg-secondary/20 text-secondary-foreground border-secondary/30"
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold text-primary">Settings</h1>
        <p className="text-muted-foreground">System configuration and administrative controls</p>
      </div>

      {/* Admin Users Management */}
      {hasPermission("*") && (
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-heading text-primary flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Admin Users
                </CardTitle>
                <CardDescription>Manage administrative access and permissions</CardDescription>
              </div>
              <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Admin
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-card border-white/10">
                  <DialogHeader>
                    <DialogTitle className="text-primary">Add Admin User</DialogTitle>
                    <DialogDescription>Create a new administrative account</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        className="bg-white/5 border-white/10"
                        placeholder="admin@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        className="bg-white/5 border-white/10"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={newUser.role}
                        onValueChange={(value: AdminUser["role"]) => setNewUser({ ...newUser, role: value })}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="glass-card border-white/10">
                          <SelectItem value="viewer">Viewer</SelectItem>
                          <SelectItem value="moderator">Moderator</SelectItem>
                          <SelectItem value="super-admin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddUser}>Add User</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminUsers.map((user) => (
                  <TableRow key={user.id} className="border-white/10 hover:bg-white/5">
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getRoleColor(user.role)}>
                        {user.role.replace("-", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-sm">
                      {user.lastLogin === "Never" ? "Never" : new Date(user.lastLogin).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === "active" ? "default" : "secondary"}>{user.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveUser(user.id)}
                        className="hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* System Configuration */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-xl font-heading text-primary flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Configuration
          </CardTitle>
          <CardDescription>Core system settings and defaults</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="xp-multiplier">Default XP Multiplier</Label>
              <Input
                id="xp-multiplier"
                type="number"
                step="0.1"
                value={systemSettings.defaultXpMultiplier}
                onChange={(e) => handleSystemSettingChange("defaultXpMultiplier", Number.parseFloat(e.target.value))}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-submissions">Max Submissions Per Day</Label>
              <Input
                id="max-submissions"
                type="number"
                value={systemSettings.maxSubmissionsPerDay}
                onChange={(e) => handleSystemSettingChange("maxSubmissionsPerDay", Number.parseInt(e.target.value))}
                className="bg-white/5 border-white/10"
              />
            </div>
          </div>

          <Separator className="bg-white/10" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-Approval</Label>
                <p className="text-sm text-muted-foreground">Automatically approve submissions that meet criteria</p>
              </div>
              <Switch
                checked={systemSettings.autoApprovalEnabled}
                onCheckedChange={(checked) => handleSystemSettingChange("autoApprovalEnabled", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Send email notifications for important events</p>
              </div>
              <Switch
                checked={systemSettings.emailNotificationsEnabled}
                onCheckedChange={(checked) => handleSystemSettingChange("emailNotificationsEnabled", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>User Registration</Label>
                <p className="text-sm text-muted-foreground">Allow new users to register accounts</p>
              </div>
              <Switch
                checked={systemSettings.registrationEnabled}
                onCheckedChange={(checked) => handleSystemSettingChange("registrationEnabled", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">Temporarily disable the system for maintenance</p>
              </div>
              <Switch
                checked={systemSettings.maintenanceMode}
                onCheckedChange={(checked) => handleSystemSettingChange("maintenanceMode", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Templates */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-xl font-heading text-primary flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Templates
          </CardTitle>
          <CardDescription>Customize automated email communications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="welcome-subject">Welcome Email Subject</Label>
              <Input
                id="welcome-subject"
                value={emailTemplates.welcomeSubject}
                onChange={(e) => setEmailTemplates({ ...emailTemplates, welcomeSubject: e.target.value })}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div>
              <Label htmlFor="welcome-body">Welcome Email Body</Label>
              <Textarea
                id="welcome-body"
                value={emailTemplates.welcomeBody}
                onChange={(e) => setEmailTemplates({ ...emailTemplates, welcomeBody: e.target.value })}
                className="bg-white/5 border-white/10"
                rows={3}
              />
            </div>
          </div>

          <Separator className="bg-white/10" />

          <div className="space-y-4">
            <div>
              <Label htmlFor="approval-subject">Approval Email Subject</Label>
              <Input
                id="approval-subject"
                value={emailTemplates.approvalSubject}
                onChange={(e) => setEmailTemplates({ ...emailTemplates, approvalSubject: e.target.value })}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div>
              <Label htmlFor="approval-body">Approval Email Body</Label>
              <Textarea
                id="approval-body"
                value={emailTemplates.approvalBody}
                onChange={(e) => setEmailTemplates({ ...emailTemplates, approvalBody: e.target.value })}
                className="bg-white/5 border-white/10"
                rows={3}
              />
            </div>
          </div>

          <Separator className="bg-white/10" />

          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-subject">Rejection Email Subject</Label>
              <Input
                id="rejection-subject"
                value={emailTemplates.rejectionSubject}
                onChange={(e) => setEmailTemplates({ ...emailTemplates, rejectionSubject: e.target.value })}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div>
              <Label htmlFor="rejection-body">Rejection Email Body</Label>
              <Textarea
                id="rejection-body"
                value={emailTemplates.rejectionBody}
                onChange={(e) => setEmailTemplates({ ...emailTemplates, rejectionBody: e.target.value })}
                className="bg-white/5 border-white/10"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => toast({ title: "Templates Saved", description: "Email templates have been updated." })}
              className="bg-primary hover:bg-primary/90"
            >
              Save Templates
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
