'use client'

import {Barcode, ChevronDown, ChevronRight, MapPin, Pencil, Trash2} from "lucide-react";
import {LocationDto} from "@/lib/types/location";
import {useState} from "react";

export default function LocationNode({location}: { location: LocationDto }) {
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(false);

    function onEdit(id: string) {
        console.log('Edit location', id)
    }

    const hasChildren = false;
    const depth = 0;

    function onDelete(id: string) {
        console.log('Delete location', id)
    }

    return (
        <div>
            <div
                className={`group flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:shadow-sm transition-shadow mb-2 ${
                    depth > 0 ? "ml-6 border-l-2 border-l-blue-200" : ""
                }`}
            >
                {hasChildren && (<button
                    className="mt-0.5 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                    onClick={() => setExpanded(!expanded)}
                >
                    {expanded ? (
                        <ChevronDown className="w-4 h-4"/>
                    ) : (
                        <ChevronRight className="w-4 h-4"/>
                    )}
                </button>)}

                {/* Icon */}
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-blue-500"/>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                            <h3 className="text-slate-900 text-sm">{location.name}</h3>
                            {location.description && (
                                <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">{location.description}</p>
                            )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                                2 books
                            </span>
                            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                                2 sub-locations
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 mt-2">
                        <Barcode className="w-3.5 h-3.5 text-slate-400"/>
                        <span className="text-xs font-mono text-slate-500">{location.code}</span>
                    </div>

                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100">
                        <button
                            onClick={() => onEdit(location.id)}
                            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors px-2 py-1 rounded hover:bg-blue-50"
                        >
                            <Pencil className="w-3.5 h-3.5"/>
                            Edit
                        </button>
                        {deleteConfirm === location.id ? (
                            <div className="flex items-center gap-2 ml-auto">
                                <span
                                    className="text-xs text-slate-500">Delete location{hasChildren ? " & sub-locations" : ""}?</span>
                                <button
                                    onClick={() => onDelete(location.id)}
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
                                onClick={() => setDeleteConfirm(location.id)}
                                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50 ml-auto"
                            >
                                <Trash2 className="w-3.5 h-3.5"/>
                                Delete
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}