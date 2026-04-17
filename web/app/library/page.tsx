import { getSession } from '@/lib/session'
import { getBooks } from '@/lib/api/books'
import SignOutButton from '@/components/SignOutButton'
import { BookOpen, Library } from 'lucide-react'

export default async function LibraryPage() {
  const session = await getSession()
  if (!session) {
    return
  }

  const books = await getBooks(session.accessToken)
  console.log('books:', books)

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-blue-950 to-slate-900">
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-500">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-semibold">PocketLibrarian</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 text-sm hidden sm:block">{session.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-white text-3xl font-semibold mb-1">
            Welcome back, {session.name.split(' ')[0]}
          </h1>
          <p className="text-slate-400">Your personal book collection</p>
        </div>

        <div className="rounded-2xl bg-white/5 border border-white/10 p-12 text-center">
          <Library className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h2 className="text-white text-xl font-medium mb-2">Your library is empty</h2>
          <p className="text-slate-400 text-sm">
            Start adding books to build your collection.
          </p>
        </div>
      </main>
    </div>
  )
}
