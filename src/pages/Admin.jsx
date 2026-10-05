import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { FiEdit2, FiPlus, FiTrash2, FiX } from 'react-icons/fi'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { auth, db } from '../../firebase'
import { specialDeals } from '../data'
import { isAdminUser } from '../utils/admin'
import { classRange, getWeekDateKeys, minutesToTime, timeToMinutes } from '../utils/scheduling'
import AdminCalendarView from '../components/AdminCalendarView'
import ProgramManager from '../components/ProgramManager'

const adminViews = {
  '/admin': 'overview',
  '/admin/classes': 'classes',
  '/admin/specials': 'specials',
  '/admin/programs': 'programs',
  '/admin/appointments': 'appointments',
  '/admin/calendar': 'calendar',
}

function confirmDestructiveAction(message) {
  return window.confirm(message)
}

function hasText(...values) {
  return values.every(value => String(value || '').trim().length > 0)
}

function Admin() {
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [classes, setClasses] = useState([])
  const [bookings, setBookings] = useState([])
  const [specials, setSpecials] = useState(specialDeals)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const view = adminViews[location.pathname] || 'overview'

  useEffect(() => onAuthStateChanged(auth, setUser), [])

  useEffect(() => {
    if (user && isAdminUser(user)) loadAdminData()
  }, [user])

  async function loadAdminData() {
    try {
      const [classSnapshot, bookingSnapshot, specialsSnapshot] = await Promise.all([
        getDocs(collection(db, 'classes')),
        getDocs(collection(db, 'bookings')),
        getDocs(collection(db, 'specials')),
      ])
      setClasses(classSnapshot.docs.map(item => ({ id: item.id, ...item.data() })).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)))
      setBookings(bookingSnapshot.docs.map(item => ({ id: item.id, ...item.data() })))
      setSpecials(specialsSnapshot.empty ? specialDeals : specialsSnapshot.docs.map(item => ({ id: item.id, ...item.data() })))
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
        <AdminLink to="/admin/classes" active={view === 'classes'}>Classes</AdminLink>
        <AdminLink to="/admin/appointments" active={view === 'appointments'}>Bookings</AdminLink>
        <AdminLink to="/admin/specials" active={view === 'specials'}>Specials</AdminLink>
        <AdminLink to="/admin/programs" active={view === 'programs'}>Programs</AdminLink>
        <AdminLink to="/admin/calendar" active={view === 'calendar'}>Calendar</AdminLink>
      </nav>
      {message && <p className="admin-message">{message}</p>}
      {error && <p className="auth-error" role="alert">{error}</p>}
      {view === 'overview' && <Overview classes={classes} bookings={bookings} specials={specials} />}
      {view === 'classes' && <ClassManager classes={classes} onSaved={async messageText => { await loadAdminData(); setMessage(messageText) }} onError={setError} />}
      {view === 'appointments' && <AppointmentManager bookings={bookings} onSaved={async () => { await loadAdminData(); setMessage('Appointment updated.') }} />}
      {view === 'specials' && <SpecialManager specials={specials} onSaved={async messageText => { await loadAdminData(); setMessage(messageText) }} onError={setError} />}
      {view === 'programs' && <ProgramManager onSaved={setMessage} onError={setError} />}
      {view === 'calendar' && <AdminCalendarView classes={classes} bookings={bookings} />}
    </div>
  )
}

function AdminLink({ to, active, children }) {
  return <Link className={active ? 'admin-nav-link active' : 'admin-nav-link'} to={to}>{children}</Link>
}

function AdminMessage({ title, link }) {
  return <div className="page-wrap page-content booking-empty"><p className="eyebrow green">Admin workspace</p><h2>{title}</h2><Link className="button button-green" to={link}>Continue <span>↗</span></Link></div>
}

