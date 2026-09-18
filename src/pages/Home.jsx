import { Link } from 'react-router-dom'
import { services } from '../data'

function Home() {
  return <><section className="home-hero"><div className="page-wrap"><p className="eyebrow">Sport science · Cape Town</p><h2>Train with purpose.<br /><span>Move renewed.</span></h2><p className="hero-copy">Evidence-led movement and performance coaching for bodies ready for more.</p><Link className="button button-light" to="/book-now">Book your session <span>↗</span></Link></div></section><section className="page-wrap intro-section"><div><p className="eyebrow green">The renewed approach</p><h2>Performance<br />is personal.</h2></div><div><p className="body-copy">Whether you are recovering from injury, chasing a personal best, or building a body you can rely on, your plan should meet you where you are.</p><Link className="text-link" to="/about">Meet Berucia <span>→</span></Link></div></section><section className="dark-section"><div className="page-wrap"><p className="eyebrow">What we do</p><h2>Built for your<br /><span>next level.</span></h2><div className="service-list">{services.map((service, index) => <div className="service-row" key={service.name}><span>0{index + 1}</span><strong>{service.name}</strong><span>↗</span></div>)}</div></div></section></>
}

export default Home