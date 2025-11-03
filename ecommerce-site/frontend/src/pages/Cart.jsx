import React, { useMemo, useState } from 'react'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'

export default function Cart(){
  const { cart, totalPrice, increaseQty, decreaseQty, removeItem, emptyCart, placeOrder } = useCart()
  const { token } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ name:'', email:'', phone:'', address:'', state:'', pincode:'', landmark:'', payment:'' })
  const [pay, setPay] = useState({ upiId:'', cardName:'', cardNumber:'', cardExpiry:'' })

  const total = useMemo(()=> totalPrice, [totalPrice])

  const onSubmit = async (e) => {
    e.preventDefault()
    if(!token) return
    if(!form.state || !form.pincode) { alert('Please fill in state and pincode.'); return }
    const pin = String(form.pincode).replace(/\s+/g,'')
    if(!/^\d{4,6}$/.test(pin)) { alert('Please enter a valid pincode (4-6 digits).'); return }

    // Payment validation and details
    let paymentDetails = undefined
    if (form.payment === 'upi') {
      const upi = (pay.upiId||'').trim()
      if (!upi || !upi.includes('@')) { alert('Enter a valid UPI ID (e.g., name@bank).'); return }
      paymentDetails = { upiId: upi }
    } else if (form.payment === 'card') {
      const name = (pay.cardName||'').trim()
      const number = String(pay.cardNumber||'').replace(/\s+/g,'')
      const expiry = (pay.cardExpiry||'').trim()
      if (!name) { alert('Enter name on card.'); return }
      if (!/^\d{12,19}$/.test(number)) { alert('Enter a valid card number (12-19 digits).'); return }
      if (!/^(0[1-9]|1[0-2])\/(\d{2})$/.test(expiry)) { alert('Enter expiry as MM/YY.'); return }
      paymentDetails = { cardName: name, cardNumber: number, cardExpiry: expiry }
    } else if (!form.payment) {
      alert('Please select a payment method.'); return
    }

    const order = { items: cart, total, shippingAddress: { ...form }, paymentMethod: form.payment, paymentDetails }
    try {
      await placeOrder(order)
      alert('Order placed successfully! You can track your order in your profile.')
      setModalOpen(false)
      setPay({ upiId:'', cardName:'', cardNumber:'', cardExpiry:'' })
      window.location.href = '/profile'
    } catch (err) {
      alert(err.message || 'Error placing order. Please try again.')
    }
  }

  return (
    <>
      <div className="cart-page">
        <h2>Your Shopping Cart</h2>
        <div id="cart-items">
          {cart.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            cart.map((item, index) => (
              <div className="cart-item" key={index}>
                <img src={item.image} alt={item.name} />
                <div className="cart-details">
                  <h3>{item.name}</h3>
                  <p>₹{item.price} x {item.qty} = ₹{item.price * item.qty}</p>
                  <div className="qty-controls">
                    <button className="qty-btn" onClick={()=> decreaseQty(index)}>-</button>
                    <span>{item.qty}</span>
                    <button className="qty-btn" onClick={()=> increaseQty(index)}>+</button>
                  </div>
                </div>
                <button className="remove-btn" onClick={()=> removeItem(index)}>Remove</button>
              </div>
            ))
          )}
        </div>
        <div className="cart-total" id="cart-total">Total: ₹{total}</div>
        <div style={{ textAlign:'right', marginTop:'1rem' }}>
          <button className="remove-btn" onClick={emptyCart}>🧹 Empty Cart</button>
          <button className="remove-btn order-btn" onClick={()=> setModalOpen(true)} disabled={cart.length===0}>🛍️ Place Order</button>
        </div>
      </div>

      {modalOpen && (
        <div className={`modal ${modalOpen ? 'open' : ''}`} id="orderModal" onClick={(e)=>{ if(e.target.classList.contains('modal')) setModalOpen(false) }}>
          <div className="modal-content">
            <span className="close-btn" onClick={()=> setModalOpen(false)}>&times;</span>
            <h2>📦 Complete Your Order</h2>
            <form id="order-form" onSubmit={onSubmit}>
              <div className="form-group">
                <label htmlFor="name">👤 Full Name:</label>
                <input id="name" value={form.name} onChange={e=> setForm({...form, name:e.target.value})} required placeholder="Enter your full name"/>
              </div>
              <div className="form-group">
                <label htmlFor="email">📧 Email:</label>
                <input id="email" type="email" value={form.email} onChange={e=> setForm({...form, email:e.target.value})} required placeholder="Enter your email"/>
              </div>
              <div className="form-group">
                <label htmlFor="phone">📱 Phone Number:</label>
                <input id="phone" value={form.phone} onChange={e=> setForm({...form, phone:e.target.value})} required placeholder="Enter your phone number"/>
              </div>
              <div className="form-group">
                <label htmlFor="address">🏠 Delivery Address:</label>
                <textarea id="address" value={form.address} onChange={e=> setForm({...form, address:e.target.value})} required placeholder="Enter your complete delivery address"/>
              </div>
              <div className="form-row">
                <div className="form-group" style={{flex:1, marginRight:'0.5rem'}}>
                  <label htmlFor="state">🏷️ State:</label>
                  <input id="state" value={form.state} onChange={e=> setForm({...form, state:e.target.value})} required placeholder="Enter state"/>
                </div>
                <div className="form-group" style={{flex:1, marginLeft:'0.5rem'}}>
                  <label htmlFor="pincode">📮 Pincode:</label>
                  <input id="pincode" value={form.pincode} onChange={e=> setForm({...form, pincode:e.target.value})} required placeholder="Enter pincode"/>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="landmark">📍 Landmark (optional):</label>
                <input id="landmark" value={form.landmark} onChange={e=> setForm({...form, landmark:e.target.value})} placeholder="E.g. Near City Mall, Opposite Park"/>
              </div>
              <div className="form-group">
                <label htmlFor="payment">💳 Payment Method:</label>
                <select id="payment" value={form.payment} onChange={e=> { setForm({...form, payment:e.target.value}); setPay({ upiId:'', cardName:'', cardNumber:'', cardExpiry:'' }) }} required>
                  <option value="">Select payment method</option>
                  <option value="cod">Cash on Delivery 💵</option>
                  <option value="card">Credit/Debit Card 💳</option>
                  <option value="upi">UPI 📱</option>
                </select>
              </div>

              {form.payment === 'upi' && (
                <div className="form-group">
                  <label htmlFor="upiId">UPI ID</label>
                  <input id="upiId" value={pay.upiId} onChange={(e)=> setPay({...pay, upiId:e.target.value})} placeholder="yourname@bank" required />
                </div>
              )}

              {form.payment === 'card' && (
                <>
                  <div className="form-group">
                    <label htmlFor="cardName">Name on Card</label>
                    <input id="cardName" value={pay.cardName} onChange={(e)=> setPay({...pay, cardName:e.target.value})} placeholder="As printed on card" required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="cardNumber">Card Number</label>
                    <input id="cardNumber" value={pay.cardNumber} onChange={(e)=> setPay({...pay, cardNumber:e.target.value})} placeholder="1234 5678 9012 3456" required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="cardExpiry">Expiry (MM/YY)</label>
                    <input id="cardExpiry" value={pay.cardExpiry} onChange={(e)=> setPay({...pay, cardExpiry:e.target.value})} placeholder="MM/YY" required />
                  </div>
                </>
              )}
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={()=> setModalOpen(false)}>Cancel</button>
                <button type="submit" className="confirm-btn">Confirm Order</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="footer">
        <p>© 2025 E-Shop. Built with ❤️</p>
      </footer>
    </>
  )
}
