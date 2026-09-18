export const DAY_START = 5 * 60
export const DAY_END = 20 * 60

export function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function minutesToTime(minutes) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

export function roundToQuarterHour(minutes) {
  return Math.round(minutes / 15) * 15
}

export function rangesOverlap(firstStart, firstEnd, secondStart, secondEnd) {
  return firstStart < secondEnd && secondStart < firstEnd
}

export function getNextDateKeys(days = 7) {
  return getWeekDateKeys(0, days)
}

export function getWeekDateKeys(weekOffset = 0, days = 7) {
  const today = new Date()
  return Array.from({ length: days }, (_, offset) => {
    const date = new Date(today)
    date.setDate(today.getDate() + weekOffset * 7 + offset)
    return date.toISOString().slice(0, 10)
  })
}

export function classRange(item) {
  const start = roundToQuarterHour(timeToMinutes(item.time))
  const duration = Number(item.duration || 60)
  return { start: start - 15, end: start + duration + 15 }
}

export function getClassConflicts(classes, date) {
  return classes
    .filter(item => item.date === date)
    .map(item => classRange(item))
}

export function getBookedOneOnOneConflicts(bookings, date) {
  return bookings
    .filter(item => item.type === 'oneOnOne' && item.dateKey === date && item.status !== 'cancelled')
    .map(item => ({ start: timeToMinutes(item.time), end: timeToMinutes(item.time) + Number(item.duration || 30) }))
}

export function getAvailableSlots({ date, duration, classes, bookings }) {
  const conflicts = [...getClassConflicts(classes, date), ...getBookedOneOnOneConflicts(bookings, date)]
  return Array.from({ length: (DAY_END - DAY_START) / 30 }, (_, index) => DAY_START + index * 30)
    .filter(start => start + duration <= DAY_END)
    .filter(start => !conflicts.some(conflict => rangesOverlap(start, start + duration, conflict.start, conflict.end)))
    .map(minutesToTime)
}