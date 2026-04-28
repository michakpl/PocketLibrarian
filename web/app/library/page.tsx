import {BookOpen, ChevronLeft, ChevronRight, Plus} from 'lucide-react'
import {getBooks} from "@/lib/api/books";
import {UnauthorizedError} from "@/lib/api/errors";
import {getSession} from "@/lib/session";
import {redirect} from "next/navigation";
import Link from "next/link";
import Book from "@/components/Book";

interface Props {
    searchParams: Promise<{ page?: string; pageSize?: string }>
}

export default async function LibraryPage({searchParams}: Props) {
    const session = await getSession()
    if (!session) redirect('/auth')

    const {page: pageParam, pageSize: pageSizeParam} = await searchParams
    const parsedPageParam = Number(pageParam ?? 1)
    const page = Number.isFinite(parsedPageParam) ? Math.max(1, parsedPageParam) : 1
    const parsedPageSizeParam = Number(pageSizeParam ?? 20)
    const pageSize = Number.isFinite(parsedPageSizeParam) ? Math.max(1, parsedPageSizeParam) : 20

    let result
    try {
        result = await getBooks(session.accessToken, {page, pageSize})
    } catch (err) {
        if (err instanceof UnauthorizedError) {
            redirect('/auth/refresh?callbackUrl=/library')
        }
        throw err
    }

    const {items: books, totalCount, hasNextPage, hasPreviousPage, totalPages} = result

    return (
        <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-slate-900 text-2xl">Books</h1>
                    <p className="text-slate-500 text-sm mt-0.5">{totalCount} books in your library</p>
                </div>
                <Link
                    href="/library/books/add"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Book
                </Link>
            </div>

            {totalCount > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {books.map((book) => (
                            <Book key={book.id} book={book}/>
                        ))}
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                        <p className="text-sm text-slate-500">
                            {totalCount} book{totalCount !== 1 ? 's' : ''} total
                            {totalPages ? ` · page ${page} of ${totalPages}` : ''}
                        </p>
                        <div className="flex items-center gap-2">
                            <Link
                                href={hasPreviousPage ? `/library?page=${page - 1}&pageSize=${pageSize}` : '#'}
                                aria-disabled={!hasPreviousPage}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                                    hasPreviousPage
                                        ? 'border-slate-200 text-slate-700 hover:bg-slate-50'
                                        : 'border-slate-100 text-slate-300 pointer-events-none'
                                }`}
                            >
                                <ChevronLeft className="w-4 h-4"/> Previous
                            </Link>
                            <Link
                                href={hasNextPage ? `/library?page=${page + 1}&pageSize=${pageSize}` : '#'}
                                aria-disabled={!hasNextPage}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                                    hasNextPage
                                        ? 'border-slate-200 text-slate-700 hover:bg-slate-50'
                                        : 'border-slate-100 text-slate-300 pointer-events-none'
                                }`}
                            >
                                Next <ChevronRight className="w-4 h-4"/>
                            </Link>
                        </div>
                    </div>
                </>
            ) : (
                <div className="text-center py-16 text-slate-400">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30"/>
                    <p className="text-sm">No books found</p>
                </div>
            )}
        </div>
    )
}
