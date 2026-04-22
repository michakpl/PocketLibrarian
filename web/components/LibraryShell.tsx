'use client'

import React, { useState } from 'react'
import { Library, Menu } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import type { SessionPayload } from '@/lib/session'

export default function LibraryShell({
  session,
  children,
}: {
  session: SessionPayload | null
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar session={session} open={sidebarOpen} onOpenChangeAction={setSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center gap-3 px-4 py-4 bg-white border-b border-slate-300">
          <button
            className="text-slate-600 hover:text-slate-900"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-500 flex items-center justify-center">
              <Library className="w-3 h-3 text-white" />
            </div>
            <span className="text-slate-800 font-semibold text-sm">PocketLibrarian</span>
          </div>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
