import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LocationNode from '@/components/LocationNode'
import type { LocationDto } from '@/lib/types/location'

const MOCK_LOCATION: LocationDto = {
  id: 'loc-1',
  ownerId: 'owner-1',
  name: 'Bookshelf A',
  description: 'Main bookshelf in the living room',
  code: 'BSA',
  parentId: null,
  locationPath: null,
}

describe('LocationNode — rendering', () => {
  it('renders the location name', () => {
    render(<LocationNode location={MOCK_LOCATION} />)
    expect(screen.getByText('Bookshelf A')).toBeInTheDocument()
  })

  it('renders the location description', () => {
    render(<LocationNode location={MOCK_LOCATION} />)
    expect(screen.getByText('Main bookshelf in the living room')).toBeInTheDocument()
  })

  it('renders the location code', () => {
    render(<LocationNode location={MOCK_LOCATION} />)
    expect(screen.getByText('BSA')).toBeInTheDocument()
  })

  it('does not render description when empty', () => {
    render(<LocationNode location={{ ...MOCK_LOCATION, description: '' }} />)
    expect(screen.queryByText('Main bookshelf in the living room')).not.toBeInTheDocument()
  })

  it('renders Edit button', () => {
    render(<LocationNode location={MOCK_LOCATION} />)
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
  })

  it('renders Delete button', () => {
    render(<LocationNode location={MOCK_LOCATION} />)
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
  })
})

describe('LocationNode — delete confirmation', () => {
  it('shows confirmation prompt when Delete is clicked', () => {
    render(<LocationNode location={MOCK_LOCATION} />)
    fireEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(screen.getByText(/delete location/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /yes/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /no/i })).toBeInTheDocument()
  })

  it('hides the Delete button once confirmation is shown', () => {
    render(<LocationNode location={MOCK_LOCATION} />)
    fireEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(screen.queryByRole('button', { name: /^delete$/i })).not.toBeInTheDocument()
  })

  it('restores Delete button when No is clicked', () => {
    render(<LocationNode location={MOCK_LOCATION} />)
    fireEvent.click(screen.getByRole('button', { name: /delete/i }))
    fireEvent.click(screen.getByRole('button', { name: /no/i }))
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /yes/i })).not.toBeInTheDocument()
  })
})

describe('LocationNode — expand toggle', () => {
  it('expand toggle button is not rendered when hasChildren is false', () => {
    render(<LocationNode location={MOCK_LOCATION} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(2)
  })
})

