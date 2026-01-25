import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import WordleKeyboard from '../components/wordle/WordleKeyboard.vue'

describe('WordleKeyboard', () => {
  it('emits key events for letter keys, Enter, and Backspace', async () => {
    const wrapper = mount(WordleKeyboard, { props: { keyClass: () => ({}) } })

    const firstKey = wrapper.find('button.kb-key')
    await firstKey.trigger('click')
    expect(wrapper.emitted('key')).toBeTruthy()

    const enter = wrapper.findAll('button').find(b => b.attributes('aria-label') === 'Enter')
    await enter!.trigger('click')
    expect(wrapper.emitted('key')?.some(([k]) => k === 'ENTER')).toBeTruthy()

    const back = wrapper.findAll('button').find(b => b.attributes('aria-label') === 'Backspace')
    await back!.trigger('click')
    expect(wrapper.emitted('key')?.some(([k]) => k === 'BACKSPACE')).toBeTruthy()
  })
})
