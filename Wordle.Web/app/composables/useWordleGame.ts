// composables/useWordleGame.ts
import { computed, reactive, ref, watch } from 'vue'

import solutionsRaw from '~/assets/words.json'
import validRaw from '~/assets/validWords.json'

export type TileStatus = '' | 'absent' | 'present' | 'correct'
export type Mode = 'daily' | 'random'

type Stats = {
  played: number
  wins: number
  losses: number
  guessDist: Record<number, number> // 1..6
  totalWinGuesses: number
  lastDailyDate: string | null
  lastDailyOutcome: 'win' | 'loss' | null
}

type DailyState = {
  date: string
  solutionIndex: number
  guesses: string[]
  results: TileStatus[][]
  finished: boolean
  won: boolean
}

export const WORD_LEN = 5
export const MAX_GUESSES = 6

const LS_STATS = 'wordle_clone_stats_v1'
const LS_DAILY_STATE = 'wordle_clone_daily_state_v1'

// --------------------
// Word lists (from your JSON files)
// --------------------
const SOLUTIONS = (solutionsRaw as string[])
  .map(w => w.trim().toUpperCase())
  .filter(w => w.length === WORD_LEN)

const VALID_GUESSES = new Set(
  (validRaw as string[])
    .map(w => w.trim().toUpperCase())
    .filter(w => w.length === WORD_LEN)
)

// Ensure every solution is also a valid guess
for (const w of SOLUTIONS) VALID_GUESSES.add(w)

// --------------------
// Helpers
// --------------------
function defaultStats(): Stats {
  return {
    played: 0,
    wins: 0,
    losses: 0,
    guessDist: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    totalWinGuesses: 0,
    lastDailyDate: null,
    lastDailyOutcome: null,
  }
}

function makeEmptyBoard() {
  return Array.from({ length: MAX_GUESSES }, () => Array.from({ length: WORD_LEN }, () => ''))
}
function makeEmptyStatuses() {
  return Array.from({ length: MAX_GUESSES }, () => Array.from({ length: WORD_LEN }, () => '' as TileStatus))
}

function getTodayKeyLocal() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function getDaysSinceEpochLocal(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  const epoch = new Date(1970, 0, 1)
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.floor((dt.getTime() - epoch.getTime()) / msPerDay)
}

function pickDailySolutionIndex(dateKey: string) {
  const days = getDaysSinceEpochLocal(dateKey)
  const len = SOLUTIONS.length || 1
  return ((days % len) + len) % len
}

function loadStats(): Stats {
  // SSR-safe
  if (import.meta.server) return defaultStats()
  try {
    const raw = localStorage.getItem(LS_STATS)
    if (!raw) return defaultStats()
    const parsed = JSON.parse(raw) as Partial<Stats>
    return {
      ...defaultStats(),
      ...parsed,
      guessDist: { ...defaultStats().guessDist, ...(parsed.guessDist || {}) },
    }
  } catch {
    return defaultStats()
  }
}

function saveStats(stats: Stats) {
  if (import.meta.server) return
  localStorage.setItem(LS_STATS, JSON.stringify(stats))
}

function loadDailyState(): DailyState | null {
  if (import.meta.server) return null
  try {
    const raw = localStorage.getItem(LS_DAILY_STATE)
    if (!raw) return null
    const st = JSON.parse(raw) as DailyState
    if (!st?.date || typeof st.solutionIndex !== 'number') return null
    return st
  } catch {
    return null
  }
}

function saveDailyState(st: DailyState | null) {
  if (import.meta.server) return
  if (!st) localStorage.removeItem(LS_DAILY_STATE)
  else localStorage.setItem(LS_DAILY_STATE, JSON.stringify(st))
}

// Wordle scoring with duplicates:
// 1) mark correct and build remaining letter counts
// 2) mark present if remaining count > 0 else absent
function scoreGuess(guess: string, target: string): TileStatus[] {
  const res: TileStatus[] = Array(WORD_LEN).fill('absent')
  const t = target.split('')
  const g = guess.split('')
  const counts: Record<string, number> = {}

  for (let i = 0; i < WORD_LEN; i++) {
    if (g[i] === t[i]) {
      res[i] = 'correct'
    } else {
      counts[t[i]] = (counts[t[i]] || 0) + 1
    }
  }

  for (let i = 0; i < WORD_LEN; i++) {
    if (res[i] === 'correct') continue
    const ch = g[i]
    if ((counts[ch] || 0) > 0) {
      res[i] = 'present'
      counts[ch]--
    } else {
      res[i] = 'absent'
    }
  }

  return res
}

