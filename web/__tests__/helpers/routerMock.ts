import { vi } from 'vitest'
import { useRouter } from 'next/navigation'

type AppRouterInstance = ReturnType<typeof useRouter>

export function createRouterMock(overrides?: Partial<AppRouterInstance>): AppRouterInstance {
  return {
    replace: vi.fn(),
    push: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
    forward: vi.fn(),
    ...overrides,
  } as unknown as AppRouterInstance
}

