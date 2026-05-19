import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LocationForm from '@/components/LocationForm'
import type { LocationDto } from '@/lib/types/location'

vi.mock('@/components/actions', () => ({
  addLocationAction: vi.fn(async () => ({})),
  updateLocationAction: vi.fn(async () => ({})),
}))

const LOCATIONS: LocationDto[] = [
  {
    id: 'loc-1',
    ownerId: 'owner-1',
    name: 'Living Room',
    description: 'Main room',
    code: 'LR',
    parentId: null,
    locationPath: ['Living Room'],
  },
  {
    id: 'loc-2',
    ownerId: 'owner-1',
    name: 'Shelf A',
    description: 'Top shelf',
    code: 'LR-SA',
    parentId: 'loc-1',
    locationPath: ['Living Room', 'Shelf A'],
  },
  {
    id: 'loc-3',
    ownerId: 'owner-1',
    name: 'Row 1',
    description: 'First row',
    code: 'LR-SA-R1',
    parentId: 'loc-2',
    locationPath: ['Living Room', 'Shelf A', 'Row 1'],
  },
]

const EXISTING_LOCATION: LocationDto = LOCATIONS[1]

describe('LocationForm — add mode', () => {
  it('renders empty fields in add mode', () => {
    render(<LocationForm locations={LOCATIONS} />)
    expect(screen.getByPlaceholderText(/living room/i)).toHaveValue('')
    expect(screen.getByPlaceholderText(/brief description/i)).toHaveValue('')
  })

  it('shows "Add Location" submit button in add mode', () => {
    render(<LocationForm locations={LOCATIONS} />)
    expect(screen.getByRole('button', { name: /add location/i })).toBeInTheDocument()
  })

  it('renders Cancel link pointing to /library/locations', () => {
    render(<LocationForm locations={LOCATIONS} />)
    const cancel = screen.getByRole('link', { name: /cancel/i })
    expect(cancel).toHaveAttribute('href', '/library/locations')
  })

  it('renders all locations as parent options', () => {
    render(<LocationForm locations={LOCATIONS} />)
    expect(screen.getByRole('option', { name: 'Living Room' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Living Room › Shelf A' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Living Room › Shelf A › Row 1' })).toBeInTheDocument()
  })

  it('renders "No parent" as the default option', () => {
    render(<LocationForm locations={LOCATIONS} />)
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('')
    expect(screen.getByRole('option', { name: /no parent/i })).toBeInTheDocument()
  })

  it('shows validation error when name is empty on submit', async () => {
    render(<LocationForm locations={LOCATIONS} />)
    fireEvent.click(screen.getByRole('button', { name: /add location/i }))
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument()
    })
  })
})

describe('LocationForm — edit mode', () => {
  it('pre-fills fields from location prop', () => {
    render(<LocationForm location={EXISTING_LOCATION} locations={LOCATIONS} />)
    expect(screen.getByPlaceholderText(/living room/i)).toHaveValue('Shelf A')
    expect(screen.getByPlaceholderText(/brief description/i)).toHaveValue('Top shelf')
  })

  it('shows "Save Changes" submit button in edit mode', () => {
    render(<LocationForm location={EXISTING_LOCATION} locations={LOCATIONS} />)
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
  })

  it('pre-selects the location parent in the dropdown', () => {
    render(<LocationForm location={EXISTING_LOCATION} locations={LOCATIONS} />)
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('loc-1')
  })

  it('excludes the edited location itself from parent options', () => {
    render(<LocationForm location={EXISTING_LOCATION} locations={LOCATIONS} />)
    const options = screen.getAllByRole('option').map((o) => o.textContent)
    expect(options).not.toContain('Living Room › Shelf A')
  })

  it('excludes descendants of the edited location from parent options', () => {
    render(<LocationForm location={EXISTING_LOCATION} locations={LOCATIONS} />)
    const options = screen.getAllByRole('option').map((o) => o.textContent)
    expect(options).not.toContain('Living Room › Shelf A › Row 1')
  })

  it('still shows unrelated locations as parent options', () => {
    render(<LocationForm location={EXISTING_LOCATION} locations={LOCATIONS} />)
    expect(screen.getByRole('option', { name: 'Living Room' })).toBeInTheDocument()
  })
})

describe('LocationForm — server action error', () => {
  it('displays error message returned by addLocationAction', async () => {
    const { addLocationAction } = await import('@/components/actions')
    vi.mocked(addLocationAction).mockResolvedValueOnce({ error: 'Server unavailable' })

    render(<LocationForm locations={LOCATIONS} />)
    fireEvent.change(screen.getByPlaceholderText(/living room/i), {
      target: { value: 'New Shelf' },
    })
    fireEvent.click(screen.getByRole('button', { name: /add location/i }))

    await waitFor(() => {
      expect(screen.getByText('Server unavailable')).toBeInTheDocument()
    })
  })

  it('displays error message returned by updateLocationAction', async () => {
    const { updateLocationAction } = await import('@/components/actions')
    vi.mocked(updateLocationAction).mockResolvedValueOnce({ error: 'Update failed' })

    render(<LocationForm location={EXISTING_LOCATION} locations={LOCATIONS} />)
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(screen.getByText('Update failed')).toBeInTheDocument()
    })
  })
})

