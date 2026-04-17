'use client'

import { BookOpen, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useMsal } from '@azure/msal-react'
import { useRouter } from 'next/navigation'
import { loginRequest } from '@/lib/msal-config'

export default function AuthPage() {
  const { instance, inProgress } = useMsal()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (inProgress !== 'handleRedirect') return

    instance
      .handleRedirectPromise()
      .then(async (result) => {
        if (!result) return

        const account = result.account
        const response = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: account.localAccountId,
            name: account.name ?? account.username,
            email: account.username,
            accessToken: result.accessToken,
          }),
        })

        if (!response.ok) {
          setError('Failed to create session. Please try again.')
          setLoading(false)
          return
        }

        router.replace('/library')
      })
      .catch((err) => {
        console.error('MSAL redirect error:', err)
        setError('Authentication failed. Please try again.')
        setLoading(false)
      })
  }, [inProgress, instance, router])

  const handleMicrosoftLogin = async () => {
    setLoading(true)
    setError(null)
    try {
      await instance.loginRedirect(loginRequest)
    } catch (err) {
      console.error('Login error:', err)
      setError('Failed to initiate sign-in. Please try again.')
      setLoading(false)
    }
  }

  const isProcessing = loading || inProgress !== 'none'

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500 mb-4 shadow-lg">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-white text-3xl mb-1">PocketLibrarian</h1>
          <p className="text-slate-400 text-sm">Organize your personal book collection</p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-white text-xl mb-2">Welcome back</h2>
          <p className="text-slate-400 text-sm mb-8">
            Sign in with your Microsoft account to access your library.
          </p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleMicrosoftLogin}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-800 rounded-xl px-6 py-3.5 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-600" />
            ) : (
              <MicrosoftIcon />
            )}
            <span className="font-medium text-sm">
              {isProcessing ? 'Signing in...' : 'Continue with Microsoft'}
            </span>
          </button>

          <p className="text-center text-slate-500 text-xs mt-6">
            New users will be registered automatically on first sign-in.
          </p>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          PocketLibrarian • Personal Collection Manager
        </p>
      </div>
    </div>
  )
}

function MicrosoftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  )
}
