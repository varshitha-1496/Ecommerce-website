import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Register(){
  const { register, login } = useAuth()
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    if(password !== confirmPassword){ alert('Passwords do not match!'); return }
    setLoading(true)
    try {
      await register({ name, email, password })
      // Auto-login
      await login(email, password)
      nav('/products')
    } catch (e) {
      alert(e.message)
    } finally { setLoading(false) }
  }

  return (
    <>
      <div className="auth-container">
        <div className="auth-box">
          <h2>📝 Register</h2>
          <form id="register-form" className="auth-form" onSubmit={onSubmit}>
            <div className="form-group">
              <label htmlFor="name">👤 Full Name</label>
              <input id="name" value={name} onChange={e=> setName(e.target.value)} required placeholder="Enter your full name"/>
            </div>
            <div className="form-group">
              <label htmlFor="email">📧 Email</label>
              <input id="email" type="email" value={email} onChange={e=> setEmail(e.target.value)} required placeholder="Enter your email"/>
            </div>
            <div className="form-group">
              <label htmlFor="password">🔒 Password</label>
              <input id="password" type="password" value={password} onChange={e=> setPassword(e.target.value)} required placeholder="Create a password"/>
              <small className="password-hint">At least 8 characters with numbers and special characters</small>
            </div>
            <div className="form-group">
              <label htmlFor="confirm-password">🔒 Confirm Password</label>
              <input id="confirm-password" type="password" value={confirmPassword} onChange={e=> setConfirmPassword(e.target.value)} required placeholder="Confirm your password"/>
            </div>
            <button type="submit" className="auth-btn" disabled={loading}>{loading? 'Registering...' : 'Register'}</button>
          </form>
          <div className="auth-links">
            <p>Already have an account? <Link to="/login">Login here</Link></p>
          </div>
        </div>
      </div>
      <footer className="footer"><p>© 2025 E-Shop. Built by Varshitha with ❤️</p></footer>
    </>
  )
}
