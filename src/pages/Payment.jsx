import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { auth, db } from '../../firebase'

function Payment() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const plan = state?.plan
  const [submitted, setSubmitted] = useState(false)
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [account, setAccount] = useState({ sessionsAvailable: 0, oneOnOneSessions: 0, membershipPlan: 'No plan yet' })
  const [error, setError] = useState('')
  const [billingType, setBillingType] = useState(plan?.purchaseType === 'program' ? 'once-off' : 'recurring')

  useEffect(() => onAuthStateChanged(auth, currentUser => {
    setUser(currentUser)
    setAuthLoading(false)
    if (currentUser) getDoc(doc(db, 'users', currentUser.uid)).then(snapshot => {
      if (snapshot.exists()) setAccount(data => ({ ...data, ...snapshot.data() }))
    }).catch(() => {})
  }), [])

  if (!plan) return <div className="page-wrap page-content booking-empty"><p className="eyebrow green">No plan selected</p><h2>Choose a plan<br /><span>to continue.</span></h2><Link className="button button-green" to="/pricing">View plans <span>↗</span></Link></div>

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    const sessionsToAdd = Number(plan.classSessions || 0)
    const oneOnOneSessionsToAdd = Number(plan.oneOnOneSessions || 0)
    try {
      await runTransaction(db, async transaction => {
        const userReference = doc(db, 'users', user.uid)
        const userSnapshot = await transaction.get(userReference)
        const userData = userSnapshot.exists() ? userSnapshot.data() : {}
        const isRecurring = billingType === 'recurring'
        const updatedSessionsAvailable = Number(userData.sessionsAvailable || 0) + sessionsToAdd
        const updatedOneOnOneSessions = Number(userData.oneOnOneSessions || 0) + oneOnOneSessionsToAdd
        transaction.set(userReference, {
          sessionsAvailable: updatedSessionsAvailable,
          oneOnOneSessions: updatedOneOnOneSessions,
          membershipPlan: plan.name,
          subscription: {
            status: isRecurring ? 'active' : 'inactive',
            billingInterval: isRecurring ? 'monthly' : null,
            programme: plan.purchaseType === 'program' ? { name: plan.name, duration: '6 weeks', sessionsPerWeek: 2 } : null,
            price: plan.price,
            nextBillingDate: isRecurring ? getNextBillingDate() : null,
          },
          updatedAt: serverTimestamp(),
        }, { merge: true })
        setAccount(data => ({ ...data, sessionsAvailable: updatedSessionsAvailable, oneOnOneSessions: updatedOneOnOneSessions, membershipPlan: plan.name }))
      })
      setSubmitted(true)
    } catch {
      setError('Payment succeeded, but sessions could not be added. Please contact support before trying again.')
    }
  }

  if (authLoading) return <div className="page-wrap page-content"><section className="booking-confirmed payment-login-required"><p className="eyebrow green">Account check</p><h3>Checking your account.</h3><p className="body-copy">Please wait while we confirm your sign-in status.</p></section></div>
  if (!user) return <div className="page-wrap page-content"><section className="booking-confirmed payment-login-required"><p className="eyebrow green">Login required</p><h3>Sign in to pay.</h3><p className="body-copy">You need to be logged in before making a payment. Your account balance and membership details will appear here after you sign in.</p><Link className="button button-green" to="/login">Log in to continue <span>↗</span></Link></section></div>
  if (submitted) return <div className="page-wrap page-content"><section className="booking-confirmed payment-success"><p className="eyebrow green">Payment successful</p><h3>Your account is updated.</h3><div className="payment-success-summary">{plan.purchaseType === 'program' ? <p><strong>12 sessions</strong> six-week programme added</p> : <><p><strong>{sessionsToAdd(plan)}</strong> class sessions added</p><p><strong>{account.sessionsAvailable}</strong> class sessions now available</p></>}<p><strong>{billingType === 'recurring' ? 'Monthly' : 'Once-off'}</strong> payment selected</p></div><Link className="button button-green" to="/book-now">Book a session <span>↗</span></Link></section></div>

  return <div className="page-wrap page-content"><button className="button button-light page-back" type="button" onClick={() => navigate(-1)}>Back</button><div className="page-intro"><p className="eyebrow green">Secure checkout</p><h2>Start your<br /><span>renewal.</span></h2><p className="body-copy">Review your membership and choose whether you would like to renew it monthly.</p></div><div className="payment-grid"><section className="booking-summary"><p className="eyebrow green">Your plan</p><h3>{plan.name}</h3><p>{plan.detail}</p><strong className="payment-price">{plan.price}<small>{plan.purchaseType === 'program' ? ' total' : ' pm'}</small></strong>{plan.extra && <p>{plan.extra}</p>}{plan.purchaseType !== 'program' && <div className="account-balance"><span>Current account balance</span><strong>{account.sessionsAvailable}</strong><small>class sessions available before payment</small></div>}</section><form className="confirmation-form" onSubmit={handleSubmit}><p className="eyebrow green">Payment details</p>{plan.purchaseType === 'program' ? <p className="payment-note">This six-week programme is paid once in person or through your payment provider. It does not use class-session credits.</p> : <fieldset className="billing-options"><legend>Payment schedule</legend><label><input type="radio" name="billingType" value="recurring" checked={billingType === 'recurring'} onChange={event => setBillingType(event.target.value)} />Monthly recurring <small>Renews every month</small></label><label><input type="radio" name="billingType" value="once-off" checked={billingType === 'once-off'} onChange={event => setBillingType(event.target.value)} />Once-off payment <small>No automatic renewal</small></label></fieldset>}<label>Name on card<input required placeholder="Your name" /></label><label>Card number<input required inputMode="numeric" placeholder="0000 0000 0000 0000" /></label><div className="payment-fields"><label>Expiry<input required placeholder="MM/YY" /></label><label>CVV<input required inputMode="numeric" placeholder="000" /></label></div>{error && <p className="auth-error" role="alert">{error}</p>}<button className="button button-green" type="submit">{plan.purchaseType === 'program' ? `Pay programme · ${plan.price}` : `${billingType === 'recurring' ? 'Start monthly plan' : 'Pay once-off'} · ${plan.price}`} <span>↗</span></button><p className="payment-provider-note">Payment processing will be connected to your payment provider.</p></form></div></div>
}

function sessionsToAdd(plan) {
  return Number(plan.detail?.match(/\d+/)?.[0] || 0)
}

function getNextBillingDate() {
  const nextBillingDate = new Date()
  nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)
  return nextBillingDate.toISOString().slice(0, 10)
}

export default Payment