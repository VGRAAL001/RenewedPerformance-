import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { auth, db } from '../../firebase'
import { plans } from '../data'
import { isAdminUser } from '../utils/admin'

function Profile() {
  const [user, setUser] = useState(null)
  const [profileData, setProfileData] = useState({ sessionsAvailable: 0, membershipPlan: 'No plan yet' })

  useEffect(() => onAuthStateChanged(auth, currentUser => {
    setUser(currentUser)
    if (currentUser) getDoc(doc(db, 'users', currentUser.uid)).then(snapshot => {
      if (snapshot.exists()) setProfileData(data => ({ ...data, ...snapshot.data() }))
    }).catch(() => {})
  }), [])

  if (!user) {
    return (
      <div className="page-wrap page-content booking-empty">
        <p className="eyebrow green">Member profile</p>
        <h2>
          Log in to see
          <br />
          <span>your profile.</span>
        </h2>
        <Link className="button button-green" to="/login">Log in <span>↗</span></Link>
      </div>
    )
  }

  const name = user.displayName || user.email?.split('@')[0] || 'Member'
  const initials = (user.displayName || user.email || 'AM').slice(0, 2).toUpperCase()

  return (
    <div className="page-wrap page-content">
      <div className="page-intro">
        <p className="eyebrow green">Member profile</p>
        <h2>
          Welcome,
          <br />
          <span>{name}.</span>
        </h2>
        <p className="body-copy">Your details and Renewed Performance membership at a glance.</p>
      </div>

      <div className="profile-page-grid">
        <section className="profile-page-card profile-page-identity">
          <span className="profile-avatar profile-avatar-large">{initials}</span>
          <p className="eyebrow green">Your account</p>
          <h3>{name}</h3>
          <p>{user.email}</p>
        </section>
        <section className="profile-page-card">
          <p className="eyebrow green">Membership</p>
          <div className="profile-page-stat"><strong>{profileData.membershipPlan || 'No plan yet'}</strong><span>current plan</span></div>
          <div className="profile-page-stat"><strong>{profileData.sessionsAvailable || 0}</strong><span>sessions available</span></div>
          <Link className="button button-green" to="/book-now">Book a session <span>↗</span></Link>
          <Link className="button button-light buy-sessions-link" to="/payment" state={{ plan: plans[0] }}>Buy more sessions <span>↗</span></Link>
          {isAdminUser(user) && <Link className="button button-light profile-admin-link" to="/admin">Open admin workspace <span>↗</span></Link>}
        </section>
      </div>
    </div>
  )
}

export default Profile
