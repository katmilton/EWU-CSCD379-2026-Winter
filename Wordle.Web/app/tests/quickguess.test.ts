import { describe, it, expect } from 'vitest'
import { checkGuess } from '../scripts/quickguess'

describe('Quick Guess logic', () => {
  it('returns Correct! for CSCD379', () => {
    expect(checkGuess('CSCD379')).toBe('Correct!')
  })

  it('returns Try again for wrong input', () => {
    expect(checkGuess('abc')).toBe('Try again')
  })
})
