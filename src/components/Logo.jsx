import { Link } from 'react-router-dom'
import logoImage from '../assets/Logo.png'

function Logo() {
  return (
    <>
      <Link className="logo" to="/" aria-label="Renewed Performance home">
        <img src={logoImage} alt="Renewed Performance" />
      </Link>
      <details className="mobile-menu">
        <summary aria-label="Open navigation menu"><span /><span /><span /></summary>
        <nav aria-label="Mobile navigation">
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/schedule">Schedule</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/book-now">Book now <span>↗</span></Link>
        </nav>
      </details>
    </>
  )
}

export default Logo