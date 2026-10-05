import { collection, getDocs } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { db } from '../../firebase'
import { getAvailableSlots, getNextDateKeys, minutesToTime } from '../utils/scheduling'

function BookingSchedule() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const service = state?.service
  const editingBooking = state?.editingBooking
  const [classes, setClasses] = useState([])
  const [reservedSlots, setReservedSlots] = useState([])
  const [selectedDate, setSelectedDate] = useState(() => getNextDateKeys(7).find(date => ![0, 6].includes(new Date(`${date}T12:00:00`).getDay())) || getNextDateKeys(1)[0])
  const [duration, setDuration] = useState(service?.duration || 30)
  const [injury, setInjury] = useState('')
  const [comments, setComments] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [publicHolidays, setPublicHolidays] = useState([])
  const [blockedDates, setBlockedDates] = useState([])

  useEffect(() => {
    async function loadSchedule() {
      try {
        const [classSnapshot, slotSnapshot, blockedDateSnapshot] = await Promise.all([
          getDocs(collection(db, 'classes')),
          getDocs(collection(db, 'oneOnOneSlots')),
          getDocs(collection(db, 'blockedDates')),
        ])
        setClasses(classSnapshot.docs.map(item => item.data()))
        setReservedSlots(slotSnapshot.docs.map(item => ({ type: 'oneOnOne', duration: 30, ...item.data() })))
        setBlockedDates(blockedDateSnapshot.docs.map(item => item.data().date))
      } catch {
        setError('Availability could not be loaded. Check your Firestore rules and try again.')
      } finally {
        setLoading(false)
      }
    }
    if (service) loadSchedule()
    else setLoading(false)
  }, [service])

  useEffect(() => {
    async function loadPublicHolidays() {
      const years = [...new Set(getNextDateKeys(7).map(date => date.slice(0, 4)))]
      try {
        const holidayResults = await Promise.all(years.map(async year => {
          const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/ZA`)
          if (!response.ok) throw new Error('holiday-api-error')
          return response.json()
        }))
        setPublicHolidays(holidayResults.flat().map(holiday => holiday.date))
      } catch {
        setPublicHolidays([])
      }
    }
    if (service) loadPublicHolidays()
  }, [service])

  if (!service) return <div className="page-wrap page-content booking-empty"><p className="eyebrow green">No session selected</p><h2>Choose a session<br /><span>to continue.</span></h2><Link className="button button-green back-button" to="/book-now">Back to bookings <span>←</span></Link></div>

  const dates = getNextDateKeys(7).filter(date => ![0, 6].includes(new Date(`${date}T12:00:00`).getDay()))
  function isBlockedDate(date) {
    const day = new Date(`${date}T12:00:00`).getDay()
    return day === 0 || day === 6 || publicHolidays.includes(date) || blockedDates.includes(date)
  }

  const selectedDateBlocked = isBlockedDate(selectedDate)
  const availableSlots = selectedDateBlocked ? [] : getAvailableSlots({ date: selectedDate, duration, classes, bookings: reservedSlots })
  const allSlots = Array.from({ length: 30 }, (_, index) => minutesToTime(5 * 60 + index * 30)).filter(time => Number(time.slice(0, 2)) * 60 + Number(time.slice(3)) + duration <= 20 * 60)

  function continueToConfirmation(time) {
    if (service.name === 'Injury rehabilitation session' && !injury.trim()) return
    navigate('/booking-confirmation', { state: { booking: { type: 'oneOnOne', name: service.name, date: new Date(`${selectedDate}T12:00:00`).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' }), dateKey: selectedDate, time, duration, injury: injury.trim(), comments: comments.trim(), editingBooking } } })
  }

  return <div className="page-wrap page-content"><Link className="button button-light page-back" to="/book-now">Back <span>←</span></Link><div className="page-intro"><p className="eyebrow green">Step 1 · Choose your time</p><h2>Schedule your<br /><span>{service.name}.</span></h2><p className="body-copy">Select a day and an available time before confirming your booking.</p></div><section className="booking-card booking-schedule-card"><div className="booking-card-title"><span>01</span><div><p className="eyebrow green">Personal support</p><h3>Choose date and time</h3></div></div>{service.durationOptions.length > 1 && <label className="schedule-field">Session duration<select value={duration} onChange={event => setDuration(Number(event.target.value))}>{service.durationOptions.map(option => <option value={option} key={option}>{option} minutes</option>)}</select></label>}{service.name === 'Injury rehabilitation session' ? <label className="schedule-field">What area or injury are we working with?<textarea value={injury} onChange={event => setInjury(event.target.value)} placeholder="For example: left knee pain after running" required /></label> : <label className="schedule-field">Comments<textarea value={comments} onChange={event => setComments(event.target.value)} placeholder="Anything we should know before your session?" /></label>}<p className="eyebrow green">Choose a day</p><div className="date-options">{dates.map(date => { const blocked = isBlockedDate(date); return <button type="button" className={`${selectedDate === date ? 'active ' : ''}${blocked ? 'unavailable' : ''}`} disabled={blocked} key={date} onClick={() => setSelectedDate(date)}>{new Date(`${date}T12:00:00`).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })}{blocked && <small>{publicHolidays.includes(date) ? 'Public holiday' : blockedDates.includes(date) ? 'Blocked' : 'Closed'}</small>}</button> })}</div><p className="eyebrow green">Available times · {duration} minutes</p>{loading ? <p className="body-copy booking-state">Loading availability...</p> : error ? <p className="auth-error booking-state">{error}</p> : selectedDateBlocked ? <p className="body-copy booking-state">This day is blocked and unavailable for booking.</p> : <div className="time-options">{allSlots.map(time => { const available = availableSlots.includes(time); return <button type="button" className={available ? '' : 'unavailable'} disabled={!available} key={time} onClick={() => continueToConfirmation(time)}>{time}{!available && <small>Unavailable</small>}</button> })}</div>}</section></div>
}

export default BookingSchedule
