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
      <div className="max-w-sm mx-auto p-6 bg-card rounded text-center">
        <h2 className="text-xl font-semibold">Registration received!</h2>
        <p>You’ll receive an email once your account is approved.</p>
        <Button onClick={()=>window.location.href='/admin/login'}>Back to login</Button>
      </div>
    )
  }

  return (
    <form onSubmit={handle} className="max-w-sm mx-auto space-y-4 p-6 bg-card rounded">
      <h2 className="text-2xl font-bold">Admin Sign Up</h2>
      {error && <div className="text-red-400 flex items-center"><AlertTriangle className="mr-1"/> {error}</div>}
      <div>
        <Label>Full Name</Label>
        <Input value={fullName} onChange={e=>setFullName(e.target.value)} required/>
      </div>
      <div>
        <Label>Email</Label>
        <Input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/>
      </div>
      <div>
        <Label>Password</Label>
        <Input type="password" value={pass} onChange={e=>setPass(e.target.value)} required/>
      </div>
      <div>
        <Label>Confirm Password</Label>
        <Input type="password" value={confirmPass} onChange={e=>setConfirmPass(e.target.value)} required/>
      </div>
      <div>
        <Label>Role</Label>
        <select
          className="w-full p-2 bg-input border rounded"
          value={role}
          onChange={e => setRole(e.target.value as any)}
          required
        >
          <option value="sub_admin">Sub-Admin</option>
          <option value="moderator">Moderator</option>
          <option value="viewer">Viewer</option>
        </select>
      </div>
      <div>
        <Label>Partner / Org Name</Label>
        <Input value={partnerName} onChange={e=>setPartnerName(e.target.value)} required/>
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Registering…' : 'Register'}
      </Button>
      <div className="pt-4 text-center text-sm">
        Already have an account? <a href="/admin/login" className="text-amber">Login</a>
      </div>
    </form>
  )
}
