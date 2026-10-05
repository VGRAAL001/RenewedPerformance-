import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { auth, db, hasFirebaseConfig } from '../../firebase'
import { getAuthErrorMessage } from '../utils/authErrors'

function Login() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    const form = new FormData(event.currentTarget)
    if (!hasFirebaseConfig) {
      setError('Firebase is not configured. Add your Firebase web app settings to .env first.')
      return
    }
    try {
      const result = await signInWithEmailAndPassword(auth, form.get('email'), form.get('password'))
      await setDoc(doc(db, 'users', result.user.uid), {
        name: result.user.displayName || '',
        email: result.user.email,
        updatedAt: serverTimestamp(),
      }, { merge: true })
      navigate('/')
    } catch (error) {
      if (error?.code === 'permission-denied') {
        navigate('/')
      } else {
        setError(getAuthErrorMessage(error, 'log you in'))
      }
    }
  }
  async function handleForgotPassword() {
    setError('')
    setMessage('')
    const email = new FormData(document.querySelector('.auth-form')).get('email')
    if (!email) {
      setError('Enter your email address first.')
      return
    }
    if (!hasFirebaseConfig) {
      setError('Firebase is not configured. Add your Firebase web app settings to .env first.')
      return
    }
    try {
      await sendPasswordResetEmail(auth, email)
      setMessage('Password reset instructions have been sent to your email.')
    } catch (error) {
      setError(getAuthErrorMessage(error, 'send password reset instructions'))
    }
  }
  return <AuthLayout eyebrow="Welcome back" title="Log in"><form className="auth-form" onSubmit={handleSubmit}><label>Email address<input name="email" type="email" placeholder="you@example.com" required /></label><label>Password<span className="password-field"><input name="password" type={showPassword ? 'text' : 'password'} placeholder="Your password" required /><button className="password-toggle" type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button></span></label><div className="auth-row"><label className="checkbox-label"><input type="checkbox" /> Remember me</label><button className="auth-forgot" type="button" onClick={handleForgotPassword}>Forgot password?</button></div>{error && <p className="auth-error" role="alert">{error}</p>}{message && <p className="auth-success" role="status">{message}</p>}<button className="button button-green auth-submit" type="submit">Log in <span>↗</span></button></form><p className="auth-switch">New to Renewed Performance? <Link to="/signup">Create an account</Link></p></AuthLayout>
}

function AuthLayout({ eyebrow, title, children }) {
  return <section className="auth-page"><div className="auth-panel"><p className="eyebrow green">{eyebrow}</p><h2>{title}<span>.</span></h2>{children}</div></section>
}

export default Login