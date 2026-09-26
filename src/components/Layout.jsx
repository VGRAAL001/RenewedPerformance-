import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { auth, db } from '../../firebase'
import Logo from './Logo'
import { isAdminUser } from '../utils/admin'

const navItems = [['Home', '/'], ['About', '/about'], ['Schedule', '/schedule'], ['Pricing', '/pricing'], ['Contact', '/contact']]
const memberProfile = { name: 'Alex Morgan', initials: 'AM', plan: 'No plan yet', sessionsAvailable: 0, sessionsLeft: 0, upcoming: 'No upcoming class', upcomingClass: 'Book a class', history: [] }

function Layout({ children }) {
  const [profileOpen, setProfileOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [profileData, setProfileData] = useState(memberProfile)
  useEffect(() => onAuthStateChanged(auth, currentUser => {
    setUser(currentUser)
    if (currentUser) getDoc(doc(db, 'users', currentUser.uid)).then(snapshot => {
      if (snapshot.exists()) setProfileData(data => ({ ...data, ...snapshot.data(), sessionsLeft: Number(snapshot.data().sessionsAvailable || 0) }))
    }).catch(() => {})
    else setProfileData(memberProfile)
  }), [])
  const profile = user ? { ...profileData, name: user.displayName || user.email?.split('@')[0] || memberProfile.name, initials: (user.displayName || user.email || 'AM').slice(0, 2).toUpperCase(), plan: profileData.membershipPlan || memberProfile.plan } : null
  return <div className="site-shell"><header className="site-header"><div className="nav-wrap"><Logo /><nav className="main-nav">{navItems.map(([label, path]) => <NavLink key={path} to={path} className={({ isActive }) => isActive ? 'active' : ''}>{label}</NavLink>)}<NavLink className="nav-cta" to="/book-now">Book now <span>↗</span></NavLink>{isAdminUser(user) && <NavLink className="admin-header-link" to="/admin">Admin</NavLink>}{profile ? <div className={`profile-menu${profileOpen ? ' open' : ''}`}><button className="profile-trigger" type="button" onClick={() => setProfileOpen(!profileOpen)} aria-expanded={profileOpen} aria-label="Open member profile"><span className="profile-avatar">{profile.initials}</span><span className="profile-trigger-name">{profile.name}</span><span className="profile-chevron">⌄</span></button><div className="profile-panel"><div className="profile-panel-head"><span className="profile-avatar profile-avatar-large">{profile.initials}</span><div><strong>{profile.name}</strong><span>{profile.plan} membership</span></div></div><div className="session-count"><strong>{profile.sessionsLeft}</strong><span>sessions left<br />this month</span></div><div className="profile-appointment"><span>Next appointment</span><strong>{profile.upcomingClass}</strong><small>{profile.upcoming}</small></div><div className="profile-history"><span>Recent appointments</span>{profile.history.map(item => <div key={item.date}><span>{item.date}</span><strong>{item.name}</strong></div>)}</div><NavLink className="profile-link" to="/profile" onClick={() => setProfileOpen(false)}>View full profile <span>↗</span></NavLink><NavLink className="profile-link" to="/book-now" onClick={() => setProfileOpen(false)}>Book another session <span>↗</span></NavLink><button className="profile-signout" type="button" onClick={() => { signOut(auth); setProfileOpen(false) }}>Log out</button></div></div> : <NavLink className="account-link" to="/login">Log in</NavLink>}</nav></div></header><main>{children}</main><footer className="site-footer"><div className="footer-grid"><div><Logo /><p>Move better. Perform stronger.<br />Live renewed.</p></div><div><span>Visit</span><p>94 Strand St<br />Cape Town City Centre</p></div><div><span>Connect</span><a href="tel:0785243816">078 524 3816</a><a href="mailto:arendsberucia@gmail.com">arendsberucia@gmail.com</a></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Renewed Performance</span><span>Sport science for real life.</span></div></footer></div>
}

export default Layout