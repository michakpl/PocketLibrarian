import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import {IMsalContext, useMsal} from '@azure/msal-react'
import AuthPage from '@/app/auth/page'
import {AppRouterInstance} from "next/dist/shared/lib/app-router-context.shared-runtime";

vi.mock('@azure/msal-react', () => ({
  useMsal: vi.fn(),
}))

const mockLoginRedirect = vi.fn()
const mockHandleRedirectPromise = vi.fn()
const mockReplace = vi.fn()

vi.mocked(useRouter).mockReturnValue({
  replace: mockReplace,
  push: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  refresh: vi.fn(),
} as unknown as AppRouterInstance)

function setupMsal(inProgress: string) {
  vi.mocked(useMsal).mockReturnValue({
    instance: {
      loginRedirect: mockLoginRedirect,
      handleRedirectPromise: mockHandleRedirectPromise,
    },
    inProgress,
    accounts: [],
  } as unknown as IMsalContext)
}

describe('AuthPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('renders the sign-in button in idle state', () => {
    setupMsal('none')
    render(<AuthPage />)
    expect(screen.getByRole('button', { name: /continue with microsoft/i })).toBeEnabled()
  })

  it('shows a loading state while MSAL is processing', () => {
    setupMsal('login')
    render(<AuthPage />)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    expect(btn).toHaveTextContent(/signing in/i)
  })

  it('calls loginRedirect when the button is clicked', async () => {
    setupMsal('none')
    mockLoginRedirect.mockResolvedValue(undefined)
    render(<AuthPage />)

    fireEvent.click(screen.getByRole('button', { name: /continue with microsoft/i }))

    await waitFor(() => {
      expect(mockLoginRedirect).toHaveBeenCalledOnce()
    })
  })

  it('shows an error message if loginRedirect throws', async () => {
    setupMsal('none')
    mockLoginRedirect.mockRejectedValue(new Error('popup_blocked'))
    render(<AuthPage />)

    fireEvent.click(screen.getByRole('button', { name: /continue with microsoft/i }))

    await waitFor(() => {
      expect(screen.getByText(/failed to initiate sign-in/i)).toBeInTheDocument()
    })
  })

  it('POSTs session data and redirects to /library after successful redirect', async () => {
    setupMsal('handleRedirect')
    mockHandleRedirectPromise.mockResolvedValue({
      account: {
        localAccountId: 'u1',
        name: 'Alice',
        username: 'alice@example.com',
      },
      accessToken: 'msal-access-token',
    })
    vi.mocked(global.fetch).mockResolvedValue({ ok: true } as Response)

    render(<AuthPage />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/session',
        expect.objectContaining({ method: 'POST' }),
      )
      expect(mockReplace).toHaveBeenCalledWith('/library')
    })
  })

  it('shows an error message when the session API call fails', async () => {
    setupMsal('handleRedirect')
    mockHandleRedirectPromise.mockResolvedValue({
      account: { localAccountId: 'u1', name: 'Alice', username: 'alice@example.com' },
      accessToken: 'tok',
    })
    vi.mocked(global.fetch).mockResolvedValue({ ok: false } as Response)

    render(<AuthPage />)

    await waitFor(() => {
      expect(screen.getByText(/failed to create session/i)).toBeInTheDocument()
    })
  })

  it('shows an error message when handleRedirectPromise throws', async () => {
    setupMsal('handleRedirect')
    mockHandleRedirectPromise.mockRejectedValue(new Error('network error'))

    render(<AuthPage />)

    await waitFor(() => {
      expect(screen.getByText(/authentication failed/i)).toBeInTheDocument()
    })
  })
})
