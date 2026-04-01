import { describe, it, expect } from 'vitest'
import { formatCurrency } from './formatCurrency'

describe('formatCurrency', () => {
  it('formatea CLP por defecto', () => {
    expect(formatCurrency(5000)).toContain('5.000')
  })

  it('formatea CLP explícito', () => {
    expect(formatCurrency(15000, 'CLP')).toContain('15.000')
  })

  it('formatea COP', () => {
    expect(formatCurrency(50000, 'COP')).toContain('50.000')
  })

  it('formatea USD', () => {
    expect(formatCurrency(1000, 'USD')).toContain('1,000')
  })

  it('formatea EUR', () => {
    expect(formatCurrency(1000, 'EUR')).toContain('1.000')
  })

  it('formatea cero', () => {
    expect(formatCurrency(0)).toContain('0')
  })
})
