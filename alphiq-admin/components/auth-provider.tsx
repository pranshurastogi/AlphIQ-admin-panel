// components/auth-provider.tsx
'use client'
import React, {
  createContext,
  useContext,
  useEffect,
  useState
} from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { User, Session } from '@supabase/supabase-js'

export type AdminProfile = {
  id: string       // auth.users.id
  full_name: string
  role: 'super_admin' | 'sub_admin' | 'moderator' | 'viewer'
  approved: boolean
  partner_id: string
  partner_name: string
}

// The shape we expose
interface AuthContextValue {
  user: User | null
  profile: AdminProfile | null
  session: Session | null
  loading: boolean
  login: (email: string, pass: string) => Promise<void>
  register: (
    email: string,
    pass: string,
    full_name: string,
    role: 'sub_admin'|'moderator'|'viewer',
    partner_name: string
  ) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  hasPermission: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<User|null>(null)
  const [profile, setProfile] = useState<AdminProfile|null>(null)
  const [session, setSession] = useState<Session|null>(null)
  const [loading, setLoading] = useState(true)
  const [profileCache, setProfileCache] = useState<Record<string, AdminProfile>>({})

  // On mount: check existing session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      // Only set loading to false if we don't have a user (no profile to fetch)
      if (!session?.user) {
        setLoading(false)
      }
    })

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession)
        setUser(newSession?.user ?? null)
        // Set loading to false when user logs out
        if (!newSession?.user) {
          setLoading(false)
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  // Whenever user changes, re-fetch admin profile
  useEffect(() => {
    if (!user) {
      setProfile(null)
      return
    }
    
    // Check if we have a cached profile for this user
    if (profileCache[user.id]) {
      setProfile(profileCache[user.id])
      setLoading(false)
      return
    }
    
    // Only set loading to true if we don't have a profile yet
    if (!profile) {
      setLoading(true)
    }
    
    supabase
      .from('admin_user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('fetch profile error', error)
          setProfile(null)
        } else {
          setProfile(data)
          // Cache the profile
          setProfileCache(prev => ({ ...prev, [user.id]: data }))
        }
        setLoading(false)
      })
  }, [user, profileCache])

  // ------ Actions ------

  const login = async (email: string, password: string) => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) throw error
  }

  const register = async (
    email: string,
    password: string,
    full_name: string,
    role: 'sub_admin'|'moderator'|'viewer',
    partner_name: string
  ) => {
    setLoading(true)
    // 1) Signup with Supabase Auth
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password
    })
    const newUser = data?.user
    if (signUpError || !newUser) {
      setLoading(false)
      throw signUpError
    }
    // 2) Create admin profile (awaiting approval)
    const { error: profileErr } = await supabase
      .from('admin_user_profiles')
      .insert({
        id:            newUser.id,
        full_name,
        role,
        partner_name,          // partner_id will default to random
        approved:     false
      })
    setLoading(false)
    if (profileErr) throw profileErr
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setProfileCache({}) // Clear cache on logout
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) throw error
  }

  // Permission logic
  const rolePermissions: Record<string, string[]> = {
    super_admin: ['*'],
    sub_admin: ['dashboard.view', 'quests.manage', 'users.view', 'submissions.review'],
    moderator: ['dashboard.view', 'submissions.review'],
    viewer: ['dashboard.view'],
  }
  const hasPermission = (permission: string) => {
    if (!profile) return false
    const allowed = rolePermissions[profile.role] || []
    return allowed.includes('*') || allowed.includes(permission)
  }

  return (
    <AuthContext.Provider
      value={{
        user, profile, session, loading,
        login, register, logout, resetPassword,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Hook
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
