import { signInWithEmailAndPassword } from 'firebase/auth'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { auth } from '../../firebase'

function Login() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    const form = new FormData(event.currentTarget)
    try { await signInWithEmailAndPassword(auth, form.get('email'), form.get('password')); navigate('/') } catch { setError('That email and password combination could not be verified.') }
  }
  return <AuthLayout eyebrow="Welcome back" title="Log in"><form className="auth-form" onSubmit={handleSubmit}><label>Email address<input name="email" type="email" placeholder="you@example.com" required /></label><label>Password<input name="password" type="password" placeholder="Your password" required /></label><div className="auth-row"><label className="checkbox-label"><input type="checkbox" /> Remember me</label><button className="auth-forgot" type="button">Forgot password?</button></div>{error && <p className="auth-error" role="alert">{error}</p>}<button className="button button-green auth-submit" type="submit">Log in <span>↗</span></button></form><p className="auth-switch">New to Renewed Performance? <Link to="/signup">Create an account</Link></p></AuthLayout>
}

function AuthLayout({ eyebrow, title, children }) {
  return <section className="auth-page"><div className="auth-panel"><p className="eyebrow green">{eyebrow}</p><h2>{title}<span>.</span></h2>{children}</div></section>
}

export default Login