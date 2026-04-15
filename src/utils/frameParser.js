export function parseBlockFrame(blockValue) {
  if (blockValue === null || blockValue === undefined || blockValue === '') return null

  let cleaned = blockValue.toString().trim()

  // Handle ranges (e.g. "-13~-14") → take worst (most negative)
  if (cleaned.includes('~')) {
    const parts = cleaned.split('~')
    const nums = parts.map(p => parseInt(p.replace(/[^0-9-]/g, ''))).filter(n => !isNaN(n))
    if (nums.length === 0) return null
    cleaned = Math.min(...nums).toString()
  }

  // Extract the number (handle annotations like "-12a", "-13s")
  const num = parseInt(cleaned.replace(/[^0-9-]/g, ''))

  if (isNaN(num)) return null

  if (num >= -9) return 'safe'
  if (num === -10) return '-10'
  if (num === -11) return '-11'
  if (num === -12) return '-12'
  if (num === -13) return '-13'
  if (num === -14) return '-14'
  if (num <= -15) return '-15+'

  return 'safe'
}

export function parseThrowBreak(notes) {
  if (!notes) return null

  // Format A: "Cannot throw break" → incassable
  if (/cannot throw break/i.test(notes)) return 'none'

  // Format B: "Throw break: X" ou "Throw break X" (avec ou sans deux-points)
  const throwBreakVal = notes.match(/throw break:?\s*(1\+2|1\s*or\s*2|none|1|2)/i)
  if (throwBreakVal) {
    const val = throwBreakVal[1].trim().toLowerCase()
    if (val === 'none') return 'none'
    if (val === '1+2') return '1+2'
    if (val.includes('or')) return '1or2'
    if (val === '1') return '1'
    if (val === '2') return '2'
  }

  // Format C: "1+2 throw break" / "1 or 2 throw break" / "1 throw break" / "2 throw break"
  const beforeBreak = notes.match(/(1\+2|1\s*or\s*2|1|2)\s*throw break/i)
  if (beforeBreak) {
    const val = beforeBreak[1].trim().toLowerCase()
    if (val === '1+2') return '1+2'
    if (val.includes('or')) return '1or2'
    if (val === '1') return '1'
    if (val === '2') return '2'
  }

  return null
}

export function isThrowBreakCorrect(userAnswer, correctAnswer) {
  if (correctAnswer === '1or2') return ['1', '2', '1or2'].includes(userAnswer)
  return userAnswer === correctAnswer
}

export function parseFrameNum(val) {
  if (!val || val === '' || val === 'N/A') return null
  const s = val.toString().trim()
  if (/^(KND|knd|Launch|launch|LNC)/i.test(s)) return 999
  const n = parseInt(s.replace(/[^0-9-]/g, ''))
  return isNaN(n) ? null : n
}

export const ANSWER_OPTIONS = [
  { id: 'safe', label: 'Safe', key: '1', colorClass: 'answer-safe' },
  { id: '-10', label: '-10', key: '2', colorClass: 'answer-minus10' },
  { id: '-11', label: '-11', key: '3', colorClass: 'answer-minus11' },
  { id: '-12', label: '-12', key: '4', colorClass: 'answer-minus12' },
  { id: '-13', label: '-13', key: '5', colorClass: 'answer-minus13' },
  { id: '-14', label: '-14', key: '6', colorClass: 'answer-minus14' },
  { id: '-15+', label: '-15+', key: '7', colorClass: 'answer-minus15' },
]
