'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export default function SignOutButton() {
  const router = useRouter()

  const handleSignOut = async () => {
    await fetch('/api/auth/session', { method: 'DELETE' })
    router.replace('/auth')
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
    >
      <LogOut className="w-4 h-4" />
      Sign out
    </button>
  )
}
