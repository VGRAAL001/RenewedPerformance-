import { collection, getDocs } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../../firebase'
import { schedule } from '../data'

function toDateKey(date) {
  return date.toLocaleDateString('en-CA')
}

function getMonday(date = new Date()) {
  const monday = new Date(date)
  const day = monday.getDay()
  monday.setDate(monday.getDate() - (day === 0 ? 6 : day - 1))
  return monday
}

function getWeekDates(weekStart) {
  const start = new Date(`${weekStart}T12:00:00`)
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return { key: toDateKey(date), date }
  })
}

function Schedule() {
  const days = ['Monday', 'Wednesday', 'Thursday']
  const [view, setView] = useState('regular')
  const [weekStart, setWeekStart] = useState(() => toDateKey(getMonday()))
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (view !== 'week') return
    let active = true
    getDocs(collection(db, 'classes'))
      .then(snapshot => {
        if (active) setClasses(snapshot.docs.map(item => ({ id: item.id, ...item.data() })))
      })
      .catch(() => {
        if (active) setError('The database schedule could not be loaded. Please try again.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [view])

  function changeView(nextView) {
    setError('')
    setLoading(nextView === 'week')
    setView(nextView)
  }

  const weekDates = getWeekDates(weekStart)
  const weekClasses = weekDates.map(({ key, date }) => ({
    key,
    date,
    classes: classes.filter(item => item.date === key).sort((first, second) => first.time.localeCompare(second.time)),
  }))

  return <div className="page-wrap page-content"><div className="page-intro"><p className="eyebrow green">Group training</p><h2>Make a date<br /><span>with stronger.</span></h2><p className="body-copy">Three focused sessions. One supportive community. Show up for the version of you that is still becoming.</p></div><div className="schedule-controls" role="group" aria-label="Schedule view"><button type="button" className={view === 'regular' ? 'active' : ''} onClick={() => changeView('regular')}>Regular schedule</button><button type="button" className={view === 'week' ? 'active' : ''} onClick={() => changeView('week')}>Schedule for a week</button></div>{view === 'week' && <div className="schedule-week-picker"><label htmlFor="week-start">Week starting</label><input id="week-start" type="date" value={weekStart} onChange={event => setWeekStart(event.target.value)} /></div>}{view === 'regular' ? <div className="timetable">{days.map(day => <section key={day}><h3>{day}</h3>{schedule.filter(item => item.day === day).map(item => <div className="class-card" key={`${item.day}-${item.time}`}><time>{item.time}</time><strong>{item.className}</strong></div>)}</section>)}</div> : loading ? <p className="body-copy schedule-state">Loading the selected week...</p> : error ? <p className="auth-error schedule-state" role="alert">{error}</p> : <div className="timetable timetable-week">{weekClasses.map(({ key, date, classes: dateClasses }) => <section key={key}><h3>{date.toLocaleDateString('en-ZA', { weekday: 'long' })}</h3><p className="schedule-date">{date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}</p>{dateClasses.length === 0 ? <p className="schedule-empty">No classes scheduled.</p> : dateClasses.map(item => <div className="class-card" key={item.id}><time>{item.time}</time><div><strong>{item.className}</strong><small>{Math.max(0, Number(item.capacity || 0) - Number(item.booked || 0))} spaces left</small></div></div>)}</section>)}</div>}<Link className="button button-green" to="/book-now">Book a group class <span>↗</span></Link></div>
}

export default Schedule