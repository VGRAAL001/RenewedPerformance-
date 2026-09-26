import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import About from './pages/About'
import Admin from './pages/Admin'
import BookNow from './pages/BookNow'
import BookingConfirmation from './pages/BookingConfirmation'
import BookingSchedule from './pages/BookingSchedule'
import Contact from './pages/Contact'
import Home from './pages/Home'
import Login from './pages/Login'
import Pricing from './pages/Pricing'
import Payment from './pages/Payment'
import Profile from './pages/Profile'
import Schedule from './pages/Schedule'
import Signup from './pages/Signup'
import './App.css'
import './auth.css'

function App() {
  return <BrowserRouter><Layout><Routes><Route path="/" element={<Home />} /><Route path="/about" element={<About />} /><Route path="/schedule" element={<Schedule />} /><Route path="/pricing" element={<Pricing />} /><Route path="/payment" element={<Payment />} /><Route path="/book-now" element={<BookNow />} /><Route path="/booking-schedule" element={<BookingSchedule />} /><Route path="/booking-confirmation" element={<BookingConfirmation />} /><Route path="/profile" element={<Profile />} /><Route path="/admin" element={<Admin />} /><Route path="/admin/classes" element={<Admin />} /><Route path="/admin/appointments" element={<Admin />} /><Route path="/admin/specials" element={<Admin />} /><Route path="/admin/calendar" element={<Admin />} /><Route path="/contact" element={<Contact />} /><Route path="/login" element={<Login />} /><Route path="/signup" element={<Signup />} /></Routes></Layout></BrowserRouter>
}

export default App