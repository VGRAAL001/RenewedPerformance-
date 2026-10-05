import { onAuthStateChanged } from 'firebase/auth'
import { collection, doc, getDocs, getDoc, query, runTransaction, serverTimestamp, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { auth, db } from '../../firebase'
import { oneOnOneOptions, plans } from '../data'
import { isAdminUser } from '../utils/admin'

function Profile() {
  const [user, setUser] = useState(null)
  const [profileData, setProfileData] = useState({ sessionsAvailable: 0, oneOnOneSessions: 0, membershipPlan: 'No plan yet', subscription: null })
  const [bookings, setBookings] = useState([])
  const [bookingError, setBookingError] = useState('')
  const [currentTime] = useState(() => Date.now())

  useEffect(() => onAuthStateChanged(auth, currentUser => {
    setUser(currentUser)
    if (currentUser) Promise.allSettled([
      getDoc(doc(db, 'users', currentUser.uid)),
      getDocs(query(collection(db, 'bookings'), where('userId', '==', currentUser.uid))),
      getDocs(query(collection(db, 'bookings'), where('customerEmail', '==', currentUser.email))),
    ]).then(([profileResult, userBookingResult, emailBookingResult]) => {
      if (profileResult.status === 'fulfilled' && profileResult.value.exists()) setProfileData(data => ({ ...data, ...profileResult.value.data() }))
      const userBookings = userBookingResult.status === 'fulfilled' ? userBookingResult.value.docs : []
      const emailBookings = emailBookingResult.status === 'fulfilled' ? emailBookingResult.value.docs : []
      const bookingsById = new Map([...userBookings, ...emailBookings].map(item => [item.id, { id: item.id, ...item.data() }]))
      setBookings([...bookingsById.values()].filter(item => item.status !== 'cancelled').sort((first, second) => `${first.dateKey || ''} ${first.time || ''}`.localeCompare(`${second.dateKey || ''} ${second.time || ''}`)))
    }).catch(() => {})
  }), [])

  function canEditBooking(booking) {
    return new Date(`${booking.dateKey}T${booking.time || '00:00'}:00`).getTime() - currentTime >= 24 * 60 * 60 * 1000
  }

  async function cancelBooking(booking) {
    setBookingError('')
    const bookingDate = new Date(`${booking.dateKey}T${booking.time || '00:00'}:00`)
    if (booking.type !== 'class' && bookingDate.getTime() - currentTime < 24 * 60 * 60 * 1000) {
      setBookingError('One-on-one sessions can only be cancelled 24 hours before the appointment.')
      return
    }
    try {
      await runTransaction(db, async transaction => {
        const bookingReference = doc(db, 'bookings', booking.id)
        if (booking.type === 'class') {
          const classReference = doc(db, 'classes', booking.classId)
          const userReference = doc(db, 'users', user.uid)
          const [classSnapshot, userSnapshot] = await Promise.all([transaction.get(classReference), transaction.get(userReference)])
          const classData = classSnapshot.exists() ? classSnapshot.data() : {}
          const userData = userSnapshot.exists() ? userSnapshot.data() : {}
          transaction.update(bookingReference, { status: 'cancelled', cancelledAt: serverTimestamp(), updatedAt: serverTimestamp() })
          transaction.update(classReference, { booked: Math.max(0, Number(classData.booked || 0) - 1), updatedAt: serverTimestamp() })
          transaction.set(userReference, { sessionsAvailable: Number(userData.sessionsAvailable || 0) + 1, updatedAt: serverTimestamp() }, { merge: true })
        } else if (booking.dateKey && booking.time) {
          transaction.update(bookingReference, { status: 'cancelled', cancelledAt: serverTimestamp(), updatedAt: serverTimestamp() })
          const startMinutes = Number(booking.time.slice(0, 2)) * 60 + Number(booking.time.slice(3))
          const slotCount = Math.ceil(Number(booking.duration || 30) / 30)
          for (let index = 0; index < slotCount; index += 1) {
            const totalMinutes = startMinutes + index * 30
            const time = `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`
            transaction.delete(doc(db, 'oneOnOneSlots', `${booking.dateKey}_${time.replace(':', '')}`))
          }
        }
      })
      setBookings(currentBookings => currentBookings.filter(item => item.id !== booking.id))
      if (booking.type === 'class') setProfileData(data => ({ ...data, sessionsAvailable: Number(data.sessionsAvailable || 0) + 1 }))
    } catch {
      setBookingError('We could not cancel this booking. Please try again.')
    }
  }

  if (!user) {
    return (
      <div className="page-wrap page-content booking-empty">
        <p className="eyebrow green">Member profile</p>
        <h2>
          Log in to see
          <br />
          <span>your profile.</span>
        </h2>
        <Link className="button button-green" to="/login">Log in <span>↗</span></Link>
      </div>
    )
  }

  const name = user.displayName || user.email?.split('@')[0] || 'Member'
  const initials = (user.displayName || user.email || 'AM').slice(0, 2).toUpperCase()

  return (
    <div className="page-wrap page-content">
      <div className="page-intro">
        <p className="eyebrow green">Member profile</p>
        <h2>
          Welcome,
          <br />
          <span>{name}.</span>
        </h2>
        <p className="body-copy">Your details and Renewed Performance membership at a glance.</p>
      </div>

      <div className="profile-page-grid">
        <section className="profile-page-card profile-page-identity">
          <span className="profile-avatar profile-avatar-large">{initials}</span>
          <p className="eyebrow green">Your account</p>
          <h3>{name}</h3>
          <p>{user.email}</p>
        </section>
        <section className="profile-page-card">
          <p className="eyebrow green">Membership</p>
          <div className="profile-page-stat"><strong>{profileData.membershipPlan || 'No plan yet'}</strong><span>current plan</span></div>
          <div className="profile-page-stat"><strong>{profileData.sessionsAvailable || 0}</strong><span>class sessions available</span></div>
          <div className="profile-page-stat"><strong>{profileData.oneOnOneSessions || 0}</strong><span>one-on-one sessions available</span></div>
          {profileData.subscription?.status === 'active' && <div className="profile-page-stat"><strong>Monthly</strong><span>next renewal {profileData.subscription.nextBillingDate}</span></div>}
          <Link className="button button-green" to="/book-now">Book a session <span>↗</span></Link>
          <Link className="button button-light buy-sessions-link" to="/payment" state={{ plan: plans[0] }}>Buy more sessions <span>↗</span></Link>
          {isAdminUser(user) && <Link className="button button-light profile-admin-link" to="/admin">Open admin workspace <span>↗</span></Link>}
        </section>
      </div>
      <section className="profile-bookings">
        <p className="eyebrow green">Your bookings</p>
        {bookingError && <p className="auth-error" role="alert">{bookingError}</p>}
        {bookings.length === 0 ? <p className="body-copy">No upcoming bookings.</p> : bookings.map(booking => <article className="profile-booking" key={booking.id}><div><strong>{booking.name}</strong><span>{booking.date} · {booking.time}</span><small>{booking.type === 'oneOnOne' ? 'One-on-one · pay in person' : 'Class · paid with session balance'}</small></div><div className="profile-booking-actions">{canEditBooking(booking) && <Link className="button button-light" to={booking.type === 'oneOnOne' ? '/booking-schedule' : '/book-now'} state={booking.type === 'oneOnOne' ? { service: oneOnOneOptions.find(option => option.name === booking.name) || oneOnOneOptions[0], editingBooking: booking } : { editingBooking: booking }}>Edit booking</Link>}<button className="button button-light" type="button" onClick={() => cancelBooking(booking)}>Cancel booking</button>{booking.type !== 'class' && <small>Changes available until 24 hours before</small>}</div></article>)}
      </section>
    </div>
  )
}

export default Profile
