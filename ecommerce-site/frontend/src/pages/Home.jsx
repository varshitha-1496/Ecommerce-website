import React from 'react'
import { Link } from 'react-router-dom'

export default function Home(){
  return (
    <>
      <section className="hero">
        <div className="hero-text">
          <h1>Shop Smart, Live Better!</h1>
          <p>Get amazing deals on the hottest products!</p>
          <Link to="/products" className="btn hero-btn">Explore Now</Link>
        </div>
      </section>

      <section className="highlights">
        <div className="highlight-box">
          <h3>Free Shipping</h3>
          <p>On all orders above ₹500</p>
        </div>
        <div className="highlight-box">
          <h3>24/7 Support</h3>
          <p>Chat with us anytime</p>
        </div>
        <div className="highlight-box">
          <h3>Secure Payment</h3>
          <p>Safe and encrypted transactions</p>
        </div>
      </section>

      <footer className="footer colorful-footer">
        <p>© 2025 E-Shop. All rights reserved.</p>
        <p>Follow us on: <a href="#">Instagram</a> | <a href="#">Facebook</a> | <a href="#">Twitter</a></p>
      </footer>
    </>
  )
}
