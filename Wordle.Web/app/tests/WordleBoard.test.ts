import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import WordleBoard from '../components/wordle/WordleBoard.vue'

describe('WordleBoard', () => {
  it('renders letters from the board and applies cell class', () => {
    const board = Array.from({ length: 6 }, () => Array.from({ length: 5 }, () => ''))
    board[0]![0] = 'A'

    const wrapper = mount(WordleBoard, {
      props: {
        board,
        wordLen: 5,
        maxGuesses: 6,
        shakeRowIndex: null,
        cellClass: () => ({ filled: true }),
      },
    })

    expect(wrapper.text()).toContain('A')
    const cell = wrapper.find('.cell')
    expect(cell.classes()).toContain('filled')
  })
})
