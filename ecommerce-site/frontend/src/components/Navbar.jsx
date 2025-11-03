import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'

export default function Navbar() {
  const { user, logout, token } = useAuth()
  const { totalItems, setCart } = useCart()
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <header className={location.pathname === '/products' ? 'header products-navbar' : 'header white-navbar'}>
      <div className="navbar">
        <div className="logo">
          <Link to="/">
            <img src="/logo-bag.svg" alt="E-Shop" className="logo-img" />
            <span className="logo-word">E-Shop</span>
          </Link>
        </div>
        <nav>
          <ul className="nav-links">
            <li><Link to="/">🏠 Home</Link></li>
            <li><Link to="/products">🛍️ Products</Link></li>
            <li><Link to="/cart">🛒 Cart (<span id="cart-count">{totalItems}</span>)</Link></li>
            {token && user?.role === 'admin' && (
              <li><Link to="/admin">🛠️ Admin</Link></li>
            )}
            {!token ? (
              <li><Link to="/login">👤 Login</Link></li>
            ) : (
              <li className="user-dropdown">
                <Link to="/profile">👤 {user?.name}</Link>
                <div className="dropdown-content">
                  <a href="#" onClick={(e)=>{e.preventDefault(); setCart([]); localStorage.removeItem('cart'); logout(); navigate('/login')}}>🚪 Logout</a>
                </div>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  )
}
