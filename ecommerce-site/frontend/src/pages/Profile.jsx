import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Profile(){
  const { token, user, setUser, api, logout } = useAuth()
  const [orders, setOrders] = useState([])
  const [tab, setTab] = useState('orders')
  const [name, setName] = useState(user?.name || '')
  const [password, setPassword] = useState('')

  useEffect(() => { setName(user?.name || '') }, [user])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${api}/orders`, { headers: { Authorization: `Bearer ${token}` } })
        const data = await res.json()
        if (res.ok) setOrders(data.orders || [])
      } catch {}
    }
    load()
  }, [api, token])

  const canCancel = (status) => ['Pending','Processing'].includes(String(status))
  const cancelOrder = async (id) => {
    if (!confirm('Are you sure you want to cancel this order?')) return
    try {
      const res = await fetch(`${api}/orders/${id}/cancel`, { method:'PUT', headers:{ Authorization:`Bearer ${token}` } })
      const data = await res.json()
      if(!res.ok) throw new Error(data.message || 'Error cancelling order')
      setOrders(prev => prev.map(o => o._id === id ? data.order : o))
    } catch (e) {
      alert(e.message)
    }
  }

  const update = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`${api}/profile/update`, { method:'PUT', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ name, password }) })
      const data = await res.json()
      if(res.ok){
        setUser({ ...(user||{}), name })
        alert('Profile updated successfully!')
        setPassword('')
      } else {
        alert(data.message || 'Error updating profile')
      }
    } catch (e) {
      alert('Error updating profile. Please try again later.')
    }
  }

  return (
    <>
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">👤</div>
          <div className="profile-info">
            <h2 id="profile-name">{user?.name}</h2>
            <p id="profile-email">{user?.email}</p>
          </div>
        </div>

        <div className="profile-tabs">
          <button className={`tab-btn ${tab==='orders'?'active':''}`} onClick={()=> setTab('orders')} data-tab="orders">My Orders</button>
          <button className={`tab-btn ${tab==='settings'?'active':''}`} onClick={()=> setTab('settings')} data-tab="settings">Settings</button>
          <button className="tab-btn logout-btn" onClick={logout}>Logout</button>
        </div>

        {tab==='orders' && (
          <div className="tab-content" id="orders-tab">
            <h3>Order History</h3>
            <div className="orders-list" id="orders-list">
              {orders && orders.length > 0 ? (
                orders.map(order => (
                  <div className="order-card" key={order._id}>
                    <div className="order-header">
                      <h4>Order #{String(order._id).slice(-6)}</h4>
                      <span className={`order-status ${String(order.status||'').toLowerCase()}`}>{order.status}</span>
                    </div>
                    <div className="order-date">Ordered on: {new Date(order.createdAt).toLocaleDateString()}</div>
                    {order.estimatedDelivery && (
                      <div className="order-date">Estimated delivery: {new Date(order.estimatedDelivery).toLocaleDateString()}</div>
                    )}
                    <div className="order-shipping">
                      <h5>Shipping To:</h5>
                      <p>{order?.shippingAddress?.name} • {order?.shippingAddress?.phone}</p>
                      <p>{order?.shippingAddress?.address}{order?.shippingAddress?.landmark ? ', ' + order?.shippingAddress?.landmark : ''}</p>
                      <p>{order?.shippingAddress?.state} - {order?.shippingAddress?.pincode}</p>
                    </div>
                    <div className="order-items">
                      {(order.items||[]).map((item, idx) => (
                        <div className="order-item" key={idx}>
                          <img src={item.image} alt={item.name} />
                          <div className="item-details">
                            <p>{item.name}</p>
                            <p>Quantity: {item.quantity || item.qty}</p>
                            <p>₹{item.price}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="order-total">Total: ₹{order.total}</div>
                    {canCancel(order.status) && (
                      <div style={{ display:'flex', justifyContent:'flex-end', marginTop:'0.5rem' }}>
                        <button className="cancel-btn" onClick={()=> cancelOrder(order._id)}>Cancel Order</button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="no-orders">No orders yet</p>
              )}
            </div>
          </div>
        )}

        {tab==='settings' && (
          <div className="tab-content" id="settings-tab">
            <h3>Account Settings</h3>
            <form id="profile-form" className="profile-form" onSubmit={update}>
              <div className="form-group">
                <label htmlFor="update-name">Full Name</label>
                <input id="update-name" value={name} onChange={e=> setName(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="update-email">Email</label>
                <input id="update-email" value={user?.email || ''} readOnly />
              </div>
              <div className="form-group">
                <label htmlFor="update-password">New Password</label>
                <input id="update-password" type="password" value={password} onChange={e=> setPassword(e.target.value)} placeholder="Leave blank to keep current password" />
              </div>
              <button type="submit" className="update-btn">Update Profile</button>
            </form>
          </div>
        )}
      </div>

      <footer className="footer">
        <p>© 2025 E-Shop. Built by Varshitha with ❤️</p>
      </footer>
    </>
  )
}
