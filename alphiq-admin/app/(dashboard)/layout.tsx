// app/(dashboard)/layout.tsx
'use client'

import React from 'react'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { Header } from '@/components/header'
import { useAuth } from '@/components/auth-provider'
import { LoginForm } from '@/components/login-form'
import { Loader2 } from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, profile, loading } = useAuth()

  // 1) Still figuring out auth state?
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 text-amber animate-spin" />
      </div>
    )
  }

  // 2) Not logged in / not approved yet
  if (!user || !profile) {
    return <LoginForm />
  }

  // 3) Awaiting super_admin approval
  if (!profile.approved) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <p className="text-neutral/70">
          Your admin account is pending approval. Please check back later.
        </p>
      </div>
    )
  }

  // 4) All good — show the dashboard
  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6 bg-background">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
