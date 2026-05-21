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
    await expect(page.getByRole('link', { name: /edit/i }).first()).toBeVisible()
  })
})

// ─── Add Location page ────────────────────────────────────────────────────────

test.describe('add location — unauthenticated', () => {
  test.beforeEach(async ({ context }) => {
    await clearSession(context)
  })

  test('visiting /library/locations/add redirects to /auth', async ({ page }) => {
    await page.goto('/library/locations/add')
    await page.waitForURL('**/auth')
    expect(new URL(page.url()).pathname).toBe('/auth')
  })
})

test.describe('add location form', () => {
  test.beforeEach(async ({ context }) => {
    await injectSession(context)
  })

  test('renders the Add Location heading, form and submit button', async ({ page }) => {
    await registerLocations([])
    await page.goto('/library/locations/add')
    await expect(page.getByRole('heading', { name: /add location/i })).toBeVisible()
    await expect(page.getByPlaceholder(/e.g. living room/i)).toBeVisible()
    await expect(page.getByPlaceholder(/brief description/i)).toBeVisible()
    await expect(page.getByRole('combobox')).toBeVisible()
    await expect(page.getByRole('button', { name: /add location/i })).toBeVisible()
  })

  test('shows validation error when submitting without a name', async ({ page }) => {
    await registerLocations([])
    await page.goto('/library/locations/add')
    await page.getByRole('button', { name: /add location/i }).click()
    await expect(page.getByText(/name is required/i)).toBeVisible()
  })

  test('shows parent location options in the dropdown', async ({ page }) => {
    await registerLocations([LOCATION_1, LOCATION_2])
    await page.goto('/library/locations/add')
    await expect(page.getByRole('combobox')).toContainText('Bookshelf A')
    await expect(page.getByRole('combobox')).toContainText('Cabinet B')
  })

  test('Cancel link points to /library/locations', async ({ page }) => {
    await registerLocations([])
    await page.goto('/library/locations/add')
    await expect(page.getByRole('link', { name: /cancel/i })).toHaveAttribute(
      'href',
      '/library/locations'
    )
  })

  test('back arrow link points to /library/locations', async ({ page }) => {
    await registerLocations([])
    await page.goto('/library/locations/add')
    const backLink = page.locator('a[href="/library/locations"]').first()
    await expect(backLink).toBeVisible()
  })

  test('submits form and redirects to /library/locations on success', async ({ page }) => {
    await registerLocations([LOCATION_1])
    await registerHandler({
      method: 'POST',
      path: '/api/locations',
      status: 201,
      body: {
        id: randomUUID(),
        ownerId: DEFAULT_USER.userId,
        name: 'New Shelf',
        description: '',
        code: 'NS',
        parentId: null,
        locationPath: null,
      },
    })
    await registerLocations([LOCATION_1])
    await page.goto('/library/locations/add')
    await page.getByPlaceholder(/e.g. living room/i).fill('New Shelf')
    await page.getByRole('button', { name: /add location/i }).click()
    await page.waitForURL('**/library/locations')
    expect(new URL(page.url()).pathname).toBe('/library/locations')
  })

  test('shows server error message when API call fails', async ({ page }) => {
    await registerLocations([])
    await registerHandler({ method: 'POST', path: '/api/locations', status: 500, body: {} })
    await page.goto('/library/locations/add')
    await page.getByPlaceholder(/e.g. living room/i).fill('Bad Shelf')
    await page.getByRole('button', { name: /add location/i }).click()
    await expect(page.getByText(/failed to (add|create) location/i)).toBeVisible()
  })

  test('navigates to add location from the list page', async ({ page }) => {
    await registerLocations([])
    await page.goto('/library/locations')
    await page.getByRole('link', { name: /add location/i }).click()
    await page.waitForURL('**/library/locations/add')
    expect(new URL(page.url()).pathname).toBe('/library/locations/add')
  })
})

// ─── Edit Location page ───────────────────────────────────────────────────────

test.describe('edit location — unauthenticated', () => {
  test.beforeEach(async ({ context }) => {
    await clearSession(context)
  })

  test('visiting edit page redirects to /auth', async ({ page }) => {
    await page.goto(`/library/locations/${LOCATION_1.id}/edit`)
    await page.waitForURL('**/auth')
    expect(new URL(page.url()).pathname).toBe('/auth')
  })
})

