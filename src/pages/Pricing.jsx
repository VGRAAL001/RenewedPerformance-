import { Link } from 'react-router-dom'
import { plans } from '../data'

function Pricing() {
  return <div className="page-wrap page-content"><div className="page-intro"><p className="eyebrow green">Memberships</p><h2>Choose your<br /><span>commitment.</span></h2><p className="body-copy">Consistency is where change starts. Choose a rhythm that works for your life.</p></div><div className="pricing-grid">{plans.map(plan => <article className={plan.featured ? 'price-card featured' : 'price-card'} key={plan.name}><p className="eyebrow green">{plan.name}</p><strong className="price">{plan.price}<small>pm</small></strong><p className="plan-detail">{plan.detail}</p>{plan.extra && <p className="plan-extra">+ {plan.extra}</p>}<Link className="button button-green" to="/book-now">Choose plan <span>↗</span></Link></article>)}</div></div>
}

export default Pricing