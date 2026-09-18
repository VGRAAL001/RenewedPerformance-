import { addDoc, collection, doc, getDocs, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { auth, db } from '../../firebase'
import { plans } from '../data'
import { isAdminUser } from '../utils/admin'

const adminViews = {
  '/admin': 'overview',
  '/admin/classes': 'classes',
  '/admin/pricing': 'pricing',
  '/admin/appointments': 'appointments',
  '/admin/calendar': 'calendar',
}

function Admin() {
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [classes, setClasses] = useState([])
  const [bookings, setBookings] = useState([])
  const [pricing, setPricing] = useState(plans)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const view = adminViews[location.pathname] || 'overview'

  useEffect(() => onAuthStateChanged(auth, setUser), [])

  useEffect(() => {
    if (user && isAdminUser(user)) loadAdminData()
  }, [user])

  async function loadAdminData() {
    try {
      const [classSnapshot, bookingSnapshot, pricingSnapshot] = await Promise.all([
        getDocs(collection(db, 'classes')),
        getDocs(collection(db, 'bookings')),
        getDocs(collection(db, 'plans')),
      ])
      setClasses(classSnapshot.docs.map(item => ({ id: item.id, ...item.data() })).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)))
      setBookings(bookingSnapshot.docs.map(item => ({ id: item.id, ...item.data() })))
      if (!pricingSnapshot.empty) setPricing(pricingSnapshot.docs.map(item => ({ id: item.id, ...item.data() })))
    } catch {
      setError('Admin data could not be loaded. Check that the published rules include admin access.')
    }
  }

  if (!user) return <AdminMessage title="Log in to continue." link="/login" />
  if (!isAdminUser(user)) return <AdminMessage title="This area is for staff only." link="/" />

  return (
    <div className="page-wrap page-content admin-page">
      <div className="page-intro">
        <p className="eyebrow green">Admin workspace</p>
        <h2>Run the<br /><span>practice.</span></h2>
        <p className="body-copy">Manage classes, prices, appointments, and the weekly calendar.</p>
      </div>
      <nav className="admin-nav" aria-label="Admin navigation">
        <AdminLink to="/admin" active={view === 'overview'}>Overview</AdminLink>
        <AdminLink to="/admin/classes" active={view === 'classes'}>Create class</AdminLink>
        <AdminLink to="/admin/pricing" active={view === 'pricing'}>Change prices</AdminLink>
        <AdminLink to="/admin/appointments" active={view === 'appointments'}>Appointments</AdminLink>
        <AdminLink to="/admin/calendar" active={view === 'calendar'}>Calendar</AdminLink>
      </nav>
      {message && <p className="admin-message">{message}</p>}
      {error && <p className="auth-error" role="alert">{error}</p>}
      {view === 'overview' && <Overview classes={classes} bookings={bookings} pricing={pricing} />}
      {view === 'classes' && <ClassManager classes={classes} onSaved={async messageText => { await loadAdminData(); setMessage(messageText) }} onError={setError} />}
      {view === 'pricing' && <PricingManager pricing={pricing} onSaved={async () => { await loadAdminData(); setMessage('Prices updated.') }} />}
      {view === 'appointments' && <AppointmentManager bookings={bookings} onSaved={async () => { await loadAdminData(); setMessage('Appointment updated.') }} />}
      {view === 'calendar' && <CalendarView classes={classes} />}
    </div>
  )
}

function AdminLink({ to, active, children }) {
  return <Link className={active ? 'admin-nav-link active' : 'admin-nav-link'} to={to}>{children}</Link>
}

function AdminMessage({ title, link }) {
  return <div className="page-wrap page-content booking-empty"><p className="eyebrow green">Admin workspace</p><h2>{title}</h2><Link className="button button-green" to={link}>Continue <span>↗</span></Link></div>
}

function Overview({ classes, bookings, pricing }) {
  return <div className="admin-stats"><Stat value={classes.length} label="Classes scheduled" /><Stat value={bookings.filter(item => item.status === 'requested').length} label="Booking requests" /><Stat value={pricing.length} label="Plans" /></div>
}

function Stat({ value, label }) {
  return <article className="admin-stat"><strong>{value}</strong><span>{label}</span></article>
}

