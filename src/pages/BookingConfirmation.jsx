import { onAuthStateChanged } from 'firebase/auth'
import { collection, doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { auth, db } from '../../firebase'

function BookingConfirmation() {
  const { state } = useLocation()
  const booking = state?.booking
  const [user, setUser] = useState(null)
  const [confirmed, setConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [sessionsAvailable, setSessionsAvailable] = useState(0)
  const [details, setDetails] = useState({ name: '', email: '', phone: '' })

  useEffect(() => onAuthStateChanged(auth, currentUser => {
    setUser(currentUser)
    if (currentUser) {
      setDetails(currentDetails => ({
        ...currentDetails,
        name: currentUser.displayName || '',
        email: currentUser.email || '',
      }))
      getDoc(doc(db, 'users', currentUser.uid)).then(snapshot => {
        setSessionsAvailable(snapshot.exists() ? Number(snapshot.data().sessionsAvailable || 0) : 0)
      }).catch(() => {})
    }
  }), [])

  function handleChange(event) {
    setDetails({ ...details, [event.target.name]: event.target.value })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const bookingData = {
        ...booking,
        userId: user?.uid || null,
        customerName: details.name,
        customerEmail: details.email,
        customerPhone: details.phone,
        status: 'confirmed',
        paymentMethod: booking.type === 'oneOnOne' ? 'in-person' : 'class-session-balance',
        createdAt: serverTimestamp(),
      }

      if (booking.type === 'class') {
        if (!user) throw new Error('class-login-required')
        await runTransaction(db, async transaction => {
          const classReference = doc(db, 'classes', booking.classId)
          const userReference = doc(db, 'users', user.uid)
          const classSnapshot = await transaction.get(classReference)
          const userSnapshot = await transaction.get(userReference)
          const oldClassReference = booking.editingBooking ? doc(db, 'classes', booking.editingBooking.classId) : null
          const oldClassSnapshot = oldClassReference && booking.editingBooking.classId !== booking.classId ? await transaction.get(oldClassReference) : null
          if (!classSnapshot.exists()) throw new Error('class-not-found')
          const classData = classSnapshot.data()
          const userData = userSnapshot.exists() ? userSnapshot.data() : {}
          const availableSessions = Number(userData.sessionsAvailable || 0)
          const availableSpots = Number(classData.capacity || 0) - Number(classData.booked || 0)
          if (availableSpots < 1) throw new Error('class-full')
          const bookingReference = booking.editingBooking ? doc(db, 'bookings', booking.editingBooking.id) : doc(collection(db, 'bookings'))
          if (booking.editingBooking) {
            if (oldClassReference && oldClassSnapshot?.exists()) {
              transaction.update(oldClassReference, { booked: Math.max(0, Number(oldClassSnapshot.data().booked || 0) - 1), updatedAt: serverTimestamp() })
              transaction.update(classReference, { booked: Number(classData.booked || 0) + 1, updatedAt: serverTimestamp() })
            }
            transaction.update(bookingReference, { ...bookingData, editingBooking: null, updatedAt: serverTimestamp() })
          } else {
            if (availableSessions < 1) throw new Error('no-sessions')
            transaction.update(classReference, { booked: Number(classData.booked || 0) + 1, updatedAt: serverTimestamp() })
            transaction.set(userReference, { sessionsAvailable: availableSessions - 1, updatedAt: serverTimestamp() }, { merge: true })
            transaction.set(bookingReference, bookingData)
          }
        })
      } else {
        if (!user) throw new Error('one-on-one-login-required')
        await runTransaction(db, async transaction => {
          const slotTimes = Array.from({ length: Math.ceil(Number(booking.duration || 30) / 30) }, (_, index) => {
            const totalMinutes = Number(booking.time.slice(0, 2)) * 60 + Number(booking.time.slice(3)) + index * 30
            return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`
          })
          const slotReferences = slotTimes.map(time => doc(db, 'oneOnOneSlots', `${booking.dateKey}_${time.replace(':', '')}`))
          const slotSnapshots = await Promise.all(slotReferences.map(reference => transaction.get(reference)))
          const oldBooking = booking.editingBooking
          const oldSlotTimes = oldBooking ? Array.from({ length: Math.ceil(Number(oldBooking.duration || 30) / 30) }, (_, index) => {
            const totalMinutes = Number(oldBooking.time.slice(0, 2)) * 60 + Number(oldBooking.time.slice(3)) + index * 30
            return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`
          }) : []
          const oldSlotReferences = oldBooking ? oldSlotTimes.map(time => doc(db, 'oneOnOneSlots', `${oldBooking.dateKey}_${time.replace(':', '')}`)) : []
          if (slotSnapshots.some((snapshot, index) => snapshot.exists() && !oldSlotReferences.some(reference => reference.path === slotReferences[index].path))) throw new Error('one-on-one-slot-taken')
          const bookingReference = oldBooking ? doc(db, 'bookings', oldBooking.id) : doc(collection(db, 'bookings'))
          oldSlotReferences.forEach(reference => transaction.delete(reference))
          transaction.set(bookingReference, { ...bookingData, editingBooking: null }, { merge: Boolean(oldBooking) })
          slotReferences.forEach((reference, index) => transaction.set(reference, {
            dateKey: booking.dateKey,
            time: slotTimes[index],
            status: 'reserved',
            createdAt: serverTimestamp(),
          }))
        })
      }
      setConfirmed(true)
    } catch (error) {
      if (error.message === 'class-login-required') {
        setError('Please log in before booking a class so we can reserve your spot.')
      } else if (error.message === 'class-full') {
        setError('This class has just filled up. Please choose another class.')
      } else if (error.message === 'no-sessions') {
        setError('You do not have any sessions available. Purchase more sessions before booking a class.')
      } else if (error.message === 'one-on-one-login-required') {
        setError('Please log in before booking a one-on-one session so we can reserve the time.')
      } else if (error.message === 'one-on-one-slot-taken') {
        setError('That time has just been booked. Please choose another available slot.')
      } else if (error.code === 'permission-denied') {
        setError('Booking was denied by Firestore. Please publish the latest firestore.rules.')
      } else {
        setError('We could not save your booking. Please check your connection and try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (!booking) {
    return (
      <div className="page-wrap page-content booking-empty">
        <p className="eyebrow green">No booking selected</p>
        <h2>
          Choose a session
          <br />
          <span>to continue.</span>
        </h2>
        <Link className="button button-green" to="/book-now">Back to bookings <span>↗</span></Link>
      </div>
    )
  }

  return (
    <div className="page-wrap page-content">
      <div className="page-intro">
        <p className="eyebrow green">Almost there</p>
        <h2>
          Confirm your
          <br />
          <span>booking.</span>
        </h2>
        <p className="body-copy">
          {user ? 'Your member details have been added below.' : 'Add your details so Berucia can confirm your booking.'}
        </p>
      </div>

      <div className="booking-card-title confirmation-step-title">
        <span>02</span>
        <div>
          <p className="eyebrow green">Personal support</p>
          <h3>Confirm your booking</h3>
        </div>
      </div>

      {confirmed ? (
        <section className="booking-confirmed">
          <p className="eyebrow green">Booking confirmed</p>
          <h3>You’re on your way.</h3>
          <p className="body-copy">{booking.type === 'oneOnOne' ? 'Payment is made in person at your one-on-one session.' : 'Your class session has been deducted from your account balance.'}</p>
          <Link className="button button-green" to="/">Return home <span>↗</span></Link>
        </section>
      ) : (
        <div className="confirmation-grid">
          <section className="booking-summary">
            <p className="eyebrow green">Your selection</p>
            <h3>{booking.name}</h3>
            <p>{booking.date}</p>
            <p>{booking.time}</p>
            {booking.availability && <p>{booking.availability}/10 spots remaining</p>}
            {user && booking.type === 'class' && <p>{sessionsAvailable} class sessions available on your account</p>}
            {booking.type === 'oneOnOne' && <p>Payment is made in person.</p>}
          </section>

          <form className="confirmation-form" onSubmit={handleSubmit}>
            <p className="eyebrow green">Your details</p>
            <label>
              Full name
              <input name="name" value={details.name} onChange={handleChange} required />
            </label>
            <label>
              Email address
              <input name="email" type="email" value={details.email} onChange={handleChange} required />
            </label>
            <label>
              Phone number
              <input name="phone" type="tel" value={details.phone} onChange={handleChange} required />
            </label>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="button button-green" type="submit" disabled={submitting}>
              {submitting ? 'Saving booking...' : 'Confirm booking'} <span>↗</span>
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

export default BookingConfirmation
