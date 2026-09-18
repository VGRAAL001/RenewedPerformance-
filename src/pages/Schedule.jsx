import { Link } from 'react-router-dom'
import { schedule } from '../data'

function Schedule() {
  const days = ['Monday', 'Wednesday', 'Thursday']
  return <div className="page-wrap page-content"><div className="page-intro"><p className="eyebrow green">Group training</p><h2>Make a date<br /><span>with stronger.</span></h2><p className="body-copy">Three focused sessions. One supportive community. Show up for the version of you that is still becoming.</p></div><div className="timetable">{days.map(day => <section key={day}><h3>{day}</h3>{schedule.filter(item => item.day === day).map(item => <div className="class-card" key={`${item.day}-${item.time}`}><time>{item.time}</time><strong>{item.className}</strong></div>)}</section>)}</div><Link className="button button-green" to="/book-now">Book a group class <span>↗</span></Link></div>
}

export default Schedule