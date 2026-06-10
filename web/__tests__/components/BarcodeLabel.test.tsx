import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import BarcodeLabel from '@/components/BarcodeLabel'

vi.mock('jsbarcode', () => ({
  default: vi.fn(),
}))

import JsBarcode from 'jsbarcode'

const MOCK_PROPS = {
  name: 'Bookshelf A',
  locationPath: ['Living Room', 'Bookshelf A'],
  code: 'BSA001',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('BarcodeLabel — rendering', () => {
  it('renders the location name', () => {
    render(<BarcodeLabel {...MOCK_PROPS} />)
    expect(screen.getByText('Bookshelf A')).toBeInTheDocument()
  })

  it('renders the location path joined with ›', () => {
    render(<BarcodeLabel {...MOCK_PROPS} />)
    expect(screen.getByText('Living Room › Bookshelf A')).toBeInTheDocument()
  })

  it('does not render path when locationPath is empty', () => {
    render(<BarcodeLabel {...MOCK_PROPS} locationPath={[]} />)
    expect(screen.queryByText(/›/)).not.toBeInTheDocument()
  })

  it('renders a single-segment path without separator', () => {
    render(<BarcodeLabel {...MOCK_PROPS} locationPath={['Root']} />)
    expect(screen.getByText('Root')).toBeInTheDocument()
    expect(screen.queryByText(/›/)).not.toBeInTheDocument()
  })

  it('renders an SVG element for the barcode', () => {
    const { container } = render(<BarcodeLabel {...MOCK_PROPS} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})

describe('BarcodeLabel — jsbarcode integration', () => {
  it('calls JsBarcode with the code on mount', () => {
    render(<BarcodeLabel {...MOCK_PROPS} />)
    expect(JsBarcode).toHaveBeenCalledWith(
      expect.anything(),
      'BSA001',
      expect.objectContaining({ format: 'CODE128' })
    )
  })

  it('calls JsBarcode with displayValue: true', () => {
    render(<BarcodeLabel {...MOCK_PROPS} />)
    expect(JsBarcode).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      expect.objectContaining({ displayValue: true })
    )
  })

  it('re-calls JsBarcode with updated code when code prop changes', () => {
    const { rerender } = render(<BarcodeLabel {...MOCK_PROPS} code="OLD" />)
    rerender(<BarcodeLabel {...MOCK_PROPS} code="NEW" />)
    expect(JsBarcode).toHaveBeenCalledTimes(2)
    const lastCall = (JsBarcode as ReturnType<typeof vi.fn>).mock.calls[1]
    expect(lastCall[1]).toBe('NEW')
  })
})
