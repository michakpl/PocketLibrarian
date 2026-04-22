'use client'

import {BookDto} from "@/lib/types/book";
import {useState} from "react";
import {Barcode, BookOpen, MapPin, Pencil, Trash2} from "lucide-react";
import Link from "next/link";

export default function Book({book}: { book: BookDto }) {
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    function handleDelete(id: string) {
        console.log('Delete book', id)
    }

    return <div
        key={book.id}
        className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow group"
    >
        <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                <BookOpen className="w-5 h-5 text-blue-500"/>
            </div>
            <div className="min-w-0 flex-1">
                <h3 className="text-slate-900 text-sm leading-snug line-clamp-2">{book.title}</h3>
                <p className="text-slate-500 text-xs mt-0.5">{book.author}</p>
            </div>
        </div>

        <div className="flex flex-col gap-1.5 mt-auto">
            <div className="flex items-center gap-2 text-xs text-slate-500">
                <Barcode className="w-3.5 h-3.5 shrink-0 text-slate-400"/>
                <span className="font-mono">{book.isbn13 ?? '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400"/>
                <span className="truncate" title={book.locationPath?.join(' › ')}>
                      {book.locationPath?.join(' › ')}
                    </span>
            </div>
        </div>

        <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
            <Link
                href={`/library/books/${book.id}/edit`}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors px-2 py-1 rounded hover:bg-blue-50"
            >
                <Pencil className="w-3.5 h-3.5"/>
                Edit
            </Link>

            {deleteConfirm === book.id ? (
                <div className="flex items-center gap-2 ml-auto">
                    <span className="text-xs text-slate-500">Delete?</span>
                    <button
                        onClick={() => handleDelete(book.id)}
                        className="text-xs text-red-600 hover:text-red-700 font-medium"
                    >
                        Yes
                    </button>
                    <button
                        onClick={() => setDeleteConfirm(null)}
                        className="text-xs text-slate-400 hover:text-slate-600"
                    >
                        No
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => setDeleteConfirm(book.id)}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50 ml-auto"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                </button>
            )}
        </div>
    </div>
}