test.describe('edit location form', () => {
  test.beforeEach(async ({ context }) => {
    await injectSession(context)
  })

  async function registerLocation(location: typeof LOCATION_1) {
    await registerHandler({
      method: 'GET',
      path: `/api/locations/${location.id}`,
      body: location,
    })
  }

  test('renders the location name in the heading, form and submit button', async ({ page }) => {
    await registerLocation(LOCATION_1)
    await registerLocations([LOCATION_1, LOCATION_2])
    await page.goto(`/library/locations/${LOCATION_1.id}/edit`)
    await expect(page.getByRole('heading', { name: /bookshelf a/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /edit location/i })).toBeVisible()
    await expect(page.getByPlaceholder(/e.g. living room/i)).toHaveValue('Bookshelf A')
    await expect(page.getByPlaceholder(/brief description/i)).toHaveValue(
      'Main shelf in the living room'
    )
    await expect(page.getByRole('button', { name: /save changes/i })).toBeVisible()
  })

  test('shows validation error when name is cleared and form submitted', async ({ page }) => {
    await registerLocation(LOCATION_1)
    await registerLocations([LOCATION_1])
    await page.goto(`/library/locations/${LOCATION_1.id}/edit`)
    await page.getByPlaceholder(/e.g. living room/i).clear()
    await page.getByRole('button', { name: /save changes/i }).click()
    await expect(page.getByText(/name is required/i)).toBeVisible()
  })

  test('excludes the edited location itself from parent options', async ({ page }) => {
    await registerLocation(LOCATION_1)
    await registerLocations([LOCATION_1, LOCATION_2])
    await page.goto(`/library/locations/${LOCATION_1.id}/edit`)
    const select = page.getByRole('combobox')
    await expect(select).not.toContainText('Bookshelf A')
    await expect(select).toContainText('Cabinet B')
  })

  test('pre-selects the current parent location', async ({ page }) => {
    await registerLocation(LOCATION_CHILD)
    await registerLocations([LOCATION_2, LOCATION_CHILD])
    await page.goto(`/library/locations/${LOCATION_CHILD.id}/edit`)
    await expect(page.getByRole('combobox')).toHaveValue(LOCATION_2.id)
  })

  test('Cancel link points to /library/locations', async ({ page }) => {
    await registerLocation(LOCATION_1)
    await registerLocations([LOCATION_1])
    await page.goto(`/library/locations/${LOCATION_1.id}/edit`)
    await expect(page.getByRole('link', { name: /cancel/i })).toHaveAttribute(
      'href',
      '/library/locations'
    )
  })

  test('saves and redirects to /library/locations on success', async ({ page }) => {
    await registerLocation(LOCATION_1)
    await registerLocations([LOCATION_1])
    await registerHandler({
      method: 'PUT',
      path: `/api/locations/${LOCATION_1.id}`,
      body: { ...LOCATION_1, name: 'Bookshelf A Updated' },
    })
    await registerLocations([{ ...LOCATION_1, name: 'Bookshelf A Updated' }])
    await page.goto(`/library/locations/${LOCATION_1.id}/edit`)
    await page.getByPlaceholder(/e.g. living room/i).fill('Bookshelf A Updated')
    await page.getByRole('button', { name: /save changes/i }).click()
    await page.waitForURL('**/library/locations')
    expect(new URL(page.url()).pathname).toBe('/library/locations')
  })

  test('shows server error message when API call fails', async ({ page }) => {
    await registerLocation(LOCATION_1)
    await registerLocations([LOCATION_1])
    await registerHandler({
      method: 'PUT',
      path: `/api/locations/${LOCATION_1.id}`,
      status: 500,
      body: {},
    })
    await page.goto(`/library/locations/${LOCATION_1.id}/edit`)
    await page.getByPlaceholder(/e.g. living room/i).fill('Bad Update')
    await page.getByRole('button', { name: /save changes/i }).click()
    await expect(page.getByText(/failed to update location/i)).toBeVisible()
  })

  test('edit page is reachable from the location list', async ({ page }) => {
    await registerLocations([LOCATION_1])
    await page.goto('/library/locations')
    await page.getByRole('link', { name: /edit/i }).first().click()
    await page.waitForURL(`**/library/locations/${LOCATION_1.id}/edit`)
    expect(new URL(page.url()).pathname).toBe(`/library/locations/${LOCATION_1.id}/edit`)
  })
})

