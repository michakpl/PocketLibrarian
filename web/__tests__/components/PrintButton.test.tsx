import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PrintButton from '@/components/PrintButton'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PrintButton', () => {
  it('renders a button with Print label', () => {
    render(<PrintButton />)
    expect(screen.getByRole('button', { name: /print/i })).toBeInTheDocument()
  })

  it('calls window.print() when clicked', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {})
    render(<PrintButton />)
    fireEvent.click(screen.getByRole('button', { name: /print/i }))
    expect(printSpy).toHaveBeenCalledOnce()
  })
})
