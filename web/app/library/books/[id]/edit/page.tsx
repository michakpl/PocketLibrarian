import Link from 'next/link'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { getBook } from '@/lib/api/books'
import { getLocations } from '@/lib/api/locations'
import { getSession } from '@/lib/session'
import EditBookForm from "@/components/BookForm";

export default async function EditBook({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session) return null

  const [book, locations] = await Promise.all([
    getBook(session.accessToken, id),
    getLocations(session.accessToken),
  ])

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/library"
          className="text-slate-500 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-blue-500" />
          </div>
          <h1 className="text-slate-900 text-xl">{book.title} — Edit Book</h1>
        </div>
      </div>

      <EditBookForm book={book} locations={locations} />
    </div>
  )
}