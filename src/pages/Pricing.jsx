import { collection, getDocs } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../../firebase'
import { plans } from '../data'

function Pricing() {
  const [currentPlans, setCurrentPlans] = useState(plans)

  useEffect(() => {
    getDocs(collection(db, 'plans')).then(snapshot => {
      if (!snapshot.empty) setCurrentPlans(snapshot.docs.map(item => ({ id: item.id, ...item.data() })))
    }).catch(() => {})
  }, [])

  return <div className="page-wrap page-content"><div className="page-intro"><p className="eyebrow green">Memberships and programmes</p><h2>Choose your<br /><span>commitment.</span></h2><p className="body-copy">Consistency is where change starts. Choose a rhythm that works for your life.</p></div><div className="pricing-grid">{currentPlans.map(plan => <article className={plan.featured ? 'price-card featured' : 'price-card'} key={plan.id || plan.name}><p className="eyebrow green">{plan.name}</p><strong className="price">{plan.price}<small>{plan.purchaseType === 'program' ? 'total' : 'pm'}</small></strong><p className="plan-detail">{plan.detail}</p>{plan.extra && <p className="plan-extra">+ {plan.extra}</p>}<Link className="button button-green" to="/payment" state={{ plan }}>Choose plan <span>↗</span></Link></article>)}</div></div>
}

export default Pricing