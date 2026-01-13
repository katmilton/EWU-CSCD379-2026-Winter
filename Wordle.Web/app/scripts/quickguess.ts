export function checkGuess(input: string) {
  const secret = 'CSCD379'
  return input.toUpperCase() === secret ? 'Correct!' : 'Try again'
}
