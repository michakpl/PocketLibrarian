'use client'

import { Suspense, useEffect, useRef } from 'react'
import { useMsal } from '@azure/msal-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { loginRequest } from '@/lib/msal-config'
import { Loader2 } from 'lucide-react'

function RefreshLoader() {
  const { instance, accounts } = useMsal()
  const router = useRouter()
  const searchParams = useSearchParams()
  const raw = searchParams.get('callbackUrl') ?? '/library'
  const callbackUrl = raw.startsWith('/auth/refresh') ? '/library' : raw
  const attempted = useRef(false)

  useEffect(() => {
    if (attempted.current) return
    attempted.current = true

    const account = accounts[0]

    if (!account) {
      router.replace(`/auth`)
      return
    }

    instance
      .acquireTokenSilent({ ...loginRequest, account })
      .then(async (result) => {
        const csrfResponse = await fetch('/api/auth/session')
        const {csrfToken} = await csrfResponse.json() as {csrfToken: string}

        const response = await fetch('/api/auth/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': csrfToken,
          },
          body: JSON.stringify({
            idToken: result.idToken,
            accessToken: result.accessToken,
            accessTokenExpiresAt: Math.floor(
              (result.expiresOn?.getTime() ?? Date.now() + 3_600_000) / 1000,
            ),
          }),
        })

        if (!response.ok) {
          router.replace('/auth')
          return
        }

        router.replace(callbackUrl)
      })
      .catch(() => {
        router.replace('/auth')
      })
  }, [accounts, callbackUrl, instance, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="flex flex-col items-center gap-4 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-sm">Refreshing your session…</p>
      </div>
    </div>
  )
}

export default function RefreshPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
          <div className="flex flex-col items-center gap-4 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm">Refreshing your session…</p>
          </div>
        </div>
      }
    >
      <RefreshLoader />
    </Suspense>
  )
}

