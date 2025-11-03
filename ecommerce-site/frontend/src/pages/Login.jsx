import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login(){
  const { login } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      nav('/')
    } catch (e) {
      alert(e.message)
    } finally { setLoading(false) }
  }

  return (
    <>
      <div className="auth-container">
        <div className="auth-box">
          <h2>👤 Login</h2>
          <form id="login-form" className="auth-form" onSubmit={onSubmit}>
            <div className="form-group">
              <label htmlFor="email">📧 Email</label>
              <input id="email" type="email" value={email} onChange={e=> setEmail(e.target.value)} required placeholder="Enter your email"/>
            </div>
            <div className="form-group">
              <label htmlFor="password">🔒 Password</label>
              <input id="password" type="password" value={password} onChange={e=> setPassword(e.target.value)} required placeholder="Enter your password"/>
            </div>
            <button type="submit" className="auth-btn" disabled={loading}>{loading? 'Logging in...' : 'Login'}</button>
          </form>
          <div className="auth-links">
            <p>Don't have an account? <Link to="/register">Register here</Link></p>
          </div>
        </div>
      </div>
      <footer className="footer"><p>© 2025 E-Shop. Built by Varshitha with ❤️</p></footer>
    </>
  )
}
