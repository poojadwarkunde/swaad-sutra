import { useState, useEffect } from 'react'

function MenuPage() {
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState({})
  const [showCheckout, setShowCheckout] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [flatNumber, setFlatNumber] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [collectDate, setCollectDate] = useState('')
  const [collectTime, setCollectTime] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderTime, setOrderTime] = useState(null)
  
  // User authentication state
  const [user, setUser] = useState(null)
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [authName, setAuthName] = useState('')
  const [authMobile, setAuthMobile] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  // Fetch menu items from API
  const fetchMenuItems = async () => {
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        setMenuItems(data)
      }
    } catch (err) {
      console.error('Failed to fetch menu:', err)
    } finally {
      setLoading(false)
    }
  }
  
  // Load user from localStorage and fetch menu on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('swaadSutraUser')
    if (savedUser) {
      const userData = JSON.parse(savedUser)
      setUser(userData)
      setCustomerName(userData.name)
      setPhone(userData.mobile || '')
    }
    fetchMenuItems()
  }, [])

  // Authentication handlers
  const handleAuth = async () => {
    setAuthError('')
    setAuthLoading(true)
    
    try {
      if (authMode === 'register') {
        if (!authName.trim()) {
          setAuthError('Please enter your name')
          setAuthLoading(false)
          return
        }
        if (!/^\d{10}$/.test(authMobile)) {
          setAuthError('Please enter valid 10-digit mobile number')
          setAuthLoading(false)
          return
        }
        
        const response = await fetch('/api/users/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: authName.trim(), mobile: authMobile })
        })
        
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Registration failed')
        
        setUser(data.user)
        localStorage.setItem('swaadSutraUser', JSON.stringify(data.user))
        setCustomerName(data.user.name)
        setShowAuth(false)
        setAuthName('')
        setAuthMobile('')
      } else {
        if (!/^\d{10}$/.test(authMobile)) {
          setAuthError('Please enter valid 10-digit mobile number')
          setAuthLoading(false)
          return
        }
        
        const response = await fetch('/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobile: authMobile })
        })
        
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Login failed')
        
        setUser(data.user)
        localStorage.setItem('swaadSutraUser', JSON.stringify(data.user))
        setCustomerName(data.user.name)
        setShowAuth(false)
        setAuthMobile('')
      }
    } catch (err) {
      setAuthError(err.message)
    } finally {
      setAuthLoading(false)
    }
  }
  
  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('swaadSutraUser')
    setCustomerName('')
  }

  const updateQuantity = (itemId, delta) => {
    setCart(prev => {
      const current = prev[itemId] || 0
      const newQty = Math.max(0, current + delta)
      if (newQty === 0) {
        const { [itemId]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [itemId]: newQty }
    })
  }

  const setQuantity = (itemId, qty) => {
    const newQty = Math.max(0, parseInt(qty) || 0)
    setCart(prev => {
      if (newQty === 0) {
        const { [itemId]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [itemId]: newQty }
    })
  }

  const handleQuantityClick = (itemId) => {
    const currentQty = cart[itemId] || 0
    const input = prompt(`Enter quantity for this item:`, currentQty)
    if (input !== null) {
      setQuantity(itemId, input)
    }
  }

  const cartItems = menuItems.filter(item => cart[item.id] > 0).map(item => ({
    ...item,
    qty: cart[item.id],
    subtotal: item.price * cart[item.id]
  }))

  const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0)
  const totalItems = cartItems.reduce((sum, item) => sum + item.qty, 0)

  // Format phone for WhatsApp
  const formatPhoneForWhatsApp = (phoneNum) => {
    if (!phoneNum) return null
    let cleaned = phoneNum.replace(/\D/g, '')
    if (cleaned.startsWith('0')) cleaned = cleaned.substring(1)
    if (cleaned.length === 10) cleaned = '91' + cleaned
    if (cleaned.length === 12 && cleaned.startsWith('91')) return cleaned
    if (cleaned.length >= 12) return cleaned
    return null
  }

  // Send WhatsApp message for new order
  const sendOrderConfirmationWhatsApp = (order) => {
    const phoneFormatted = formatPhoneForWhatsApp(order.phone)
    if (!phoneFormatted) return
    
    const itemsList = order.items.map(i => `${i.name} x${i.qty}`).join('\n• ')
    const collectInfo = order.collectDate ? `📅 Collection: ${order.collectDate} ${order.collectTime || ''}` : ''
    
    const message = `🍽️ *Swaad Sutra - Order Confirmed!*

📋 Order #${order.id || order.orderId}
👤 ${order.customerName}
🏠 Flat: ${order.flatNumber}
${collectInfo}

🛍️ *Items:*
• ${itemsList}

💰 *Total: ₹${order.totalAmount}*

✅ We've received your order and will start preparing soon!

Thank you for ordering from Swaad Sutra! 🙏`

    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/${phoneFormatted}?text=${encodedMessage}`, '_blank')
  }

  const handlePlaceOrder = async () => {
    if (!customerName.trim() || !flatNumber.trim()) {
      alert('Please enter your name and flat number')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          flatNumber: flatNumber.trim(),
          phone: phone.trim(),
          items: cartItems.map(({ name, qty, unit, price }) => ({ name, qty, unit, price })),
          totalAmount,
          collectDate,
          collectTime,
          notes: notes.trim()
        })
      })

      if (!response.ok) throw new Error('Failed to place order')
      
      const orderData = await response.json()

      // Send WhatsApp confirmation if phone provided
      if (phone.trim()) {
        sendOrderConfirmationWhatsApp({
          ...orderData,
          customerName: customerName.trim(),
          flatNumber: flatNumber.trim(),
          phone: phone.trim(),
          items: cartItems.map(({ name, qty, unit, price }) => ({ name, qty, unit, price })),
          totalAmount,
          collectDate,
          collectTime
        })
      }

      setOrderTime(new Date())
      setOrderSuccess(true)
      setCart({})
      setShowCheckout(false)
      if (!user) {
        setCustomerName('')
        setPhone('')
      }
      setFlatNumber('')
      setCollectDate('')
      setCollectTime('')
      setNotes('')
    } catch (error) {
      alert('Failed to place order. Please try again.')
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  const formatDateTime = (date) => {
    if (!date) return ''
    return date.toLocaleString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading menu...</div>
      </div>
    )
  }

  if (orderSuccess) {
    return (
      <div className="container">
        <div className="success-screen">
          <div className="success-icon">✅</div>
          <h1>Order Placed!</h1>
          <div className="order-datetime">
            🕐 {formatDateTime(orderTime)}
          </div>
          <p>Your delicious food is being prepared.</p>
          <p className="success-note">Payment will be collected on delivery.</p>
          <button 
            className="btn btn-primary"
            onClick={() => setOrderSuccess(false)}
          >
            Order More
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <header className="header">
        <div className="header-top">
          <div className="brand-section">
            <div className="brand-logo">🍽️</div>
            <div>
              <h1>Swaad Sutra</h1>
              <p className="subtitle">Homemade with Love</p>
            </div>
          </div>
          <div className="header-actions">
            {user ? (
              <div className="user-info">
                <span className="user-name">👤 {user.name}</span>
                <button className="logout-btn" onClick={handleLogout}>Logout</button>
              </div>
            ) : (
              <button className="login-btn" onClick={() => setShowAuth(true)}>
                👤 Login
              </button>
            )}
          </div>
        </div>
      </header>

      <section className="menu-section">
        <h2>Today's Menu</h2>
        {menuItems.length === 0 ? (
          <div className="no-menu">No items available today. Please check back later!</div>
        ) : (
          <div className="menu-grid">
            {menuItems.map(item => (
              <div key={item.id} className="menu-card">
                <div className="menu-card-left">
                  <div className="menu-image-wrapper">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="menu-image"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'flex'
                      }}
                    />
                    <span className="menu-emoji-fallback" style={{display: 'none'}}>{item.emoji}</span>
                  </div>
                  <div className="menu-info">
                    <span className="menu-name">{item.name}</span>
                    <span className="menu-price">₹{item.price}<span className="menu-unit">/{item.unit}</span></span>
                  </div>
                </div>
                <div className="qty-controls">
                  <button 
                    className="qty-btn"
                    onClick={() => updateQuantity(item.id, -1)}
                    disabled={!cart[item.id]}
                  >
                    −
                  </button>
                  <span 
                    className="qty-value qty-clickable"
                    onClick={() => handleQuantityClick(item.id)}
                    title="Tap to enter quantity"
                  >
                    {cart[item.id] || 0}
                  </span>
                  <button 
                    className="qty-btn qty-btn-add"
                    onClick={() => updateQuantity(item.id, 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {totalItems > 0 && !showCheckout && (
        <div className="cart-summary">
          <div className="cart-info">
            <span className="cart-count">{totalItems} item{totalItems > 1 ? 's' : ''}</span>
            <span className="cart-total">₹{totalAmount}</span>
          </div>
          {user ? (
            <button 
              className="btn btn-primary"
              onClick={() => setShowCheckout(true)}
            >
              Place Order →
            </button>
          ) : (
            <button 
              className="btn btn-primary login-required-btn"
              onClick={() => setShowAuth(true)}
            >
              🔐 Login to Order →
            </button>
          )}
        </div>
      )}

      {showCheckout && (
        <div className="checkout-overlay" onClick={() => setShowCheckout(false)}>
          <div className="checkout-modal" onClick={e => e.stopPropagation()}>
            <h2>Complete Your Order</h2>
            
            <div className="order-summary">
              {cartItems.map(item => (
                <div key={item.id} className="summary-item">
                  <span>{item.emoji} {item.name} × {item.qty}</span>
                  <span>₹{item.price * item.qty}</span>
                </div>
              ))}
              <div className="summary-total">
                <strong>Total</strong>
                <strong>₹{totalAmount}</strong>
              </div>
            </div>

            <div className="checkout-form">
              <input
                type="text"
                placeholder="Your Name *"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="input"
                autoFocus
              />
              <input
                type="text"
                placeholder="Flat Number (e.g., A-101) *"
                value={flatNumber}
                onChange={e => setFlatNumber(e.target.value)}
                className="input"
              />
              <input
                type="tel"
                placeholder="Mobile Number (for WhatsApp updates)"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="input"
                maxLength={10}
              />
              
              <div className="collect-datetime">
                <label className="instructions-label">
                  📅 When do you want to collect?
                </label>
                <div className="datetime-inputs">
                  <input
                    type="date"
                    value={collectDate}
                    onChange={e => setCollectDate(e.target.value)}
                    className="input date-input"
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <input
                    type="time"
                    value={collectTime}
                    onChange={e => setCollectTime(e.target.value)}
                    className="input time-input"
                  />
                </div>
              </div>

              <div className="special-instructions">
                <label className="instructions-label">
                  📝 Special Instructions (optional)
                </label>
                <textarea
                  placeholder="e.g., Less oil, Extra spicy, No onion..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="input textarea"
                  rows={2}
                />
              </div>
            </div>

            <div className="checkout-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowCheckout(false)}
              >
                Back
              </button>
              <button 
                className="btn btn-primary"
                onClick={handlePlaceOrder}
                disabled={submitting}
              >
                {submitting ? 'Placing...' : 'Confirm Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuth && (
        <div className="auth-overlay" onClick={() => setShowAuth(false)}>
          <div className="auth-modal" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowAuth(false)}>×</button>
            <h2>{authMode === 'login' ? '👤 Login' : '📝 Register'}</h2>
            
            {authError && <div className="auth-error">{authError}</div>}
            
            <div className="auth-form">
              {authMode === 'register' && (
                <input
                  type="text"
                  placeholder="Your Name"
                  value={authName}
                  onChange={e => setAuthName(e.target.value)}
                  className="input"
                />
              )}
              <input
                type="tel"
                placeholder="Mobile Number (10 digits)"
                value={authMobile}
                onChange={e => setAuthMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="input"
                maxLength={10}
              />
              
              <button 
                className="btn btn-primary auth-submit"
                onClick={handleAuth}
                disabled={authLoading}
              >
                {authLoading ? 'Please wait...' : (authMode === 'login' ? 'Login' : 'Register')}
              </button>
            </div>
            
            <div className="auth-switch">
              {authMode === 'login' ? (
                <p>New user? <button onClick={() => { setAuthMode('register'); setAuthError(''); }}>Register here</button></p>
              ) : (
                <p>Already registered? <button onClick={() => { setAuthMode('login'); setAuthError(''); }}>Login here</button></p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MenuPage
