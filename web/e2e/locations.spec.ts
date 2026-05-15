import { test, expect } from '@playwright/test'
import { injectSession, clearSession, DEFAULT_USER } from './helpers/session'
import { registerHandler, resetHandlers } from './helpers/mock-client'
import { randomUUID } from 'crypto'

test.afterEach(async () => {
  await resetHandlers()
})

// ─── Data fixtures ────────────────────────────────────────────────────────────

const LOCATION_1 = {
  id: randomUUID(),
  ownerId: DEFAULT_USER.userId,
  name: 'Bookshelf A',
  description: 'Main shelf in the living room',
  code: 'BSA',
  parentId: null,
  locationPath: null,
}

const LOCATION_2 = {
  id: randomUUID(),
  ownerId: DEFAULT_USER.userId,
  name: 'Cabinet B',
  description: 'Storage cabinet',
  code: 'CB',
  parentId: null,
  locationPath: null,
}

const LOCATION_CHILD = {
  id: randomUUID(),
  ownerId: DEFAULT_USER.userId,
  name: 'Shelf B1',
  description: '',
  code: 'CB1',
  parentId: LOCATION_2.id,
  locationPath: ['Cabinet B', 'Shelf B1'],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function registerLocations(locations: object[] = []) {
  await registerHandler({ method: 'GET', path: '/api/locations', body: locations })
}

// ─── Unauthenticated guard ────────────────────────────────────────────────────

test.describe('locations — unauthenticated', () => {
  test.beforeEach(async ({ context }) => {
    await clearSession(context)
  })

  test('visiting /library/locations redirects to /auth', async ({ page }) => {
    await page.goto('/library/locations')
    await page.waitForURL('**/auth')
    expect(new URL(page.url()).pathname).toBe('/auth')
  })
})

// ─── Locations list ───────────────────────────────────────────────────────────

test.describe('locations list', () => {
  test.beforeEach(async ({ context }) => {
    await injectSession(context)
  })

  test('shows the Locations heading', async ({ page }) => {
    await registerLocations([LOCATION_1])
    await page.goto('/library/locations')
    await expect(page.getByRole('heading', { name: /locations/i })).toBeVisible()
  })

  test('shows the correct location count in the subtitle', async ({ page }) => {
    await registerLocations([LOCATION_1, LOCATION_2])
    await page.goto('/library/locations')
    await expect(page.getByText(/2 locations in your library/i)).toBeVisible()
  })

  test('shows zero count when there are no locations', async ({ page }) => {
    await registerLocations([])
    await page.goto('/library/locations')
    await expect(page.getByText(/0 locations in your library/i)).toBeVisible()
  })

  test('renders a card for each location', async ({ page }) => {
    await registerLocations([LOCATION_1, LOCATION_2])
    await page.goto('/library/locations')
    await expect(page.getByText('Bookshelf A')).toBeVisible()
    await expect(page.getByText('Cabinet B')).toBeVisible()
  })

  test('renders the location description', async ({ page }) => {
    await registerLocations([LOCATION_1])
    await page.goto('/library/locations')
    await expect(page.getByText('Main shelf in the living room')).toBeVisible()
  })

  test('renders the location code', async ({ page }) => {
    await registerLocations([LOCATION_1])
    await page.goto('/library/locations')
    await expect(page.getByText('BSA')).toBeVisible()
  })

  test('renders multiple locations including a child', async ({ page }) => {
    await registerLocations([LOCATION_2, LOCATION_CHILD])
    await page.goto('/library/locations')
    await expect(page.getByText('Cabinet B')).toBeVisible()
    await expect(page.getByText('Shelf B1')).toBeVisible()
  })
})

// ─── Add Location link ────────────────────────────────────────────────────────

test.describe('locations — Add Location link', () => {
  test.beforeEach(async ({ context }) => {
    await injectSession(context)
  })

  test('Add Location link is visible', async ({ page }) => {
    await registerLocations([])
    await page.goto('/library/locations')
    await expect(page.getByRole('link', { name: /add location/i })).toBeVisible()
  })

  test('Add Location link points to /library/locations/add', async ({ page }) => {
    await registerLocations([])
    await page.goto('/library/locations')
    const link = page.getByRole('link', { name: /add location/i })
    await expect(link).toHaveAttribute('href', '/library/locations/add')
  })
})

// ─── LocationNode interactions ────────────────────────────────────────────────

test.describe('locations — delete confirmation', () => {
  test.beforeEach(async ({ context }) => {
    await injectSession(context)
  })

  test('clicking Delete shows a confirmation prompt', async ({ page }) => {
    await registerLocations([LOCATION_1])
    await page.goto('/library/locations')
    await page.getByRole('button', { name: /delete/i }).first().click()
    await expect(page.getByRole('button', { name: /yes/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /no/i })).toBeVisible()
  })

  test('clicking No dismisses the confirmation', async ({ page }) => {
    await registerLocations([LOCATION_1])
    await page.goto('/library/locations')
    await page.getByRole('button', { name: /delete/i }).first().click()
    await page.getByRole('button', { name: /no/i }).click()
    await expect(page.getByRole('button', { name: /delete/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /yes/i })).not.toBeVisible()
  })

  test('Edit button is visible on a location card', async ({ page }) => {
    await registerLocations([LOCATION_1])
    await page.goto('/library/locations')
    await expect(page.getByRole('button', { name: /edit/i }).first()).toBeVisible()
  })
})