function ClassManager({ classes, onSaved, onError }) {
  const [form, setForm] = useState({ className: 'Strength Training', date: '', time: '06:10', capacity: 10, repeatWeekly: false, repeatUntil: '' })
  const [saving, setSaving] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    const dates = []
    const startDate = new Date(`${form.date}T12:00:00`)
    const endDate = form.repeatWeekly ? new Date(`${form.repeatUntil}T12:00:00`) : startDate
    for (const date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 7)) {
      dates.push(date.toISOString().slice(0, 10))
    }
    try {
      await Promise.all(dates.map(date => addDoc(collection(db, 'classes'), {
        className: form.className,
        date,
        time: form.time,
        capacity: Number(form.capacity),
        booked: 0,
        recurrence: form.repeatWeekly ? 'weekly' : 'once',
        recurrenceEnd: form.repeatWeekly ? form.repeatUntil : null,
        createdAt: serverTimestamp(),
      })))
      setForm({ className: 'Strength Training', date: '', time: '06:10', capacity: 10, repeatWeekly: false, repeatUntil: '' })
      onSaved('Class added to the calendar.')
    } catch (error) {
      onError(error?.code === 'permission-denied'
        ? 'Class creation was denied by Firestore. Publish the latest firestore.rules first.'
        : 'Class creation failed. Check your Firebase connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  return <><AdminForm title="Create a class" onSubmit={submit} saving={saving} button={form.repeatWeekly ? 'Add recurring classes' : 'Add class'}><label>Class name<select value={form.className} onChange={event => setForm({ ...form, className: event.target.value })}><option>Strength Training</option><option>Functional Fitness</option><option>Run Fit</option></select></label><label>First date<input type="date" value={form.date} onChange={event => setForm({ ...form, date: event.target.value })} required /></label><label>Time<input type="time" value={form.time} onChange={event => setForm({ ...form, time: event.target.value })} required /></label><label>Capacity<input type="number" min="1" value={form.capacity} onChange={event => setForm({ ...form, capacity: event.target.value })} required /></label><label className="admin-checkbox"><input type="checkbox" checked={form.repeatWeekly} onChange={event => setForm({ ...form, repeatWeekly: event.target.checked })} /> Repeat weekly</label>{form.repeatWeekly && <label>Repeat until<input type="date" min={form.date} value={form.repeatUntil} onChange={event => setForm({ ...form, repeatUntil: event.target.value })} required /></label>}</AdminForm><section className="admin-section admin-existing-classes"><p className="eyebrow green">Existing classes</p>{classes.length === 0 ? <p className="body-copy">No classes have been added yet.</p> : classes.map(item => <ExistingClass key={item.id} item={item} onSaved={onSaved} onError={onError} />)}</section></>
}

function ExistingClass({ item, onSaved, onError }) {
  const [form, setForm] = useState({ className: item.className, date: item.date, time: item.time, capacity: item.capacity, booked: item.booked || 0 })

  async function save(event) {
    event.preventDefault()
    try {
      await updateDoc(doc(db, 'classes', item.id), {
        ...form,
        capacity: Number(form.capacity),
        booked: Number(form.booked),
        updatedAt: serverTimestamp(),
      })
      onSaved('Class updated.')
    } catch (error) {
      onError(error?.code === 'permission-denied' ? 'Class editing was denied by Firestore. Publish the latest firestore.rules first.' : 'Class could not be updated.')
    }
  }

  return <form className="admin-existing-class" onSubmit={save}><select value={form.className} onChange={event => setForm({ ...form, className: event.target.value })}><option>Strength Training</option><option>Functional Fitness</option><option>Run Fit</option></select><input type="date" value={form.date} onChange={event => setForm({ ...form, date: event.target.value })} required /><input type="time" value={form.time} onChange={event => setForm({ ...form, time: event.target.value })} required /><input type="number" min="1" value={form.capacity} onChange={event => setForm({ ...form, capacity: event.target.value })} aria-label="Capacity" required /><input type="number" min="0" max={form.capacity} value={form.booked} onChange={event => setForm({ ...form, booked: event.target.value })} aria-label="Booked spots" required /><button className="button button-green" type="submit">Save changes</button></form>
}

function PricingManager({ pricing, onSaved }) {
  const [items, setItems] = useState(pricing)
  useEffect(() => setItems(pricing), [pricing])

  async function save(event) {
    event.preventDefault()
    await Promise.all(items.map(item => setDoc(doc(db, 'plans', item.id || item.name.toLowerCase().replaceAll(' ', '-')), { ...item, price: item.price, updatedAt: serverTimestamp() })))
    onSaved()
  }

  return <AdminForm title="Change prices" onSubmit={save} button="Save prices">{items.map((item, index) => <label key={item.id || item.name}>{item.name}<input value={item.price} onChange={event => setItems(items.map((current, itemIndex) => itemIndex === index ? { ...current, price: event.target.value } : current))} /></label>)}</AdminForm>
}

function AppointmentManager({ bookings, onSaved }) {
  const [filter, setFilter] = useState('upcoming')

  async function updateStatus(booking, status) {
    await updateDoc(doc(db, 'bookings', booking.id), { status, updatedAt: serverTimestamp() })
    onSaved()
  }

  async function acceptBooking(booking) {
    const invite = createCalendarInvite(booking)
    await updateDoc(doc(db, 'bookings', booking.id), {
      status: 'confirmed',
      calendarInviteStatus: 'pending',
      confirmedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    await addDoc(collection(db, 'mail'), {
      to: booking.customerEmail,
      message: {
        subject: `Booking confirmed: ${booking.name}`,
        text: `Your ${booking.name} booking is confirmed for ${booking.date} at ${booking.time}.`,
        html: `<p>Your <strong>${booking.name}</strong> booking is confirmed for ${booking.date} at ${booking.time}.</p><p>Your calendar invite is attached.</p>`,
        attachments: [{
          filename: `${booking.name.replaceAll(' ', '-')}.ics`,
          contentType: 'text/calendar; charset=UTF-8',
          content: invite,
        }],
      },
    })
    onSaved()
  }

  async function updateTime(booking, event) {
    const form = new FormData(event.currentTarget)
    await updateDoc(doc(db, 'bookings', booking.id), {
      date: form.get('date'),
      time: form.get('time'),
      updatedAt: serverTimestamp(),
    })
    onSaved()
  }

  const today = new Date().toISOString().slice(0, 10)
  const visibleBookings = bookings.filter(booking => {
    if (filter === 'upcoming') return !booking.date || booking.date >= today
    return booking.date && booking.date < today
  })

  return <section className="admin-section"><p className="eyebrow green">Appointments</p><div className="admin-filter"><button className={filter === 'upcoming' ? 'active' : ''} type="button" onClick={() => setFilter('upcoming')}>Upcoming</button><button className={filter === 'past' ? 'active' : ''} type="button" onClick={() => setFilter('past')}>Past</button></div>{visibleBookings.length === 0 ? <p className="body-copy">No {filter} appointments.</p> : visibleBookings.map(booking => <article className="admin-row" key={booking.id}><div><strong>{booking.name}</strong><span>{booking.customerName} · {booking.customerEmail}</span></div><form className="admin-appointment-form" onSubmit={event => updateTime(booking, event)}><input name="date" type="date" defaultValue={booking.dateKey || ''} /><input name="time" type="time" defaultValue={booking.time} /><select value={booking.status || 'requested'} onChange={event => updateStatus(booking, event.target.value)}><option value="requested">Requested</option><option value="confirmed">Confirmed</option><option value="cancelled">Cancelled</option></select>{booking.status !== 'confirmed' && <button className="button button-green" type="button" onClick={() => acceptBooking(booking)}>Accept & email invite</button>}<button className="button button-light" type="submit">Save time</button></form></article>)}</section>
}

function createCalendarInvite(booking) {
  const start = `${(booking.dateKey || booking.date).replaceAll('-', '')}T${booking.time.replace(':', '')}00`
  const endHour = String(Number(booking.time.slice(0, 2)) + 1).padStart(2, '0')
  const end = `${(booking.dateKey || booking.date).replaceAll('-', '')}T${endHour}${booking.time.slice(3)}00`
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Renewed Performance//Booking//EN',
    'BEGIN:VEVENT',
    `UID:${booking.id}@renewedperformance`,
    `DTSTART;TZID=Africa/Johannesburg:${start}`,
    `DTEND;TZID=Africa/Johannesburg:${end}`,
    `SUMMARY:${booking.name}`,
    'LOCATION:94 Strand St, Cape Town City Centre',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  return btoa(unescape(encodeURIComponent(ics)))
}

function CalendarView({ classes }) {
  return <section className="admin-section"><p className="eyebrow green">Calendar</p><div className="admin-calendar">{classes.length === 0 ? <p className="body-copy">No classes scheduled.</p> : classes.map(item => <article key={item.id}><span>{item.date}</span><strong>{item.className}</strong><small>{item.time} · {Math.max(0, item.capacity - item.booked)}/{item.capacity} spots</small></article>)}</div></section>
}

function AdminForm({ title, children, onSubmit, saving, button }) {
  return <form className="admin-form" onSubmit={onSubmit}><p className="eyebrow green">Admin tools</p><h3>{title}</h3>{children}<button className="button button-green" type="submit" disabled={saving}>{saving ? 'Saving...' : button} <span>↗</span></button></form>
}

export default Admin
