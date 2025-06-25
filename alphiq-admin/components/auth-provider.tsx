"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"

type UserRole = "super-admin" | "moderator" | "viewer"

interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  hasPermission: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const ROLE_PERMISSIONS = {
  "super-admin": ["*"],
  moderator: ["quests.manage", "submissions.review", "users.view"],
  viewer: ["dashboard.view", "quests.view", "users.view"],
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Mock authentication - in real app, check for valid session
    const mockUser: User = {
      id: "1",
      email: "admin@alphiq.com",
      name: "Admin User",
      role: "super-admin",
      avatar: "/placeholder.svg?height=32&width=32",
    }
    setUser(mockUser)
  }, [])

  const login = async (email: string, password: string) => {
    // Mock login - in real app, authenticate with OAuth2 + 2FA
    const mockUser: User = {
      id: "1",
      email,
      name: "Admin User",
      role: "super-admin",
    }
    setUser(mockUser)
  }

  const logout = () => {
    setUser(null)
  }

  const hasPermission = (permission: string) => {
    if (!user) return false
    const userPermissions = ROLE_PERMISSIONS[user.role] || []
    return userPermissions.includes("*") || userPermissions.includes(permission)
  }

  return <AuthContext.Provider value={{ user, login, logout, hasPermission }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
