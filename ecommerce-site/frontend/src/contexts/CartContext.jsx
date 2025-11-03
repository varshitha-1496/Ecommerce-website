import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

export function CartProvider({ children }){
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cart')) || [] } catch { return [] }
  })
  const { token, api } = useAuth()

  useEffect(() => { localStorage.setItem('cart', JSON.stringify(cart)) }, [cart])
  // Clear cart when user logs out
  useEffect(() => {
    if (!token) {
      setCart([])
      localStorage.removeItem('cart')
    }
  }, [token])

  const totalItems = useMemo(() => cart.reduce((s,i)=> s + (i.qty||1), 0), [cart])
  const totalPrice = useMemo(() => cart.reduce((s,i)=> s + i.price * (i.qty||1), 0), [cart])

  const addToCart = (product) => {
    setCart(prev => {
      const idx = prev.findIndex(p => p.id === product.id)
      if (idx >= 0) {
        const next = [...prev]; next[idx] = { ...next[idx], qty: (next[idx].qty||1) + 1 }; return next
      }
      return [...prev, { ...product, qty: 1 }]
    })
    alert(`${product.name} added to cart!`)
  }
  const increaseQty = (index) => setCart(prev => prev.map((it,i)=> i===index? { ...it, qty:(it.qty||1)+1 }: it))
  const decreaseQty = (index) => setCart(prev => prev.flatMap((it,i)=>{
    if(i!==index) return it; const qty=(it.qty||1)-1; return qty>0? { ...it, qty }: []
  }))
  const removeItem = (index) => setCart(prev => prev.filter((_,i)=> i!==index))
  const emptyCart = () => setCart([])

  const placeOrder = async (order) => {
    if (!token) throw new Error('Not authenticated')
    const res = await fetch(`${api}/orders`, { method:'POST', headers:{ 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(order) })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Error placing order')
    setCart([])
    return data
  }

  const value = { cart, setCart, totalItems, totalPrice, addToCart, increaseQty, decreaseQty, removeItem, emptyCart, placeOrder }
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(){ return useContext(CartContext) }