function sameStatuses(a: TileStatus[], b: TileStatus[]) {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

// Hint system: keep solutions consistent with history
function isConsistentWithHistory(solution: string, history: { guess: string; result: TileStatus[] }[]) {
  for (const h of history) {
    const expected = scoreGuess(h.guess, solution)
    if (!sameStatuses(expected, h.result)) return false
  }
  return true
}

function letterFrequency(words: string[]) {
  const f: Record<string, number> = {}
  for (const w of words) {
    const seen = new Set<string>()
    for (const ch of w) {
      if (seen.has(ch)) continue
      seen.add(ch)
      f[ch] = (f[ch] || 0) + 1
    }
  }
  return f
}

function scoreWordByFreq(word: string, freq: Record<string, number>) {
  const seen = new Set<string>()
  let score = 0
  for (const ch of word) {
    if (seen.has(ch)) continue
    seen.add(ch)
    score += (freq[ch] || 0)
  }
  return score
}

// --------------------
// Composable
// --------------------
export function useWordleGame() {
  const mode = ref<Mode>('daily')

  const board = ref<string[][]>(makeEmptyBoard())
  const statuses = ref<TileStatus[][]>(makeEmptyStatuses())
  const guessIndex = ref(0)
  const letterIndex = ref(0)

  const gameOver = ref(false)
  const won = ref(false)

  const statusMessage = ref('Type a word.')
  const hintText = ref('')

  const shakeRowIndex = ref<number | null>(null)

  const definition = ref('')
  const definitionSource = ref('')

  const targetWord = ref('')

  // keyboard best-color state
  const keyStatus = reactive<Record<string, TileStatus>>({})

  // stats
  const stats = reactive<Stats>(loadStats())
  watch(stats, () => saveStats(stats), { deep: true })

  const todayKey = computed(() => getTodayKeyLocal())

  const dailyPlayedToday = computed(() => stats.lastDailyDate === todayKey.value && stats.lastDailyOutcome !== null)
  const dailyAlreadyFinished = computed(() => mode.value === 'daily' && dailyPlayedToday.value)

  const winPercent = computed(() => {
    const p = stats.played ? Math.round((stats.wins / stats.played) * 100) : 0
    return Number.isFinite(p) ? p : 0
  })

  const avgGuessesToWin = computed(() => {
    if (!stats.wins) return '—'
    return (stats.totalWinGuesses / stats.wins).toFixed(2)
  })

  function clearKeyStatus() {
    for (const k of Object.keys(keyStatus)) delete keyStatus[k]
  }

  function resetBoardState() {
    board.value = makeEmptyBoard()
    statuses.value = makeEmptyStatuses()
    guessIndex.value = 0
    letterIndex.value = 0
    gameOver.value = false
    won.value = false
    statusMessage.value = 'Type a word.'
    hintText.value = ''
    definition.value = ''
    definitionSource.value = ''
    shakeRowIndex.value = null
    clearKeyStatus()
  }

  function applyKeyStatusFromRow(guess: string, rowStatuses: TileStatus[]) {
    // priority: correct > present > absent
    const priority: Record<TileStatus, number> = { '': 0, absent: 1, present: 2, correct: 3 }
    for (let i = 0; i < WORD_LEN; i++) {
      const ch = guess[i]
      const st = rowStatuses[i]
      const prev = keyStatus[ch] || ''
      if (priority[st] > priority[prev]) keyStatus[ch] = st
    }
  }

  function currentGuessString() {
    return board.value[guessIndex.value].join('')
  }

  function shakeRow(row: number) {
    shakeRowIndex.value = row
    window.setTimeout(() => {
      if (shakeRowIndex.value === row) shakeRowIndex.value = null
    }, 520)
  }

  function isValidGuess(word: string) {
    return VALID_GUESSES.has(word.toUpperCase())
  }

  async function fetchDefinition(word: string) {
    definition.value = ''
    definitionSource.value = ''
    try {
      // free API works on static sites
      const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`
      const res = await fetch(url)
      if (!res.ok) return
      const data = await res.json()
      const first = Array.isArray(data) ? data[0] : null
      const meanings = first?.meanings?.[0]
      const def = meanings?.definitions?.[0]?.definition
      if (def) {
        definition.value = def
        definitionSource.value = 'dictionaryapi.dev'
      }
    } catch {
      // ignore
    }
  }

  function startDaily() {
    mode.value = 'daily'
    resetBoardState()

    if (SOLUTIONS.length === 0) {
      gameOver.value = true
      statusMessage.value = 'No solutions loaded. Check assets/words.json'
      return
    }

    const idx = pickDailySolutionIndex(todayKey.value)
    targetWord.value = SOLUTIONS[idx]

    // Restore in-progress daily if exists
    const st = loadDailyState()
    if (st && st.date === todayKey.value && st.solutionIndex === idx) {
      for (let r = 0; r < st.guesses.length && r < MAX_GUESSES; r++) {
        const g = st.guesses[r].toUpperCase()
        for (let c = 0; c < WORD_LEN; c++) board.value[r][c] = g[c] || ''
        statuses.value[r] = (st.results[r] || Array(WORD_LEN).fill('')) as TileStatus[]
        applyKeyStatusFromRow(g, statuses.value[r])
      }

      guessIndex.value = Math.min(st.guesses.length, MAX_GUESSES)
      letterIndex.value = 0

      if (st.finished) {
        gameOver.value = true
        won.value = st.won
        statusMessage.value = won.value
          ? `You already solved today's word!`
          : `You already played today's word. The word was ${targetWord.value}.`
        if (won.value) void fetchDefinition(targetWord.value)
        return
      }

      statusMessage.value = 'Continue today’s game.'
    } else {
      saveDailyState({
        date: todayKey.value,
        solutionIndex: idx,
        guesses: [],
        results: [],
        finished: false,
        won: false,
      })
    }

    // enforce “once per day” even if daily state got cleared
    if (dailyPlayedToday.value) {
      gameOver.value = true
      won.value = stats.lastDailyOutcome === 'win'
      statusMessage.value = won.value ? `You already solved today's word!` : `You already played today's word.`
    }
  }

  function startRandom() {
    mode.value = 'random'
    resetBoardState()

    if (SOLUTIONS.length === 0) {
      gameOver.value = true
      statusMessage.value = 'No solutions loaded. Check assets/words.json'
      return
    }

    targetWord.value = SOLUTIONS[Math.floor(Math.random() * SOLUTIONS.length)]
    statusMessage.value = 'Random game started.'
  }

  function typeLetter(letter: string) {
    if (gameOver.value) return
    if (mode.value === 'daily' && dailyPlayedToday.value) return
    if (guessIndex.value >= MAX_GUESSES) return
    if (letterIndex.value >= WORD_LEN) return
    hintText.value = ''
    board.value[guessIndex.value][letterIndex.value] = letter.toUpperCase()
    letterIndex.value++
  }

  function backspace() {
    if (gameOver.value) return
    if (mode.value === 'daily' && dailyPlayedToday.value) return
    if (guessIndex.value >= MAX_GUESSES) return
    if (letterIndex.value <= 0) return
    hintText.value = ''
    letterIndex.value--
    board.value[guessIndex.value][letterIndex.value] = ''
  }

  async function onFinishGame(didWin: boolean, guessesUsed: number) {
    stats.played += 1
    if (didWin) {
      stats.wins += 1
      stats.totalWinGuesses += guessesUsed
      stats.guessDist[guessesUsed] = (stats.guessDist[guessesUsed] || 0) + 1
    } else {
      stats.losses += 1
    }

    if (mode.value === 'daily') {
      stats.lastDailyDate = todayKey.value
      stats.lastDailyOutcome = didWin ? 'win' : 'loss'

      const idx = pickDailySolutionIndex(todayKey.value)
      const st = loadDailyState() || {
        date: todayKey.value,
        solutionIndex: idx,
        guesses: [],
        results: [],
        finished: false,
        won: false,
      }
      st.date = todayKey.value
      st.solutionIndex = idx
      st.finished = true
      st.won = didWin
      saveDailyState(st)
    }
  }

  async function submitGuess() {
    if (gameOver.value) return

    if (mode.value === 'daily' && dailyPlayedToday.value) {
      statusMessage.value = `You've already played today's word. Try Random.`
      return
    }

    const guessRow = board.value[guessIndex.value]
    const guess = guessRow.join('').toUpperCase()

    // if any tile is empty OR the joined string isn't 5 chars, reject
    if (guessRow.some(ch => !ch) || guess.length !== WORD_LEN) {
    statusMessage.value = 'Not enough letters.'
    shakeRow(guessIndex.value)
    return
    }


    if (!isValidGuess(guess)) {
      statusMessage.value = 'Not in word list.'
      shakeRow(guessIndex.value)
      return
    }

    const rowResult = scoreGuess(guess, targetWord.value)
    statuses.value[guessIndex.value] = rowResult
    applyKeyStatusFromRow(guess, rowResult)

    // persist daily progress so refresh continues
    if (mode.value === 'daily') {
      const idx = pickDailySolutionIndex(todayKey.value)
      const st = loadDailyState() || {
        date: todayKey.value,
        solutionIndex: idx,
        guesses: [],
        results: [],
        finished: false,
        won: false,
      }

      if (st.date === todayKey.value && st.solutionIndex === idx) {
        st.guesses[guessIndex.value] = guess
        st.results[guessIndex.value] = rowResult
        saveDailyState(st)
      }
    }

    if (guess === targetWord.value) {
      won.value = true
      gameOver.value = true
      statusMessage.value = `Nice! You got it in ${guessIndex.value + 1}.`
      await onFinishGame(true, guessIndex.value + 1)
      void fetchDefinition(targetWord.value)
      return
    }

    guessIndex.value++
    letterIndex.value = 0

    if (guessIndex.value >= MAX_GUESSES) {
      gameOver.value = true
      won.value = false
      statusMessage.value = `Out of guesses. The word was ${targetWord.value}.`
      await onFinishGame(false, MAX_GUESSES)
      return
    }

    statusMessage.value = 'Try again.'
  }

  function giveHint() {
    hintText.value = ''
    if (gameOver.value) {
      hintText.value = 'Game over — start a new game to get hints.'
      return
    }

    const history: { guess: string; result: TileStatus[] }[] = []
    for (let r = 0; r < guessIndex.value; r++) {
      const row = board.value[r]
        const g = row.join('')
        if (g.length === WORD_LEN && !row.some(ch => !ch)) {
        history.push({ guess: g, result: statuses.value[r] })
}

    }

    if (history.length === 0) {
      hintText.value = 'Hint: try a strong opener like CRANE, SLATE, or ARISE.'
      return
    }

    const remaining = SOLUTIONS.filter(sol => isConsistentWithHistory(sol, history))
    if (remaining.length === 0) {
      hintText.value = 'No candidates left (based on the small solutions list). Expand your lists.'
      return
    }

    const freq = letterFrequency(remaining)
    const top = remaining
      .map(w => ({ w, s: scoreWordByFreq(w, freq) }))
      .sort((a, b) => b.s - a.s)
      .slice(0, 5)
      .map(x => x.w)

    hintText.value = `Possible words (${remaining.length}): ${top.join(', ')}`
  }

  // UI helpers for components
  function cellClass(r: number, c: number) {
    const st = statuses.value[r][c]
    const isActiveRow = r === guessIndex.value && !gameOver.value
    const hasLetter = !!board.value[r][c]
    return {
      filled: hasLetter,
      active: isActiveRow,
      absent: st === 'absent',
      present: st === 'present',
      correct: st === 'correct',
    }
  }

  function keyClass(letter: string) {
    const st = keyStatus[letter] || ''
    return {
      absent: st === 'absent',
      present: st === 'present',
      correct: st === 'correct',
    }
  }

  function distWidth(i: number) {
    const max = Math.max(...Object.values(stats.guessDist))
    const val = stats.guessDist[i] || 0
    if (max <= 0) return '0%'
    return `${Math.round((val / max) * 100)}%`
  }

  return {
    WORD_LEN,
    MAX_GUESSES,

    mode,
    board,
    statuses,
    guessIndex,
    letterIndex,

    gameOver,
    won,
    statusMessage,
    hintText,

    shakeRowIndex,

    definition,
    definitionSource,

    stats,
    todayKey,
    dailyPlayedToday,
    dailyAlreadyFinished,
    winPercent,
    avgGuessesToWin,

    startDaily,
    startRandom,
    typeLetter,
    backspace,
    submitGuess,
    giveHint,

    cellClass,
    keyClass,
    distWidth,
  }
}
