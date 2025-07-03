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
    <form onSubmit={handle} className="max-w-sm mx-auto space-y-4 p-6 bg-card rounded">
      <h2 className="text-2xl font-bold">Admin Sign In</h2>
      {error && <div className="text-red-400 flex items-center"><AlertTriangle className="mr-1"/> {error}</div>}
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email" type="email" required
          value={email} onChange={e=>setEmail(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="pass">Password</Label>
        <Input
          id="pass" type="password" required
          value={pass} onChange={e=>setPass(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Signing in…' : 'Sign in'}
      </Button>
      <Button
        variant="link"
        onClick={() => window.location.href = '/admin/forgot-password'}
        className="text-sm"
      >
        Forgot password?
      </Button>
      <div className="pt-4 text-center text-sm">
        Don't have an account? <a href="/admin/register" className="text-amber">Register</a>
      </div>
    </form>
  )
}