function Overview({ classes, bookings, specials }) {
  return <div className="admin-stats"><Link className="admin-stat" to="/admin/classes"><strong>{classes.length}</strong><span>Classes scheduled</span><em>View classes ↗</em></Link><Link className="admin-stat" to="/admin/appointments"><strong>{bookings.filter(item => item.status !== 'cancelled').length}</strong><span>Bookings scheduled</span><em>View bookings ↗</em></Link><Link className="admin-stat" to="/admin/specials"><strong>{specials.length}</strong><span>Specials</span><em>Manage specials ↗</em></Link></div>
}

function ClassManager({ classes, onSaved, onError }) {
  const [form, setForm] = useState({ className: 'Strength Training', date: '', time: '06:10', capacity: 10, repeatWeekly: false, repeatUntil: '' })
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  async function submit(event) {
    event.preventDefault()
    if (!hasText(form.className, form.date, form.time) || Number(form.capacity) < 1 || (form.repeatWeekly && !form.repeatUntil)) {
      onError('Enter a valid class name, date, time, capacity, and repeat end date.')
      return
    }
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
      setShowForm(false)
      onSaved('Class added to the calendar.')
    } catch (error) {
      onError(error?.code === 'permission-denied'
        ? 'Class creation was denied by Firestore. Publish the latest firestore.rules first.'
        : 'Class creation failed. Check your Firebase connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  return <><div className="admin-section admin-view-heading"><div><p className="eyebrow green">Class schedule</p><h3>Upcoming classes</h3></div><button className="icon-button" type="button" onClick={() => setShowForm(!showForm)} aria-label="Add class" title="Add class"><FiPlus /></button></div>{showForm && <AdminForm title="Add class" onSubmit={submit} saving={saving} button={form.repeatWeekly ? 'Add recurring classes' : 'Add class'}><label>Class name<select value={form.className} onChange={event => setForm({ ...form, className: event.target.value })}><option>Strength Training</option><option>Functional Fitness</option><option>Run Fit</option></select></label><label>First date<input type="date" value={form.date} onChange={event => setForm({ ...form, date: event.target.value })} required /></label><label>Time<input type="time" value={form.time} onChange={event => setForm({ ...form, time: event.target.value })} required /></label><label>Capacity<input type="number" min="1" value={form.capacity} onChange={event => setForm({ ...form, capacity: event.target.value })} required /></label><label className="admin-checkbox"><input type="checkbox" checked={form.repeatWeekly} onChange={event => setForm({ ...form, repeatWeekly: event.target.checked })} /> Repeat weekly</label>{form.repeatWeekly && <label>Repeat until<input type="date" min={form.date} value={form.repeatUntil} onChange={event => setForm({ ...form, repeatUntil: event.target.value })} required /></label>}</AdminForm>}<section className="admin-section admin-table-wrap"><table className="admin-table"><thead><tr><th>Class</th><th>Date</th><th>Time</th><th>Capacity</th><th>Actions</th></tr></thead><tbody>{classes.length === 0 ? <tr><td colSpan="5">No classes have been added yet.</td></tr> : classes.map(item => <ExistingClass key={item.id} item={item} onSaved={onSaved} onError={onError} />)}</tbody></table></section></>
}

function ExistingClass({ item, onSaved, onError }) {
  const [form, setForm] = useState({ className: item.className, date: item.date, time: item.time, capacity: item.capacity, booked: item.booked || 0 })

  async function save(event) {
    event.preventDefault()
    if (!hasText(form.className, form.date, form.time) || Number(form.capacity) < 1 || Number(form.booked) < 0 || Number(form.booked) > Number(form.capacity)) {
      onError('Enter valid class details before saving.')
      return
    }
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

  async function remove() {
    if (!confirmDestructiveAction(`Delete ${item.className} on ${item.date}?`)) return
    try { await deleteDoc(doc(db, 'classes', item.id)); onSaved('Class deleted.') } catch (error) { onError(error?.code === 'permission-denied' ? 'Class deletion was denied by Firestore.' : 'Class could not be deleted.') }
  }

  return <tr><td><input className="table-input" value={form.className} onChange={event => setForm({ ...form, className: event.target.value })} aria-label="Class name" /></td><td><input className="table-input" type="date" value={form.date} onChange={event => setForm({ ...form, date: event.target.value })} required /></td><td><input className="table-input" type="time" value={form.time} onChange={event => setForm({ ...form, time: event.target.value })} required /></td><td><input className="table-input table-number" type="number" min="1" value={form.capacity} onChange={event => setForm({ ...form, capacity: event.target.value })} aria-label="Capacity" required /><small>{form.booked} booked</small></td><td className="table-actions"><button className="icon-button" type="button" onClick={save} aria-label="Save class" title="Save class"><FiEdit2 /></button><button className="icon-button danger" type="button" onClick={remove} aria-label="Delete class" title="Delete class"><FiTrash2 /></button></td></tr>
}

function SpecialManager({ specials, onSaved, onError }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const emptyForm = { label: '', title: '', detail: '', oldPrice: '', newPrice: '', action: 'View offer', path: '/pricing' }
  const [form, setForm] = useState(emptyForm)

  async function save(event) {
    event.preventDefault()
    if (!hasText(form.label, form.title, form.detail, form.action, form.path)) {
      onError('Complete all required special offer fields before saving.')
      return
    }
    try {
      if (editing?.id) await updateDoc(doc(db, 'specials', editing.id), { ...form, updatedAt: serverTimestamp() })
      else await addDoc(collection(db, 'specials'), { ...form, createdAt: serverTimestamp() })
      setForm(emptyForm)
      setEditing(null)
      setShowForm(false)
      onSaved(editing ? 'Special updated.' : 'Special added.')
    } catch { onError('Special could not be added.') }
  }

  function edit(item) {
    setEditing(item)
    setForm({ label: item.label || '', title: item.title || '', detail: item.detail || '', oldPrice: item.oldPrice || '', newPrice: item.newPrice || '', action: item.action || 'View offer', path: item.path || '/pricing' })
    setShowForm(true)
  }

  async function remove(item) {
    if (!item.id) return
    if (!confirmDestructiveAction(`Delete the special offer “${item.title}”?`)) return
    try { await deleteDoc(doc(db, 'specials', item.id)); onSaved('Special deleted.') } catch { onError('Special could not be deleted.') }
  }

  return <><div className="admin-section admin-view-heading"><div><p className="eyebrow green">Special offers</p><h3>Current specials</h3></div><button className="icon-button" type="button" onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(!showForm) }} aria-label="Add special" title="Add special"><FiPlus /></button></div>{showForm && <AdminForm title={editing ? 'Edit special' : 'Add special'} onSubmit={save} button={editing ? 'Save changes' : 'Add special'}><label>Label<input value={form.label} onChange={event => setForm({ ...form, label: event.target.value })} required /></label><label>Title<input value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} required /></label><label>Details<textarea value={form.detail} onChange={event => setForm({ ...form, detail: event.target.value })} required /></label><div className="admin-price-fields"><label>Old price<input value={form.oldPrice} onChange={event => setForm({ ...form, oldPrice: event.target.value })} placeholder="R650" /></label><label>New price<input value={form.newPrice} onChange={event => setForm({ ...form, newPrice: event.target.value })} placeholder="R500" /></label></div><label>Button text<input value={form.action} onChange={event => setForm({ ...form, action: event.target.value })} required /></label><label>Link path<input value={form.path} onChange={event => setForm({ ...form, path: event.target.value })} required /></label></AdminForm>}<section className="admin-section special-admin-grid">{specials.map(item => <article className="special-admin-card" key={item.id || item.title}><p className="eyebrow green">{item.label}</p><h3>{item.title}</h3>{item.oldPrice && item.newPrice && <div className="deal-prices"><span>{item.oldPrice}</span><strong>{item.newPrice}</strong></div>}<p>{item.detail}</p><div><button className="icon-button" type="button" onClick={() => edit(item)} aria-label="Edit special" title="Edit special"><FiEdit2 /></button><button className="icon-button danger" type="button" onClick={() => remove(item)} aria-label="Delete special" title="Delete special"><FiTrash2 /></button></div></article>)}</section></>
}

