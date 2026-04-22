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
      className="w-full flex items-center gap-3 px-3 py-2.5 mt-1 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors duration-150"
    >
      <LogOut className="w-4 h-4 shrink-0" />
      Sign out
    </button>
  )
}
