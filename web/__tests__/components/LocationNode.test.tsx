import { describe, it, expect, vi } from 'vitest'
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
    render(<LocationNode location={MOCK_LOCATION} isSelected={false} onToggleAction={() => {}} />)
    expect(screen.getByText('Bookshelf A')).toBeInTheDocument()
  })

  it('renders the location description', () => {
    render(<LocationNode location={MOCK_LOCATION} isSelected={false} onToggleAction={() => {}} />)
    expect(screen.getByText('Main bookshelf in the living room')).toBeInTheDocument()
  })

  it('renders the location code', () => {
    render(<LocationNode location={MOCK_LOCATION} isSelected={false} onToggleAction={() => {}} />)
    expect(screen.getByText('BSA')).toBeInTheDocument()
  })

  it('does not render description when empty', () => {
    render(<LocationNode location={{ ...MOCK_LOCATION, description: '' }} isSelected={false} onToggleAction={() => {}} />)
    expect(screen.queryByText('Main bookshelf in the living room')).not.toBeInTheDocument()
  })

  it('renders Edit button', () => {
    render(<LocationNode location={MOCK_LOCATION} isSelected={false} onToggleAction={() => {}} />)
    expect(screen.getByRole('link', { name: /edit/i })).toBeInTheDocument()
  })

  it('renders Delete button', () => {
    render(<LocationNode location={MOCK_LOCATION} isSelected={false} onToggleAction={() => {}} />)
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
  })
})

describe('LocationNode — delete confirmation', () => {
  it('shows confirmation prompt when Delete is clicked', () => {
    render(<LocationNode location={MOCK_LOCATION} isSelected={false} onToggleAction={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(screen.getByText(/delete location/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /yes/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /no/i })).toBeInTheDocument()
  })

  it('hides the Delete button once confirmation is shown', () => {
    render(<LocationNode location={MOCK_LOCATION} isSelected={false} onToggleAction={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(screen.queryByRole('button', { name: /^delete$/i })).not.toBeInTheDocument()
  })

  it('restores Delete button when No is clicked', () => {
    render(<LocationNode location={MOCK_LOCATION} isSelected={false} onToggleAction={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /delete/i }))
    fireEvent.click(screen.getByRole('button', { name: /no/i }))
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /yes/i })).not.toBeInTheDocument()
  })
})

describe('LocationNode — expand toggle', () => {
  it('expand toggle button is not rendered when hasChildren is false', () => {
    render(<LocationNode location={MOCK_LOCATION} isSelected={false} onToggleAction={() => {}} />)
    const links = screen.getAllByRole('link', { name: /edit/i })
    expect(links).toHaveLength(1)
    const buttons = screen.getAllByRole('button', { name: /delete/i })
    expect(buttons).toHaveLength(1)
  })
})

describe('LocationNode — checkbox selection', () => {
  it('renders a checkbox', () => {
    render(<LocationNode location={MOCK_LOCATION} isSelected={false} onToggleAction={() => {}} />)
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
  })

  it('checkbox is unchecked when isSelected is false', () => {
    render(<LocationNode location={MOCK_LOCATION} isSelected={false} onToggleAction={() => {}} />)
    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })

  it('checkbox is checked when isSelected is true', () => {
    render(<LocationNode location={MOCK_LOCATION} isSelected={true} onToggleAction={() => {}} />)
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('calls onToggleAction with the location id when checkbox is clicked', () => {
    const onToggle = vi.fn()
    render(<LocationNode location={MOCK_LOCATION} isSelected={false} onToggleAction={onToggle} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onToggle).toHaveBeenCalledOnce()
    expect(onToggle).toHaveBeenCalledWith('loc-1')
  })

  it('checkbox has an accessible label containing the location name', () => {
    render(<LocationNode location={MOCK_LOCATION} isSelected={false} onToggleAction={() => {}} />)
    expect(screen.getByRole('checkbox', { name: /bookshelf a/i })).toBeInTheDocument()
  })
})

