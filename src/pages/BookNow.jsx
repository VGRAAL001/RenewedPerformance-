import { oneOnOneServices, schedule } from '../data'

function BookNow() {
  return <div className="page-wrap page-content"><div className="page-intro"><p className="eyebrow green">Take the first step</p><h2>Let’s get<br /><span>you moving.</span></h2><p className="body-copy">Choose the kind of session you are looking for and Berucia will be in touch to confirm your booking.</p></div><div className="booking-grid"><BookingCard number="01" title="Book a class">{schedule.filter((item, index) => index < 6).map(item => <button type="button" className="booking-option" key={`${item.day}-${item.time}`}><span><strong>{item.className}</strong>{item.day} · {item.time}</span><b>↗</b></button>)}</BookingCard><BookingCard number="02" title="1-on-1 session">{oneOnOneServices.map(service => <button type="button" className="booking-option" key={service}><span><strong>{service}</strong>Personalised session</span><b>↗</b></button>)}</BookingCard></div></div>
}

function BookingCard({ number, title, children }) {
  return <section className="booking-card"><div className="booking-card-title"><span>{number}</span><div><p className="eyebrow green">Personal support</p><h3>{title}</h3></div></div><p className="body-copy">Select an option to start your enquiry.</p><div className="booking-options">{children}</div></section>
}

export default BookNow