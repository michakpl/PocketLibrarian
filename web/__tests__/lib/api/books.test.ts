import {describe, it, expect, vi, beforeEach} from 'vitest'
import {getBook, getBooks} from '@/lib/api/books'
import {UnauthorizedError} from '@/lib/api/errors'

const MOCK_BOOK = {
    id: 'a0000000-0000-4000-8000-000000000001',
    ownerId: 'a0000000-0000-4000-8000-000000000002',
    title: 'Clean Code',
    author: 'Robert C. Martin',
    isbn13: '978-0-13-235088-4',
    isbn10: '0-13-235088-2',
    location: null,
    locationPath: null,
}

const MOCK_PAGED = {
    items: [MOCK_BOOK],
    page: 1,
    pageSize: 20,
    totalCount: 1,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
}

beforeEach(() => {
    vi.stubEnv('API_URL', 'http://api.test')
})

describe('getBooks', () => {
    it('returns paged result on 200', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => MOCK_PAGED,
        })

        const result = await getBooks('token', {page: 1, pageSize: 20})
        expect(result.items).toHaveLength(1)
        expect(result.items[0].title).toBe('Clean Code')
        expect(result.totalCount).toBe(1)
    })

    it('appends page and pageSize query params', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => MOCK_PAGED,
        })

        await getBooks('token', {page: 3, pageSize: 10})

        const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
        expect(calledUrl).toContain('page=3')
        expect(calledUrl).toContain('pageSize=10')
    })

    it('throws UnauthorizedError on 401', async () => {
        global.fetch = vi.fn().mockResolvedValue({ok: false, status: 401})
        await expect(getBooks('bad-token')).rejects.toBeInstanceOf(UnauthorizedError)
    })

    it('throws generic Error on other non-ok status', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
        })
        await expect(getBooks('token')).rejects.toThrow('Failed to fetch books')
    })

    it('throws if API_URL is not set', async () => {
        vi.stubEnv('API_URL', '')
        await expect(getBooks('token')).rejects.toThrow('API_URL')
    })
})

describe('getBook', () => {
    it('returns a single book on 200', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => MOCK_BOOK,
        })

        const result = await getBook('token', 'a0000000-0000-4000-8000-000000000001')
        expect(result.id).toBe('a0000000-0000-4000-8000-000000000001')
        expect(result.title).toBe('Clean Code')
    })

    it('calls the correct URL with bookId', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => MOCK_BOOK,
        })

        const bookId = 'a0000000-0000-4000-8000-000000000001'
        await getBook('token', bookId)
        const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
        expect(calledUrl).toContain(`/api/books/${bookId}`)
    })

    it('throws UnauthorizedError on 401', async () => {
        global.fetch = vi.fn().mockResolvedValue({ok: false, status: 401})
        await expect(getBook('bad-token', 'book-1')).rejects.toBeInstanceOf(UnauthorizedError)
    })

    it('throws generic Error on non-ok status', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 404,
            statusText: 'Not Found',
        })
        await expect(getBook('token', 'missing')).rejects.toThrow('Failed to fetch book with ID missing')
    })
})
