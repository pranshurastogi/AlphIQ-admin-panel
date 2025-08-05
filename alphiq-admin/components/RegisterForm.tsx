// components/RegisterForm.tsx
'use client'
import { useState } from 'react'
import { useAuth } from './auth-provider'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { AlertTriangle } from 'lucide-react'

export function RegisterForm() {
  const { register, loading } = useAuth()
  const [email,       setEmail]       = useState('')
  const [pass,        setPass]        = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [fullName,    setFullName]    = useState('')
  const [role,        setRole]        = useState<'sub_admin'|'moderator'|'viewer'>('viewer')
  const [partnerName, setPartnerName] = useState('')
  const [error,       setError]       = useState<string|null>(null)
  const [success,     setSuccess]     = useState(false)

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (pass !== confirmPass) {
      setError("Passwords don't match")
      return
    }
    try {
      await register(email, pass, fullName, role, partnerName)
      setSuccess(true)
    } catch (e: any) {
      setError(e.message)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <div className="max-w-2xl !max-w-2xl w-full grid grid-cols-1 md:grid-cols-2 !bg-card !rounded-2xl !shadow-2xl !border !border-amber-200 overflow-hidden" style={{backgroundColor: 'rgba(24,24,27,0.95)'}}>
          {/* Side accent/illustration for desktop */}
          <div className="hidden md:flex items-center justify-center bg-gradient-to-br from-amber-100 to-amber-200">
            <img src="/placeholder-logo.svg" alt="Logo" className="w-24 h-24" />
          </div>
          <div className="flex flex-col justify-center p-10 text-center">
            <h2 className="text-3xl font-bold mb-2 text-amber">Registration received!</h2>
            <p className="mb-6 text-lg text-gray-300">Thank you for signing up. You'll receive an email once your account is approved.<br/>Please check your inbox for further instructions.</p>
            <Button onClick={()=>window.location.href='/admin/login'} className="mt-2 w-full text-lg py-3">Back to login</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handle} className="min-h-screen flex items-center justify-center relative">
      <div className="max-w-2xl !max-w-2xl w-full grid grid-cols-1 md:grid-cols-2 !bg-card !rounded-2xl !shadow-2xl !border !border-amber-200 overflow-hidden" style={{backgroundColor: 'rgba(24,24,27,0.95)'}}>
        {/* Side accent/illustration for desktop */}
        <div className="hidden md:flex items-center justify-center bg-gradient-to-br from-amber-100 to-amber-200">
          <img src="/placeholder-logo.svg" alt="Logo" className="w-24 h-24" />
        </div>
        <div className="flex flex-col justify-center p-10">
          <h2 className="text-4xl font-extrabold mb-8 text-center text-amber drop-shadow">Admin Sign Up</h2>
          {error && <div className="text-red-400 flex items-center mb-6 text-base"><AlertTriangle className="mr-2"/> {error}</div>}
          <div className="mb-6">
            <Label className="text-base">Full Name</Label>
            <Input value={fullName} onChange={e=>setFullName(e.target.value)} required className="mt-2 py-3 text-base"/>
          </div>
          <div className="mb-6">
            <Label className="text-base">Email</Label>
            <Input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="mt-2 py-3 text-base"/>
          </div>
          <div className="mb-6">
            <Label className="text-base">Password</Label>
            <Input type="password" value={pass} onChange={e=>setPass(e.target.value)} required className="mt-2 py-3 text-base"/>
          </div>
          <div className="mb-6">
            <Label className="text-base">Confirm Password</Label>
            <Input type="password" value={confirmPass} onChange={e=>setConfirmPass(e.target.value)} required className="mt-2 py-3 text-base"/>
          </div>
          <div className="mb-6">
            <Label className="text-base">Role</Label>
            <select
              className="w-full p-3 bg-input border rounded mt-2 text-base"
              value={role}
              onChange={e => setRole(e.target.value as any)}
              required
            >
              <option value="sub_admin">Sub-Admin</option>
              <option value="moderator">Moderator</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <div className="mb-8">
            <Label className="text-base">Partner / Org Name</Label>
            <Input value={partnerName} onChange={e=>setPartnerName(e.target.value)} required className="mt-2 py-3 text-base"/>
          </div>
          <Button type="submit" disabled={loading} className="w-full text-lg py-3 mb-4 shadow-md">
            {loading ? 'Registering…' : 'Register'}
          </Button>
          <div className="pt-4 text-center text-base">
            Already have an account? <a href="/admin/login" className="text-amber font-semibold underline">Login</a>
          </div>
        </div>
      </div>
    </form>
  )
}
