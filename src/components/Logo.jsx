import { Link } from 'react-router-dom'
import logoImage from '../assets/Logo.png'

function Logo() {
  return (
    <Link className="logo" to="/" aria-label="Renewed Performance home">
      <img src={logoImage} alt="Renewed Performance" />
    </Link>
  )
}

export default Logo