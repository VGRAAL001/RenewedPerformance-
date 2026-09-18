import { collection, getDocs } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../../firebase'
import { oneOnOneServices } from '../data'

function getNextSevenDayKeys() {
  const today = new Date()
  const dateKeys = []

  for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
    const date = new Date(today)
    date.setDate(today.getDate() + dayOffset)
    dateKeys.push(date.toISOString().slice(0, 10))
  }

  return dateKeys
}

function BookNow() {
  const navigate = useNavigate()
  const [bookingType, setBookingType] = useState('class')
  const [availableClasses, setAvailableClasses] = useState([])
  const [loadingClasses, setLoadingClasses] = useState(true)
  const [classError, setClassError] = useState('')

  useEffect(() => {
    async function loadClasses() {
      try {
        const dateKeys = getNextSevenDayKeys()
        const snapshot = await getDocs(collection(db, 'classes'))
        const classes = snapshot.docs
          .map(document => ({ id: document.id, ...document.data() }))
          .filter(item => dateKeys.includes(item.date))
          .map(item => ({
            ...item,
            dateLabel: new Date(`${item.date}T12:00:00`).toLocaleDateString('en-ZA', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            }),
            availability: Math.max(0, Number(item.capacity || 0) - Number(item.booked || 0)),
          }))
          .sort((first, second) => `${first.date} ${first.time}`.localeCompare(`${second.date} ${second.time}`))
        setAvailableClasses(classes)
      } catch (error) {
        setClassError(error?.code === 'permission-denied'
          ? 'Firestore denied access to classes. Publish the latest firestore.rules in Firebase Console.'
          : 'Classes could not be loaded. Check your Firebase connection and try again.')
      } finally {
        setLoadingClasses(false)
      }
    }

    loadClasses()
  }, [])

  function selectBooking(booking) {
    navigate('/booking-confirmation', { state: { booking } })
  }

  return (
    <div className="page-wrap page-content">
      <div className="page-intro">
        <p className="eyebrow green">Take the first step</p>
        <h2>
          Let’s get
          <br />
          <span>you moving.</span>
        </h2>
        <p className="body-copy">
          Choose a class or a personalised session and continue to confirm your
          booking.
        </p>
      </div>

      <section className="booking-card booking-card-single">
        <div className="booking-card-title">
          <span>01</span>
          <div>
            <p className="eyebrow green">Personal support</p>
            <h3>Choose your booking</h3>
          </div>
        </div>

        <div className="booking-type-switch" role="tablist" aria-label="Booking type">
          <button
            className={bookingType === 'class' ? 'active' : ''}
            type="button"
            role="tab"
            aria-selected={bookingType === 'class'}
            onClick={() => setBookingType('class')}
          >
            Book a class
          </button>
          <button
            className={bookingType === 'oneOnOne' ? 'active' : ''}
            type="button"
            role="tab"
            aria-selected={bookingType === 'oneOnOne'}
            onClick={() => setBookingType('oneOnOne')}
          >
            1-on-1 session
          </button>
        </div>

        <p className="body-copy booking-instruction">
          {bookingType === 'class'
            ? 'Available classes over the next seven days.'
            : 'Choose the personalised session you need.'}
        </p>

        <div className="booking-options">
          {bookingType === 'class'
            ? loadingClasses
              ? <p className="body-copy booking-state">Loading available classes...</p>
              : classError
                ? <p className="auth-error booking-state" role="alert">{classError}</p>
                : availableClasses.length === 0
                  ? <p className="body-copy booking-state">No classes have been added for the next seven days yet.</p>
                  : availableClasses.map(item => (
                <button
                  type="button"
                  className="booking-option"
                  key={item.id}
                  disabled={item.availability === 0}
                  onClick={() => selectBooking({
                    type: 'class',
                    classId: item.id,
                    name: item.className,
                    date: item.dateLabel,
                    dateKey: item.date,
                    time: item.time,
                    availability: item.availability,
                  })}
                >
                  <span>
                    <strong>{item.className}</strong>
                    {item.dateLabel} · {item.time}
                  </span>
                  <b className="booking-availability">{item.availability}/{item.capacity} spots</b>
                </button>
                  ))
            : oneOnOneServices.map(service => (
                <button
                  type="button"
                  className="booking-option"
                  key={service}
                  onClick={() => selectBooking({
                    type: 'oneOnOne',
                    name: service,
                    date: 'To be confirmed',
                    time: 'By arrangement',
                  })}
                >
                  <span>
                    <strong>{service}</strong>
                    Personalised session · By arrangement
                  </span>
                  <b>↗</b>
                </button>
              ))}
        </div>
      </section>
    </div>
  )
}

export default BookNow