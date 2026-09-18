import { onAuthStateChanged } from 'firebase/auth'
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { auth, db } from '../../firebase'

function Payment() {
  const { state } = useLocation()
  const plan = state?.plan
  const [submitted, setSubmitted] = useState(false)
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => onAuthStateChanged(auth, setUser), [])

  if (!plan) {
    return <div className="page-wrap page-content booking-empty"><p className="eyebrow green">No plan selected</p><h2>Choose a plan<br /><span>to continue.</span></h2><Link className="button button-green" to="/pricing">View plans <span>↗</span></Link></div>
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (!user) {
      setError('Please log in before purchasing sessions.')
      return
    }
    const sessionsToAdd = Number(plan.detail?.match(/\d+/)?.[0] || 0)
    try {
      await runTransaction(db, async transaction => {
        const userReference = doc(db, 'users', user.uid)
        const userSnapshot = await transaction.get(userReference)
        const userData = userSnapshot.exists() ? userSnapshot.data() : {}
        transaction.set(userReference, {
          sessionsAvailable: Number(userData.sessionsAvailable || 0) + sessionsToAdd,
          membershipPlan: plan.name,
          updatedAt: serverTimestamp(),
        }, { merge: true })
      })
      setSubmitted(true)
    } catch {
      setError('Payment succeeded, but sessions could not be added. Please contact support before trying again.')
    }
  }

  return <div className="page-wrap page-content"><div className="page-intro"><p className="eyebrow green">Secure checkout</p><h2>Start your<br /><span>renewal.</span></h2><p className="body-copy">Review your membership and enter your payment details to continue.</p></div>{submitted ? <section className="booking-confirmed"><p className="eyebrow green">Payment submitted</p><h3>Welcome to your new rhythm.</h3><p className="body-copy">{sessionsToAdd(plan)} sessions have been added to your account.</p><Link className="button button-green" to="/book-now">Book a session <span>↗</span></Link></section> : <div className="payment-grid"><section className="booking-summary"><p className="eyebrow green">Your plan</p><h3>{plan.name}</h3><p>{plan.detail}</p><strong className="payment-price">{plan.price}<small> pm</small></strong>{plan.extra && <p>{plan.extra}</p>}</section><form className="confirmation-form" onSubmit={handleSubmit}><p className="eyebrow green">Payment details</p><label>Name on card<input required placeholder="Your name" /></label><label>Card number<input required inputMode="numeric" placeholder="0000 0000 0000 0000" /></label><div className="payment-fields"><label>Expiry<input required placeholder="MM/YY" /></label><label>CVV<input required inputMode="numeric" placeholder="000" /></label></div>{error && <p className="auth-error" role="alert">{error}</p>}<button className="button button-green" type="submit">Pay {plan.price} <span>↗</span></button><p className="payment-note">Payment processing will be connected to your payment provider.</p></form></div>}</div>
}

function sessionsToAdd(plan) {
  return Number(plan.detail?.match(/\d+/)?.[0] || 0)
}

export default Payment