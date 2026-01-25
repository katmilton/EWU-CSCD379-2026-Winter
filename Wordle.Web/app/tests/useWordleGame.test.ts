import { describe, it, expect, vi } from 'vitest'

// Mock the asset imports that use the `~` alias so the composable can load lists in tests.
vi.mock('~/assets/words.json', () => ({ default: ['crane', 'slate', 'arise', 'about', 'apple'] }))
vi.mock('~/assets/validWords.json', () => ({ default: ['crane', 'slate', 'arise', 'about', 'apple'] }))

import { useWordleGame } from '../composables/useWordleGame'

describe('useWordleGame composable', () => {
  it('submitGuess rejects incomplete guesses', async () => {
    const g = useWordleGame()
    g.typeLetter('a')
    g.typeLetter('b')
    await g.submitGuess()
    expect(g.statusMessage.value).toBe('Not enough letters.')
  })

  it('startRandom sets up a game and submitting a valid guess advances the guess index', async () => {
    const g = useWordleGame()
    vi.spyOn(Math, 'random').mockReturnValue(0)
    g.startRandom()

    // type a known valid word from the list
    for (const ch of ['C', 'R', 'A', 'N', 'E']) g.typeLetter(ch)

    await g.submitGuess()
    expect(g.guessIndex.value).toBeGreaterThanOrEqual(1)

    vi.restoreAllMocks()
  })

  it('gives a starter hint when history is empty', () => {
    const g = useWordleGame()
    g.giveHint()
    expect(g.hintText.value).toBe('Hint: try a strong opener like CRANE, SLATE, or ARISE.')
  })
})
