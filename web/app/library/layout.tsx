import {redirect} from 'next/navigation'
import {getSession} from '@/lib/session'
import LibraryShell from '@/components/LibraryShell'

export default async function LibraryLayout({
                                                children,
                                            }: {
    children: React.ReactNode
}) {
    const session = await getSession()

    if (!session) {
        redirect('/auth')
    }

    return (
        <LibraryShell session={session}>
            {children}
        </LibraryShell>
    )
}
