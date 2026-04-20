import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SignOutButton from '@/components/SignOutButton'
import { useRouter } from 'next/navigation'
import { createRouterMock } from '@/__tests__/helpers/routerMock'

const mockReplace = vi.fn()

vi.mocked(useRouter).mockReturnValue(createRouterMock({ replace: mockReplace }))

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
