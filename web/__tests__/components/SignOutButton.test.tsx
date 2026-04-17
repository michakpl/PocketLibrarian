import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SignOutButton from '@/components/SignOutButton'
import { useRouter } from 'next/navigation'
import {AppRouterInstance} from "next/dist/shared/lib/app-router-context.shared-runtime";

const mockReplace = vi.fn()
vi.mocked(useRouter).mockReturnValue({
  replace: mockReplace,
  push: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  refresh: vi.fn(),
} as unknown as AppRouterInstance)

describe('SignOutButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn().mockResolvedValue({ ok: true })
  })

  it('renders a sign-out button', () => {
    render(<SignOutButton />)
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })

  it('calls DELETE /api/auth/session and redirects to /auth on click', async () => {
    render(<SignOutButton />)
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/session', { method: 'DELETE' })
      expect(mockReplace).toHaveBeenCalledWith('/auth')
    })
  })
})
