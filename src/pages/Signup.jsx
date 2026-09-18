import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { auth } from '../../firebase'

function Signup() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    const form = new FormData(event.currentTarget)
    try { const result = await createUserWithEmailAndPassword(auth, form.get('email'), form.get('password')); await updateProfile(result.user, { displayName: form.get('name') }); navigate('/') } catch { setError('Your account could not be created. Check the details and try again.') }
  }
  return <section className="auth-page"><div className="auth-panel"><p className="eyebrow green">Start your renewal</p><h2>Create<br /><span>account.</span></h2><form className="auth-form" onSubmit={handleSubmit}><label>Full name<input name="name" type="text" placeholder="Your name" required /></label><label>Email address<input name="email" type="email" placeholder="you@example.com" required /></label><label>Password<input name="password" type="password" placeholder="Create a password" minLength="6" required /></label>{error && <p className="auth-error" role="alert">{error}</p>}<button className="button button-green auth-submit" type="submit">Sign up <span>↗</span></button></form><p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p></div></section>
}

export default Signup