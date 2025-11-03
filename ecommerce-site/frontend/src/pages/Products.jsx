import React, { useMemo, useState } from 'react'
import { products } from '../data/products'
import { useCart } from '../contexts/CartContext'

export default function Products(){
  const { addToCart } = useCart()
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState('')

  const list = useMemo(() => {
    const q = (submitted || '').trim().toLowerCase()
    if (!q) return products
    return products.filter(p => p.name.toLowerCase().includes(q))
  }, [submitted])

  const onSearch = (e) => {
    e?.preventDefault()
    setSubmitted(query)
  }
  return (
    <section className="products">
      <h2>Our Products</h2>
      <form onSubmit={onSearch} style={{ display:'flex', justifyContent:'center', gap:'0.5rem', margin:'0 0 1rem' }}>
        <input
          type="text"
          placeholder="Search products..."
          value={query}
          onChange={(e)=> setQuery(e.target.value)}
          style={{ padding:'0.6rem 0.8rem', minWidth: 260, border:'2px solid #e0e0e0', borderRadius:8 }}
        />
        <button type="submit" className="auth-btn" style={{ width:'auto', padding:'0.6rem 1rem' }}>Search</button>
      </form>
      <div className="product-list" id="product-list">
        {list.map(p => (
          <div className="product-card" key={p.id}>
            <img src={p.image} alt={p.name} />
            <div className="product-info">
              <h3>{p.name}</h3>
              <p>₹{p.price}</p>
              <button onClick={()=> addToCart(p)}>Add to Cart</button>
            </div>
          </div>
        ))}
      </div>
      <footer className="footer colorful-footer">
        <p>© 2025 E-Shop. All rights reserved.</p>
      </footer>
    </section>
  )
}
