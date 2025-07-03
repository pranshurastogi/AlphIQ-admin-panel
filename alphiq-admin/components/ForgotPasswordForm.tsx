// components/ForgotPasswordForm.tsx
'use client'
import { useState } from 'react'
import { useAuth } from './auth-provider'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { AlertTriangle } from 'lucide-react'

export function ForgotPasswordForm() {
  const { resetPassword, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string|null>(null)
  const [error, setError] = useState<string|null>(null)

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    try {
      await resetPassword(email)
      setMessage('✅ Check your inbox for reset instructions.')
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <form onSubmit={handle} className="max-w-sm mx-auto space-y-4 p-6 bg-card rounded">
      <h2 className="text-2xl font-bold">Reset Password</h2>
      {error   && <div className="text-red-400"><AlertTriangle /> {error}</div>}
      {message && <div className="text-green-400">{message}</div>}
      <div>
        <Label>Email</Label>
        <Input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/>
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Sending…' : 'Send reset link'}
      </Button>
      <div className="pt-4 text-center text-sm">
        Remembered? <a href="/admin/login" className="text-amber">Go back to login</a>
      </div>
    </form>
  )
}
