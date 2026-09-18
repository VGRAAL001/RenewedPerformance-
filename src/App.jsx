import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import About from './pages/About'
import BookNow from './pages/BookNow'
import Contact from './pages/Contact'
import Home from './pages/Home'
import Login from './pages/Login'
import Pricing from './pages/Pricing'
import Schedule from './pages/Schedule'
import Signup from './pages/Signup'
import './App.css'
import './auth.css'

function App() {
  return <BrowserRouter><Layout><Routes><Route path="/" element={<Home />} /><Route path="/about" element={<About />} /><Route path="/schedule" element={<Schedule />} /><Route path="/pricing" element={<Pricing />} /><Route path="/book-now" element={<BookNow />} /><Route path="/contact" element={<Contact />} /><Route path="/login" element={<Login />} /><Route path="/signup" element={<Signup />} /></Routes></Layout></BrowserRouter>
}

export default App