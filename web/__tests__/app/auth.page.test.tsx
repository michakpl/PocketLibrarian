import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import {IMsalContext, useMsal} from '@azure/msal-react'
import AuthPage from '@/app/auth/page'

vi.mock('@azure/msal-react', () => ({
  useMsal: vi.fn(),
}))

const mockLoginRedirect = vi.fn()
const mockHandleRedirectPromise = vi.fn()
const mockReplace = vi.fn()

interface AppRouterInstanceMock {
  replace: typeof mockReplace;
  push: (path: string) => void;
  prefetch: (path: string) => void;
  back: () => void;
  refresh: () => void;
  forward: () => void;
}

vi.mocked(useRouter).mockReturnValue({
  replace: mockReplace,
  push: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  refresh: vi.fn(),
} as unknown as AppRouterInstanceMock)

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

/** Builds a fetch mock that returns csrfToken on GET, then the given response on POST. */
function mockFetchCsrfThenPost(postOk: boolean) {
  return vi.fn()
    .mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ csrfToken: 'mock-csrf-token' }),
    } as unknown as Response)
    .mockResolvedValueOnce({ ok: postOk } as Response)
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

  it('fetches CSRF token then POSTs idToken + accessToken and redirects to /library', async () => {
    setupMsal('handleRedirect')
    mockHandleRedirectPromise.mockResolvedValue({
      account: {
        localAccountId: 'u1',
        name: 'Alice',
        username: 'alice@example.com',
      },
      idToken: 'msal-id-token',
      accessToken: 'msal-access-token',
      expiresOn: new Date(Date.now() + 3_600_000),
    })
    global.fetch = mockFetchCsrfThenPost(true)

    render(<AuthPage />)

    await waitFor(() => {
      // First call: GET to obtain the CSRF token
      expect(global.fetch).toHaveBeenNthCalledWith(1, '/api/auth/session')

      // Second call: POST with idToken, accessToken, and x-csrf-token header
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        '/api/auth/session',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'x-csrf-token': 'mock-csrf-token',
          }),
          body: expect.stringContaining('"idToken":"msal-id-token"'),
        }),
      )

      expect(mockReplace).toHaveBeenCalledWith('/library')
    })
  })

  it('POST body does not contain userId, name or email', async () => {
    setupMsal('handleRedirect')
    mockHandleRedirectPromise.mockResolvedValue({
      account: { localAccountId: 'u1', name: 'Alice', username: 'alice@example.com' },
      idToken: 'msal-id-token',
      accessToken: 'tok',
      expiresOn: new Date(Date.now() + 3_600_000),
    })
    global.fetch = mockFetchCsrfThenPost(true)

    render(<AuthPage />)

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/library'))

    const postCall = vi.mocked(global.fetch).mock.calls[1]
    const postedBody = JSON.parse(postCall[1]?.body as string)
    expect(postedBody).not.toHaveProperty('userId')
    expect(postedBody).not.toHaveProperty('name')
    expect(postedBody).not.toHaveProperty('email')
  })

  it('shows an error message when the session API POST fails', async () => {
    setupMsal('handleRedirect')
    mockHandleRedirectPromise.mockResolvedValue({
      account: { localAccountId: 'u1', name: 'Alice', username: 'alice@example.com' },
      idToken: 'msal-id-token',
      accessToken: 'tok',
      expiresOn: new Date(Date.now() + 3_600_000),
    })
    global.fetch = mockFetchCsrfThenPost(false)

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