function AppointmentManager({ bookings, onSaved }) {
  const [filter, setFilter] = useState('upcoming')
  const [showForm, setShowForm] = useState(false)

  async function updateStatus(booking, status) {
    if (status === 'cancelled' && !confirmDestructiveAction(`Cancel ${booking.name} for ${booking.customerName || 'this member'}?`)) return
    await updateDoc(doc(db, 'bookings', booking.id), { status, updatedAt: serverTimestamp() })
    if (status === 'cancelled' && booking.type === 'oneOnOne' && booking.dateKey && booking.time) {
      const duration = Number(booking.duration || 30)
      const start = timeToMinutes(booking.time)
      await Promise.all(Array.from({ length: duration / 30 }, (_, index) => {
        const time = minutesToTime(start + index * 30)
        return deleteDoc(doc(db, 'oneOnOneSlots', `${booking.dateKey}_${time.replace(':', '')}`))
      }))
    }
    onSaved()
  }

  async function deleteBooking(booking) {
    if (!confirmDestructiveAction(`Delete ${booking.name} for ${booking.customerName || 'this member'}?`)) return
    await deleteDoc(doc(db, 'bookings', booking.id))
    onSaved()
  }

  async function updateBookingField(booking, field, value) {
    if (field === 'dateKey' && !/^\d{4}-\d{2}-\d{2}$/.test(value)) return
    if (field === 'time' && !/^\d{2}:\d{2}$/.test(value)) return
    await updateDoc(doc(db, 'bookings', booking.id), { [field]: value, ...(field === 'dateKey' ? { date: value } : {}), updatedAt: serverTimestamp() })
    onSaved()
  }

  const today = new Date().toISOString().slice(0, 10)
  const visibleBookings = bookings.filter(booking => {
    if (filter === 'upcoming') return !booking.date || booking.date >= today
    return booking.date && booking.date < today
  })

  async function addBooking(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    if (!hasText(form.get('name'), form.get('customerName'), form.get('customerEmail'), form.get('date'), form.get('time'))) return
    await addDoc(collection(db, 'bookings'), { type: form.get('type'), name: form.get('name'), date: form.get('date'), dateKey: form.get('date'), time: form.get('time'), customerName: form.get('customerName'), customerEmail: form.get('customerEmail'), status: 'confirmed', paymentMethod: form.get('type') === 'oneOnOne' ? 'in-person' : 'class-session-balance', createdAt: serverTimestamp() })
    setShowForm(false)
    onSaved('Booking added.')
  }

  return <><div className="admin-section admin-view-heading"><div><p className="eyebrow green">Booking schedule</p><h3>Scheduled bookings</h3></div><button className="icon-button" type="button" onClick={() => setShowForm(!showForm)} aria-label="Add booking" title="Add booking"><FiPlus /></button></div>{showForm && <form className="admin-form admin-add-booking" onSubmit={addBooking}><p className="eyebrow green">Add booking</p><label>Booking type<select name="type"><option value="class">Class</option><option value="oneOnOne">One-on-one</option></select></label><label>Session or class name<input name="name" required /></label><label>Customer name<input name="customerName" required /></label><label>Customer email<input name="customerEmail" type="email" required /></label><label>Date<input name="date" type="date" required /></label><label>Time<input name="time" type="time" required /></label><button className="button button-green" type="submit">Add booking <span>↗</span></button></form>}<section className="admin-section"><div className="admin-filter"><button className={filter === 'upcoming' ? 'active' : ''} type="button" onClick={() => setFilter('upcoming')}>Upcoming</button><button className={filter === 'past' ? 'active' : ''} type="button" onClick={() => setFilter('past')}>Past</button></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Booking</th><th>Customer</th><th>Date</th><th>Time</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead><tbody>{visibleBookings.length === 0 ? <tr><td colSpan="7">No {filter} bookings.</td></tr> : visibleBookings.map(booking => <tr key={booking.id}><td><strong>{booking.name}</strong></td><td>{booking.customerName}<small>{booking.customerEmail}</small></td><td><input className="table-input" type="date" value={booking.dateKey || ''} onChange={event => updateBookingField(booking, 'dateKey', event.target.value)} /></td><td><input className="table-input" type="time" value={booking.time || ''} onChange={event => updateBookingField(booking, 'time', event.target.value)} /></td><td>{booking.type === 'oneOnOne' ? 'One-on-one' : 'Class'}</td><td><span className={`booking-status ${booking.status || 'confirmed'}`}>{booking.status || 'confirmed'}</span></td><td className="table-actions"><button className="icon-button danger" type="button" onClick={() => updateStatus(booking, 'cancelled')} aria-label="Cancel booking" title="Cancel booking"><FiX /></button><button className="icon-button danger" type="button" onClick={() => deleteBooking(booking)} aria-label="Delete booking" title="Delete booking"><FiTrash2 /></button></td></tr>)}</tbody></table></div></section></>
}

