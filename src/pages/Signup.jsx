import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { auth, db, hasFirebaseConfig } from '../../firebase'
import { getAuthErrorMessage } from '../utils/authErrors'

function Signup() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name') || '').trim()
    const email = String(form.get('email') || '').trim()
    const phone = String(form.get('phone') || '').trim()
    const dateOfBirth = String(form.get('dateOfBirth') || '')
    const gender = String(form.get('gender') || '')
    const password = String(form.get('password') || '')
    const confirmPassword = String(form.get('confirmPassword') || '')

    if (name.length < 2) {
      setError('Enter your full name.')
      return
    }
    if (phone.length < 7) {
      setError('Enter a valid phone number.')
      return
    }
    if (!dateOfBirth || new Date(`${dateOfBirth}T00:00:00`) > new Date()) {
      setError('Enter a valid date of birth.')
      return
    }
    const birthDate = new Date(`${dateOfBirth}T00:00:00`)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear() - (
      today < new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate()) ? 1 : 0
    )
    if (age < 13) {
      setError('You must be at least 13 years old to create an account.')
      return
    }
    if (!gender) {
      setError('Select your gender.')
      return
    }
    if (password.length < 6) {
      setError('Choose a password with at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.')
      return
    }
    if (!hasFirebaseConfig) {
      setError('Firebase is not configured. Add your Firebase web app settings to .env first.')
      return
    }

    let result
    try {
      result = await createUserWithEmailAndPassword(auth, email, password)
    } catch (error) {
      setError(getAuthErrorMessage(error, 'create your account'))
      return
    }

    try {
      await updateProfile(result.user, { displayName: name })
      await setDoc(doc(db, 'users', result.user.uid), {
        name,
        email: result.user.email,
        phone,
        cellPhone: phone,
        dateOfBirth,
        age,
        gender,
        sessionsAvailable: 0,
        groupSessionsAvailable: 0,
        membershipPlan: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      navigate('/book-now')
    } catch (error) {
      if (error?.code === 'permission-denied') {
        navigate('/book-now')
      } else {
        navigate('/book-now')
      }
    }
  }
  return (
    <section className="auth-page">
      <div className="auth-panel">
        <p className="eyebrow green">Start your renewal</p>
        <h2>
          Create
          <br />
          <span>account.</span>
        </h2>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Full name
            <input name="name" type="text" placeholder="Your name" required />
          </label>
          <label>
            Email address
            <input name="email" type="email" placeholder="you@example.com" required />
          </label>
          <label>
            Phone number
            <input name="phone" type="tel" placeholder="Your phone number" autoComplete="tel" required />
          </label>
          <label>
            Date of birth
            <input name="dateOfBirth" type="date" autoComplete="bday" required />
          </label>
          <label>
            Gender
            <select name="gender" defaultValue="" required>
              <option value="" disabled>Select an option</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="non-binary">Non-binary</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </label>
          <label>
            Password
            <span className="password-field">
              <input name="password" type={showPassword ? 'text' : 'password'} placeholder="Create a password" minLength="6" required />
              <button className="password-toggle" type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button>
            </span>
          </label>
          <label>
            Confirm password
            <span className="password-field">
              <input name="confirmPassword" type={showPassword ? 'text' : 'password'} placeholder="Repeat your password" required />
              <button className="password-toggle" type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button>
            </span>
          </label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="button button-green auth-submit" type="submit">Sign up <span>↗</span></button>
        </form>
        <p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p>
      </div>
    </section>
  )
}

export default Signup