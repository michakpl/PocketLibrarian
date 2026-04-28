'use client'

import React from 'react'
import { Library, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { SessionPayload } from '@/lib/session'
import SignOutButton from "@/components/SignOutButton";

export default function Sidebar({
  session,
  open,
  onOpenChangeAction,
}: {
  session: SessionPayload | null
  open: boolean
  onOpenChangeAction: (open: boolean) => void
}) {
  const pathname = usePathname()
  const sidebarOpen = open
  const setSidebarOpen = onOpenChangeAction

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 h-screen w-64 bg-slate-900 z-30 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:sticky lg:z-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700/50">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
            <Library className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-semibold">PocketLibrarian</span>
          <button
            className="ml-auto lg:hidden text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <Link
            href="/library"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-150
              ${pathname === '/library' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            Library
          </Link>
          <Link
            href="/library/locations"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-150
              ${pathname === '/library/locations' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            Locations
          </Link>
        </nav>

        <div className="px-3 py-4 border-t border-slate-700/50">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-semibold">
                {session?.name.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm truncate">{session?.name}</p>
              <p className="text-slate-400 text-xs truncate">{session?.email}</p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>
    </>
  )
}
