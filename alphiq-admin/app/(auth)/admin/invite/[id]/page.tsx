'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function InvitePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = React.use(params)
  const searchParams = useSearchParams()
  const code = searchParams.get('code') || id

  const [valid, setValid] = useState<boolean|null>(null)
  const [email, setEmail] = useState('')
  const [pw, setPw]       = useState('')
  const [showPw, setShowPw] = useState(false)
  const [name, setName]   = useState('')
  const [err, setErr]     = useState<string|null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  // 1) Validate invite code
  useEffect(() => {
    if (!code) {
      setValid(false)
      return
    }
    supabase
      .from('admin_invites')
      .select('invite_code,used')
      .eq('invite_code', code)
      .single()
      .then(({ data, error }) => {
        if (error || !data || data.used) return setValid(false)
        setValid(true)
      })
  }, [code])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErr(null)
    setLoading(true)
    try {
      // 2) create the auth user
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email, password: pw
      })
      if (signUpErr) {
        setErr(signUpErr.message)
        setLoading(false)
        return
      }
      if (!signUpData.user) {
        setErr('User was not created. Please try again or contact support.')
        setLoading(false)
        return
      }
      // 3) insert the profile as super_admin & mark invite used
      const { error: profErr } = await supabase
        .from('admin_user_profiles')
        .insert({
          id: signUpData.user.id,
          full_name: name,
          role: 'super_admin',
          partner_id: crypto.randomUUID(),
          partner_name: 'AlphIQ Core',
          approved: true
        })
      if (profErr) {
        setErr(profErr.message)
        setLoading(false)
        return
      }
      await supabase
        .from('admin_invites')
        .update({ used: true })
        .eq('invite_code', code)
      setSuccess(true)
      setLoading(false)
      setTimeout(() => router.push('/admin/login'), 2000)
    } catch (e: any) {
      setErr(e.message)
      setLoading(false)
    }
  }

  if (valid === null) return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-amber" />
      <span className="ml-2 text-lg">Checking invite…</span>
    </div>
  )
  if (!valid) return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="max-w-md w-full p-6 text-center">
        <CardHeader>
          <CardTitle>Invalid or Expired Invite</CardTitle>
          <CardDescription>
            This invite link is invalid or has already been used.<br/>
            Please contact your admin for a new invite.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="link">
            <Link href="/admin/login">Back to Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
  if (success) return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="max-w-md w-full p-6 text-center">
        <CardHeader>
          <CardTitle>Registration Complete!</CardTitle>
          <CardDescription>
            Your super-admin account has been created.<br/>
            Redirecting to login…
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber" />
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full p-6">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Super Admin Invitation</CardTitle>
          <CardDescription>
            Complete your registration to become a super admin for AlphIQ.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {err && <div className="text-red-500 text-center">{err}</div>}
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" type="text" value={name} onChange={e=>setName(e.target.value)} required autoFocus disabled={loading}/>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required disabled={loading}/>
            </div>
            <div>
              <Label htmlFor="pw">Password</Label>
              <div className="relative">
                <Input id="pw" type={showPw ? 'text' : 'password'} value={pw} onChange={e=>setPw(e.target.value)} required disabled={loading}/>
                <button type="button" tabIndex={-1} className="absolute right-2 top-2 text-gray-400" onClick={()=>setShowPw(v=>!v)}>
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Registering…</> : 'Complete Registration'}
            </Button>
            <div className="pt-2 text-center text-sm">
              Already registered? <Link href="/admin/login" className="text-amber">Login</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
