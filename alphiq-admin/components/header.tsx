"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useAuth } from "@/components/auth-provider"
import { LogOut, Settings, User, Database } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

export function Header() {
  const { user, profile, logout } = useAuth()
  const router = useRouter()

  if (!user) return null

  const environment = process.env.NODE_ENV === "production" ? "Production" : "Development"
  const environmentColor = environment === "Production" ? "destructive" : "secondary"

  return (
    <header className="flex h-16 items-center justify-between border-b border-white/10 bg-background/95 backdrop-blur-sm px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="text-muted-foreground hover:text-primary" />
        <Badge variant={environmentColor} className="font-medium">
          <Database className="h-3 w-3 mr-1" />
          {environment}
        </Badge>
      </div>

      <div className="flex items-center gap-4">
        {profile?.role && (
          <Badge variant="outline" className="capitalize bg-primary/10 text-primary border-primary/30">
            {profile.role.replace("-", " ")}
          </Badge>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-10 w-10 rounded-full ring-2 ring-primary/20 hover:ring-primary/40 transition-all"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={"/placeholder.svg"} alt={profile?.full_name || user.email || "User"} />
                <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                  {profile?.full_name
                    ? profile.full_name.split(" ").map((n: string) => n[0]).join("")
                    : user.email
                      ? user.email[0].toUpperCase()
                      : "A"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 glass-card" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-2">
                <p className="text-sm font-semibold leading-none">{profile?.full_name || user.email}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                {profile?.role && (
                  <Badge variant="outline" className="w-fit text-xs">
                    {profile.role.replace("-", " ")}
                  </Badge>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem className="hover:bg-primary/10 hover:text-primary">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-primary/10 hover:text-primary">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              onClick={async () => {
                await logout()
                router.push("/admin/login")
              }}
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
