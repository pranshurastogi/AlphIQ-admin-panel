// components/LoginForm.tsx
'use client'
import { useState } from 'react'
import { useAuth } from './auth-provider'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function LoginForm() {
  const { login, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [pass,  setPass]  = useState('')
  const [error, setError] = useState<string|null>(null)
  const router = useRouter()

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await login(email, pass)
      router.push('/dashboard')
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <form onSubmit={handle} className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-8 bg-card rounded-xl shadow-lg border border-amber-200">
        <h2 className="text-3xl font-extrabold mb-6 text-center text-amber">Admin Sign In</h2>
        {error && <div className="text-red-400 flex items-center mb-4"><AlertTriangle className="mr-1"/> {error}</div>}
        <div className="mb-4">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email" type="email" required
            value={email} onChange={e=>setEmail(e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="mb-6">
          <Label htmlFor="pass">Password</Label>
          <Input
            id="pass" type="password" required
            value={pass} onChange={e=>setPass(e.target.value)}
            className="mt-1"
          />
        </div>
        <Button type="submit" disabled={loading} className="w-full text-lg py-3 mb-2">
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
        <Button
          variant="link"
          onClick={() => window.location.href = '/admin/forgot-password'}
          className="text-sm w-full mb-2"
        >
          Forgot password?
        </Button>
        <div className="pt-4 text-center text-sm">
          Don't have an account? <a href="/admin/register" className="text-amber font-semibold">Register</a>
        </div>
      </div>
    </form>
  )
}
