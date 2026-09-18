import { collection, getDocs } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { db } from '../../firebase'
import { getAvailableSlots, getNextDateKeys, minutesToTime } from '../utils/scheduling'

function BookingSchedule() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const service = state?.service
  const [classes, setClasses] = useState([])
  const [reservedSlots, setReservedSlots] = useState([])
  const [selectedDate, setSelectedDate] = useState(getNextDateKeys(1)[0])
  const [duration, setDuration] = useState(service?.duration || 30)
  const [injury, setInjury] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadSchedule() {
      try {
        const [classSnapshot, slotSnapshot] = await Promise.all([
          getDocs(collection(db, 'classes')),
          getDocs(collection(db, 'oneOnOneSlots')),
        ])
        setClasses(classSnapshot.docs.map(item => item.data()))
        setReservedSlots(slotSnapshot.docs.map(item => ({ type: 'oneOnOne', duration: 30, ...item.data() })))
      } catch {
        setError('Availability could not be loaded. Check your Firestore rules and try again.')
      } finally {
        setLoading(false)
      }
    }
    if (service) loadSchedule()
    else setLoading(false)
  }, [service])

  if (!service) return <div className="page-wrap page-content booking-empty"><p className="eyebrow green">No session selected</p><h2>Choose a session<br /><span>to continue.</span></h2><Link className="button button-green" to="/book-now">Back to bookings <span>↗</span></Link></div>

  const dates = getNextDateKeys(7)
  const availableSlots = getAvailableSlots({ date: selectedDate, duration, classes, bookings: reservedSlots })
  const allSlots = Array.from({ length: 30 }, (_, index) => minutesToTime(5 * 60 + index * 30)).filter(time => Number(time.slice(0, 2)) * 60 + Number(time.slice(3)) + duration <= 20 * 60)

  function continueToConfirmation(time) {
    if (service.name === 'Injury rehabilitation session' && !injury.trim()) return
    navigate('/booking-confirmation', { state: { booking: { type: 'oneOnOne', name: service.name, date: new Date(`${selectedDate}T12:00:00`).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' }), dateKey: selectedDate, time, duration, injury: injury.trim() } } })
  }

  return <div className="page-wrap page-content"><div className="page-intro"><p className="eyebrow green">Step 1 · Choose your time</p><h2>Schedule your<br /><span>{service.name}.</span></h2><p className="body-copy">Select a day and an available time before confirming your booking.</p></div><section className="booking-card booking-schedule-card"><div className="booking-card-title"><span>01</span><div><p className="eyebrow green">Personal support</p><h3>Choose date and time</h3></div></div>{service.durationOptions.length > 1 && <label className="schedule-field">Session duration<select value={duration} onChange={event => setDuration(Number(event.target.value))}>{service.durationOptions.map(option => <option value={option} key={option}>{option} minutes</option>)}</select></label>}{service.name === 'Injury rehabilitation session' && <label className="schedule-field">What area or injury are we working with?<textarea value={injury} onChange={event => setInjury(event.target.value)} placeholder="For example: left knee pain after running" required /></label>}<p className="eyebrow green">Choose a day</p><div className="date-options">{dates.map(date => <button type="button" className={selectedDate === date ? 'active' : ''} key={date} onClick={() => setSelectedDate(date)}>{new Date(`${date}T12:00:00`).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })}</button>)}</div><p className="eyebrow green">Available times · {duration} minutes</p>{loading ? <p className="body-copy booking-state">Loading availability...</p> : error ? <p className="auth-error booking-state">{error}</p> : <div className="time-options">{allSlots.map(time => { const available = availableSlots.includes(time); return <button type="button" className={available ? '' : 'unavailable'} disabled={!available} key={time} onClick={() => continueToConfirmation(time)}>{time}{!available && <small>Unavailable</small>}</button> })}</div>}</section></div>
}

export default BookingSchedule