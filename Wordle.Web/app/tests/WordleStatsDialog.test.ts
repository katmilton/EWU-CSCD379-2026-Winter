import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import WordleStatsDialog from '../components/wordle/WordleStatsDialog.vue'

describe('WordleStatsDialog', () => {
  it('displays stats and uses distWidth for distribution bars', async () => {
    const stats = {
      played: 10,
      wins: 6,
      losses: 4,
      guessDist: { 1: 0, 2: 1, 3: 2, 4: 1, 5: 1, 6: 1 },
    }

    const distWidth = vi.fn().mockImplementation(i => `${i * 10}%`)

    const wrapper = mount(WordleStatsDialog, {
      props: {
        stats,
        winPercent: 60,
        avgGuessesToWin: '3.50',
        dailyPlayedToday: false,
        maxGuesses: 6,
        distWidth,
      },
      global: {
        components: {
          'v-dialog': { template: '<div><slot/></div>' },
          'v-card': { template: '<div><slot/></div>' },
          'v-card-title': { template: '<div><slot/></div>' },
          'v-card-text': { template: '<div><slot/></div>' },
          'v-btn': { template: '<button><slot/></button>' },
        },
      },
    })

    // enable the dialog's internal model so content renders
    ;(wrapper.vm as any).model = true
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Played')
    expect(wrapper.text()).toContain('10')
    expect(wrapper.text()).toContain('Win %')
    expect(wrapper.text()).toContain('60%')
    expect(distWidth).toHaveBeenCalled()
  })
})
