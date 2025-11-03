import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Admin(){
  const { token, api } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(`${api}/admin/orders`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if(!res.ok) throw new Error(data.message || 'Failed to load orders')
      setOrders(data.orders || [])
    } catch (e){ setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(()=>{ load() }, [])

  const updateStatus = async (id, status) => {
    try{
      const res = await fetch(`${api}/admin/orders/${id}/status`, {
        method:'PUT',
        headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({ status })
      })
      const data = await res.json()
      if(!res.ok) throw new Error(data.message || 'Update failed')
      setOrders(prev => prev.map(o => o._id === id ? data.order : o))
    }catch(e){ alert(e.message) }
  }

  return (
    <div className="profile-container">
      <div className="tab-content">
        <h2>Admin Orders</h2>
        {loading && <p>Loading orders...</p>}
        {error && <p className="error">{error}</p>}
        {!loading && !orders.length && <p>No orders yet.</p>}
        {orders.map(order => (
          <div className="order-card" key={order._id}>
            <div className="order-header">
              <h4>Order #{String(order._id).slice(-6)} • {order.userId?.name} ({order.userId?.email})</h4>
              <span className={`order-status ${String(order.status).toLowerCase()}`}>{order.status}</span>
            </div>
            <div className="order-date">Ordered on: {new Date(order.createdAt).toLocaleString()}</div>
            <div className="order-items">
              {(order.items||[]).map((item, idx) => (
                <div className="order-item" key={idx}>
                  <img src={item.image} alt={item.name} />
                  <div className="item-details">
                    <p>{item.name}</p>
                    <p>Qty: {item.quantity}</p>
                    <p>₹{item.price}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="order-total">Total: ₹{order.total}</div>
            <div style={{ display:'flex', gap:'0.5rem', justifyContent:'flex-end', marginTop:'0.75rem' }}>
              <button className="confirm-btn" onClick={()=> updateStatus(order._id, 'Processing')}>Accept</button>
              <button className="cancel-btn" onClick={()=> updateStatus(order._id, 'Declined')}>Decline</button>
              <button className="auth-btn" style={{ width:'auto' }} onClick={()=> updateStatus(order._id, 'Completed')}>Mark Completed</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