function CalendarView({ classes, bookings }) {
  const [weekOffset, setWeekOffset] = useState(0)
  const dates = getWeekDateKeys(weekOffset)
  const slots = Array.from({ length: 30 }, (_, index) => 5 * 60 + index * 30)
  const firstDate = new Date(`${dates[0]}T12:00:00`)
  const lastDate = new Date(`${dates[dates.length - 1]}T12:00:00`)
  const weekLabel = `${firstDate.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })} - ${lastDate.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}`

  function cellContent(date, slot) {
    const classItem = classes.find(item => {
      if (item.date !== date) return false
      const range = classRange(item)
      return slot >= range.start && slot < range.end
    })
    if (classItem) return { label: slot === classRange(classItem).start + 15 ? classItem.className : '', type: 'class' }
    const booking = bookings.find(item => {
      if (item.type !== 'oneOnOne' || item.dateKey !== date || item.status === 'cancelled') return false
      const start = timeToMinutes(item.time)
      return slot >= start && slot < start + Number(item.duration || 30)
    })
    return booking ? { label: slot === timeToMinutes(booking.time) ? booking.name : '', type: 'booking' } : null
  }

  return <section className="admin-section"><div className="calendar-heading"><div><p className="eyebrow green">Calendar · 05:00 to 20:00</p><strong>{weekLabel}</strong></div><div className="calendar-week-controls"><button type="button" onClick={() => setWeekOffset(weekOffset - 1)} aria-label="Previous week">←</button><button type="button" onClick={() => setWeekOffset(0)}>This week</button><button type="button" onClick={() => setWeekOffset(weekOffset + 1)} aria-label="Next week">→</button></div></div><div className="admin-calendar-grid"><div className="calendar-time-heading">Time</div>{dates.map(date => <div className="calendar-day-heading" key={date}>{new Date(`${date}T12:00:00`).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric' })}</div>)}{slots.map(slot => <div className="calendar-grid-row" key={`row-${slot}`}><div className="calendar-time">{minutesToTime(slot)}</div>{dates.map(date => { const content = cellContent(date, slot); return <div className={content ? `calendar-slot ${content.type}` : 'calendar-slot'} key={`${date}-${slot}`}>{content?.label}</div> })}</div>)}</div></section>
}

function AdminForm({ title, children, onSubmit, saving, button }) {
  return <form className="admin-form" onSubmit={onSubmit}><p className="eyebrow green">Admin tools</p><h3>{title}</h3>{children}<button className="button button-green" type="submit" disabled={saving}>{saving ? 'Saving...' : button} <span>↗</span></button></form>
}

export default Admin
