import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeBaseUrl } from '../app/composables/usePotionLedgerRun'

test('normalizeBaseUrl removes a trailing slash', () => {
  assert.equal(normalizeBaseUrl('http://localhost:5000/'), 'http://localhost:5000')
})

test('normalizeBaseUrl leaves urls without a trailing slash unchanged', () => {
  assert.equal(normalizeBaseUrl('https://example.com/api'), 'https://example.com/api')
})
