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
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={handle} className="w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden animate-in fade-in-0 slide-in-from-bottom-4 duration-700" style={{boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)'}}>
          <div className="p-6 sm:p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-2 text-white drop-shadow-lg">
                Admin Sign In
              </h2>
              <p className="text-gray-200 text-sm sm:text-base">
                Welcome back! Please sign in to your account
              </p>
            </div>
            
            {error && (
              <div className="text-red-300 flex items-center mb-6 text-sm sm:text-base bg-red-500/20 border border-red-400/30 rounded-xl p-4 animate-in slide-in-from-top-2 duration-300 backdrop-blur-sm">
                <AlertTriangle className="mr-2 w-4 h-4 flex-shrink-0"/> 
                {error}
              </div>
            )}
            
            <div className="space-y-6">
              <div className="animate-in slide-in-from-left-4 duration-500 delay-100">
                <Label htmlFor="email" className="text-sm sm:text-base text-gray-100 font-medium">Email</Label>
                <Input
                  id="email" 
                  type="email" 
                  required
                  value={email} 
                  onChange={e=>setEmail(e.target.value)}
                  className="mt-2 py-3 text-base bg-white/10 border-white/20 text-white placeholder:text-gray-300 transition-all duration-300 focus:bg-white/15 focus:border-white/30"
                  style={{'--tw-ring-color': '#FF8A65'} as React.CSSProperties}
                  placeholder="Enter your email"
                />
              </div>
              
              <div className="animate-in slide-in-from-left-4 duration-500 delay-200">
                <Label htmlFor="pass" className="text-sm sm:text-base text-gray-100 font-medium">Password</Label>
                <Input
                  id="pass" 
                  type="password" 
                  required
                  value={pass} 
                  onChange={e=>setPass(e.target.value)}
                  className="mt-2 py-3 text-base bg-white/10 border-white/20 text-white placeholder:text-gray-300 transition-all duration-300 focus:bg-white/15 focus:border-white/30"
                  style={{'--tw-ring-color': '#FF8A65'} as React.CSSProperties}
                  placeholder="Enter your password"
                />
              </div>
            </div>
            
            <div className="mt-8 space-y-4">
              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full text-lg py-3 text-white border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 animate-in slide-in-from-bottom-4 duration-500 delay-300"
                style={{background: 'linear-gradient(135deg, #FF8A65, #FF7043)'}}
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
              
              <Button
                type="button"
                variant="link"
                onClick={() => window.location.href = '/admin/forgot-password'}
                className="text-sm w-full text-gray-200 transition-colors duration-200 animate-in slide-in-from-bottom-4 duration-500 delay-400 hover:text-white"
              >
                Forgot password?
              </Button>
              
              <div className="pt-4 text-center text-sm sm:text-base animate-in slide-in-from-bottom-4 duration-500 delay-500">
                <span className="text-gray-200">Don't have an account? </span>
                <a 
                  href="/admin/register" 
                  className="font-semibold underline transition-colors duration-200"
                  style={{color: '#FF8A65'}}
                >
                  Register
                </a>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
