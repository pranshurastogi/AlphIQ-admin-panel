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
    <form onSubmit={handle} className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-8 bg-card rounded-xl shadow-lg border border-amber-200">
        <h2 className="text-3xl font-extrabold mb-6 text-center text-amber">Reset Password</h2>
        {error   && <div className="text-red-400 flex items-center mb-4"><AlertTriangle className="mr-1" /> {error}</div>}
        {message && <div className="text-green-500 text-center mb-4">{message}</div>}
        <div className="mb-6">
          <Label>Email</Label>
          <Input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="mt-1"/>
        </div>
        <Button type="submit" disabled={loading} className="w-full text-lg py-3 mb-2">
          {loading ? 'Sending…' : 'Send reset link'}
        </Button>
        <div className="pt-4 text-center text-sm">
          Remembered? <a href="/admin/login" className="text-amber font-semibold">Go back to login</a>
        </div>
      </div>
    </form>
  )
}
