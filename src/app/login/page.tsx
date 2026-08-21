'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'sign-in' | 'forgot-password'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const supabase = createClient()

      if (mode === 'forgot-password') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          email,
          { redirectTo: `${window.location.origin}/update-password` }
        )
        if (resetError) throw resetError
        setMessage(
          'If an account exists for that email, a password reset link has been sent.'
        )
        return
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (authError) throw authError

      router.push('/')
      router.refresh()
    } catch (authError) {
      setError(
        authError instanceof Error ? authError.message : 'Authentication failed.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Radya CRM
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === 'sign-in'
              ? 'Sign in to your account'
              : 'Request a password reset link'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-sm font-medium text-foreground"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@company.com"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
            />
          </div>

          {mode === 'sign-in' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-foreground"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot-password')
                    setError(null)
                    setMessage(null)
                  }}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
              />
            </div>
          )}

          {error !== null && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          {message !== null && (
            <p className="text-sm text-green-700 dark:text-green-400">{message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
          >
            {loading
              ? mode === 'sign-in'
                ? 'Signing in…'
                : 'Sending…'
              : mode === 'sign-in'
                ? 'Sign in'
                : 'Send reset link'}
          </button>

          {mode === 'forgot-password' && (
            <button
              type="button"
              onClick={() => {
                setMode('sign-in')
                setError(null)
                setMessage(null)
              }}
              className="w-full text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Back to sign in
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
