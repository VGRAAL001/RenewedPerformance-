import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp } from 'firebase/firestore'
import { FiX } from 'react-icons/fi'
import { useEffect, useState } from 'react'
import { db } from '../../firebase'
import { classRange, getWeekDateKeys, minutesToTime, timeToMinutes } from '../utils/scheduling'

function AdminCalendarView({ classes, bookings }) {
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [blockedDates, setBlockedDates] = useState([])
  const [blockDate, setBlockDate] = useState('')
  const [blockReason, setBlockReason] = useState('')
  const [blockError, setBlockError] = useState('')
  const dates = getWeekDateKeys(weekOffset)
  const slots = Array.from({ length: 30 }, (_, index) => 5 * 60 + index * 30)
  const firstDate = new Date(`${dates[0]}T12:00:00`)
  const lastDate = new Date(`${dates[dates.length - 1]}T12:00:00`)
  const weekLabel = `${firstDate.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })} - ${lastDate.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}`

  useEffect(() => {
    getDocs(collection(db, 'blockedDates')).then(snapshot => setBlockedDates(snapshot.docs.map(item => ({ id: item.id, ...item.data() })).sort((first, second) => first.date.localeCompare(second.date)))).catch(error => setBlockError(error?.code === 'permission-denied' ? 'Blocked dates are unavailable until the latest Firestore rules are deployed.' : 'Blocked dates could not be loaded.'))
  }, [])

  async function addBlockedDate(event) {
    event.preventDefault()
    if (!blockDate) return
    if (blockedDates.some(item => item.date === blockDate)) {
      setBlockError('That date is already blocked.')
      return
    }
    try {
      const reference = await addDoc(collection(db, 'blockedDates'), { date: blockDate, reason: blockReason.trim(), createdAt: serverTimestamp() })
      setBlockedDates(current => [...current, { id: reference.id, date: blockDate, reason: blockReason.trim() }].sort((first, second) => first.date.localeCompare(second.date)))
      setBlockDate('')
      setBlockReason('')
      setBlockError('')
    } catch {
      setBlockError('The date could not be blocked.')
    }
  }

  async function removeBlockedDate(blockedDate) {
    if (!window.confirm(`Remove the blocked date ${blockedDate.date}?`)) return
    try {
      await deleteDoc(doc(db, 'blockedDates', blockedDate.id))
      setBlockedDates(current => current.filter(item => item.id !== blockedDate.id))
    } catch {
      setBlockError('The blocked date could not be removed.')
    }
  }

  function cellContent(date, slot) {
    const classItem = classes.find(item => {
      if (item.date !== date) return false
      const range = classRange(item)
      return slot >= range.start && slot < range.end
    })
    if (classItem) {
      const attendees = bookings.filter(item => item.type === 'class' && item.classId === classItem.id && item.status !== 'cancelled')
      return { label: slot === classRange(classItem).start + 15 ? classItem.className : '', type: 'class', item: classItem, attendees }
    }
    const booking = bookings.find(item => {
      if (item.type !== 'oneOnOne' || item.dateKey !== date || item.status === 'cancelled') return false
      const start = timeToMinutes(item.time)
      return slot >= start && slot < start + Number(item.duration || 30)
    })
    return booking ? { label: slot === timeToMinutes(booking.time) ? booking.name : '', type: 'booking', item: booking } : null
  }

  return <section className="admin-section"><div className="calendar-heading"><div><p className="eyebrow green">Calendar · 05:00 to 20:00</p><strong>{weekLabel}</strong></div><div className="calendar-week-controls"><button type="button" onClick={() => setWeekOffset(weekOffset - 1)} aria-label="Previous week">←</button><button type="button" onClick={() => setWeekOffset(0)}>This week</button><button type="button" onClick={() => setWeekOffset(weekOffset + 1)} aria-label="Next week">→</button></div></div><form className="calendar-block-form" onSubmit={addBlockedDate}><label>Block date<input type="date" value={blockDate} onChange={event => setBlockDate(event.target.value)} required /></label><label>Reason<input value={blockReason} onChange={event => setBlockReason(event.target.value)} placeholder="Staff leave, maintenance..." /></label><button className="button button-green" type="submit">Block day</button></form>{blockError && <p className="auth-error" role="alert">{blockError}</p>}{blockedDates.length > 0 && <div className="calendar-blocked-list"><p className="eyebrow green">Blocked days</p>{blockedDates.map(item => <div key={item.id}><span>{item.date}{item.reason && ` · ${item.reason}`}</span><button type="button" onClick={() => removeBlockedDate(item)}>Remove</button></div>)}</div>}<div className="admin-calendar-grid"><div className="calendar-time-heading">Time</div>{dates.map(date => <div className={`calendar-day-heading${blockedDates.some(item => item.date === date) ? ' blocked' : ''}`} key={date}>{new Date(`${date}T12:00:00`).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric' })}</div>)}{slots.map(slot => <div className="calendar-grid-row" key={`row-${slot}`}><div className="calendar-time">{minutesToTime(slot)}</div>{dates.map(date => { const content = cellContent(date, slot); const blocked = blockedDates.some(item => item.date === date); return content ? <button type="button" className={`calendar-slot ${content.type}`} key={`${date}-${slot}`} onClick={() => setSelectedEvent(content)} aria-label={`View ${content.label || content.item.name || content.item.className} details`}>{content.label}</button> : <div className={`calendar-slot${blocked ? ' blocked-date' : ''}`} key={`${date}-${slot}`}>{blocked && 'Closed'}</div> })}</div>)}</div>{selectedEvent && <EventSummary event={selectedEvent} onClose={() => setSelectedEvent(null)} />}</section>
}

function EventSummary({ event, onClose }) {
  const item = event.item
  const isClass = event.type === 'class'
  const attendees = event.attendees || []
  const content = isClass ? <><p className="calendar-event-label">Signed up ({attendees.length})</p>{attendees.length === 0 ? <p className="body-copy">No members have signed up.</p> : <div className="calendar-attendees">{attendees.map(attendee => <div key={attendee.id}><strong>{attendee.customerName || 'Member'}</strong><span>{attendee.customerEmail || 'No email provided'}</span><small>{attendee.customerPhone || 'No phone provided'}</small></div>)}</div>}</> : <><p className="calendar-event-label">Member</p><p>{item.customerName || 'No name provided'}</p><p>{item.customerEmail || 'No email provided'}</p><p>{item.customerPhone || 'No phone provided'}</p><p className="calendar-event-label">Comments</p><p className="calendar-event-comments">{item.injury || item.comments || item.notes || 'No comments provided.'}</p></>
  return <div className="calendar-event-overlay" role="presentation" onClick={onClose}><section className="calendar-event-summary" role="dialog" aria-modal="true" aria-labelledby="calendar-event-title" onClick={eventClick => eventClick.stopPropagation()}><button className="icon-button calendar-event-close" type="button" onClick={onClose} aria-label="Close event summary" title="Close event summary"><FiX /></button><p className="eyebrow green">{isClass ? 'Class sign-ups' : 'One-on-one appointment'}</p><h3 id="calendar-event-title">{isClass ? item.className : item.name}</h3><p className="calendar-event-meta">{item.date || item.dateKey} · {item.time}{item.duration ? ` · ${item.duration} minutes` : ''}</p>{content}</section></div>
}

export default AdminCalendarView
