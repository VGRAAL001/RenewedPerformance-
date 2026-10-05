import { Link } from 'react-router-dom'
import logoImage from '../assets/Logo.png'

function Logo({ profile, isAdmin }) {
  function closeMenu(event) {
    event.currentTarget.closest('details')?.removeAttribute('open')
  }

  return (
    <>
      <Link className="logo" to="/" aria-label="Renewed Performance home" onClick={closeMenu}>
        <img src={logoImage} alt="Renewed Performance" />
      </Link>
      <Link className="mobile-profile" to={profile ? '/profile' : '/login'} aria-label={profile ? 'Open your profile' : 'Log in'}><span className="profile-avatar">{profile ? profile.initials : '○'}</span><span>{profile ? profile.name : 'Log in'}</span></Link>
      <details className="mobile-menu">
        <summary aria-label="Open navigation menu"><span /><span /><span /></summary>
        <nav aria-label="Mobile navigation">
          <Link to="/" onClick={closeMenu}>Home</Link>
          <Link to="/about" onClick={closeMenu}>About</Link>
          <Link to="/schedule" onClick={closeMenu}>Schedule</Link>
          <Link to="/pricing" onClick={closeMenu}>Pricing</Link>
          <Link to="/contact" onClick={closeMenu}>Contact</Link>
          {profile && <Link to="/profile" onClick={closeMenu}>Profile</Link>}
          {isAdmin && <Link to="/admin" onClick={closeMenu}>Admin</Link>}
          <Link to="/book-now" onClick={closeMenu}>Book now</Link>
        </nav>
      </details>
    </>
  )
}

export default Logo