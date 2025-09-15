"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  BarChart3,
  FolderOpen,
  Target,
  FileCheck,
  Users,
  TrendingUp,
  FileText,
  Zap,
  Settings,
  Shield,
  LogOut,
  Trophy,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Badge } from "@/components/ui/badge"

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: BarChart3,
    permission: "dashboard.view",
  },
  {
    title: "Quest Categories",
    url: "/categories",
    icon: FolderOpen,
    permission: "quests.manage",
  },
  {
    title: "Quests",
    url: "/quests",
    icon: Target,
    permission: "quests.manage",
  },
  {
    title: "Submissions",
    url: "/submissions",
    icon: FileCheck,
    permission: "submissions.review",
  },
  {
    title: "Winners",
    url: "/winners",
    icon: Trophy,
    permission: "winners.view",
  },
  {
    title: "Users & XP",
    url: "/users",
    icon: Users,
    permission: "users.view",
  },
  {
    title: "XP Levels",
    url: "/levels",
    icon: TrendingUp,
    permission: "quests.manage",
  },
  {
    title: "Audit Logs",
    url: "/audit",
    icon: FileText,
    permission: "*",
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { hasPermission, user, logout } = useAuth()
  const router = useRouter()

  const visibleItems = menuItems.filter(
    (item) => hasPermission(item.permission) || item.permission === "dashboard.view",
  )

  const handleLogout = async () => {
    await logout()
    router.push("/admin/login")
  }

  return (
    <Sidebar variant="inset" className="border-r border-white/10">
      <SidebarHeader className="border-b border-white/10">
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="p-2 bg-primary rounded-xl shadow-lg">
            <Zap className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-heading font-bold text-primary">AlphIQ</h2>
            <p className="text-sm text-muted-foreground">Admin Console</p>
          </div>
        </div>
        <div className="px-4 pb-2">
          {user?.role ? (
            <Badge variant="outline" className="bg-accent/20 text-accent border-accent/30">
              <Shield className="h-3 w-3 mr-1" />
              {user.role.replace("-", " ").toUpperCase()}
            </Badge>
          ) : null}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground font-medium">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    className={`
                      nav-item-hover transition-all duration-200
                      ${pathname === item.url ? "nav-item-active" : ""}
                    `}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-white/10">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="nav-item-hover">
              <Link href="/settings">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="nav-item-hover text-destructive hover:bg-destructive/10 hover:text-destructive">
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
