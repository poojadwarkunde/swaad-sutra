import { useState } from 'react'

const MENU_ITEMS = [
  { id: 1, name: 'Wheat Chapati', price: 15, unit: 'pc', emoji: '🫓', image: '/images/Chapati.avif' },
  { id: 2, name: 'Puran Poli', price: 25, unit: 'pc', emoji: '🥞', image: '/images/Puran Poli.jpeg' },
  { id: 3, name: 'Jawar Bhakari', price: 20, unit: 'pc', emoji: '🫓', image: '/images/jawar-bhakari.webp' },
  { id: 4, name: 'Bajara Bhakari', price: 20, unit: 'pc', emoji: '🫓', image: '/images/jawar-bhakari.webp' },
  { id: 5, name: 'Kalnyachi Bhakari', price: 25, unit: 'pc', emoji: '🫓', image: '/images/jawar-bhakari.webp' },
  { id: 6, name: 'Methi Paratha', price: 25, unit: 'pc', emoji: '🥙', image: '/images/Methi_Paratha.webp' },
  { id: 7, name: 'Kothimbir Vadi', price: 100, unit: '12pc', emoji: '🌿', image: '/images/kothimbir-vadi.jpg' },
  { id: 8, name: 'Idli Chutney', price: 60, unit: '4pc', emoji: '⚪', image: '/images/Idli-chutney.jpg' },
  { id: 9, name: 'Medu Vada Chutney', price: 60, unit: '4pc', emoji: '🍩', image: '/images/Medu-Vada.jpg' },
  { id: 10, name: 'Pohe', price: 30, unit: 'Plate', emoji: '🍚', image: '/images/pohe.webp' },
  { id: 11, name: 'Upma', price: 30, unit: 'Plate', emoji: '🍲', image: '/images/upma.jpg' },
  { id: 12, name: 'Sabudana Khichadi', price: 50, unit: 'Plate', emoji: '🥣', image: '/images/sabudana-khichdi.jpg' },
  { id: 13, name: 'Appe Chutney', price: 60, unit: '5pc', emoji: '🔵', image: '/images/appe-chutney.webp' },
  { id: 14, name: 'Til Poli', price: 30, unit: 'pc', emoji: '🥮', image: '/images/2-til-gul-poli-Maharashtrian-gulachi-poli-makar-sankrant-special-ladoo-festive-Indian-dessert-puran-poli-viral-video-recipe-trending-rustic-tadka-vegetarian-snacks-lunch-dinner-lohori-1.png' },
  { id: 15, name: 'Sabudana Vada', price: 60, unit: '4pc', emoji: '🥔', image: '/images/sabudana-vada.webp' },
  { id: 16, name: 'Vermicelli Kheer', price: 50, unit: 'Bowl', emoji: '🍮', image: '/images/Seviyan-Kheer.jpg' },
  { id: 17, name: 'Onion Pakoda (Kanda Bhaje)', price: 60, unit: 'Plate', emoji: '🧅', image: '/images/Onion-Pakoda.webp' },
]

function MenuPage() {
  const [cart, setCart] = useState({})
  const [showCheckout, setShowCheckout] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [flatNumber, setFlatNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [collectDate, setCollectDate] = useState('')
  const [collectTime, setCollectTime] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderTime, setOrderTime] = useState(null)

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

  const cartItems = MENU_ITEMS.filter(item => cart[item.id] > 0).map(item => ({
    ...item,
    qty: cart[item.id],
    subtotal: item.price * cart[item.id]
  }))

  const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0)
  const totalItems = cartItems.reduce((sum, item) => sum + item.qty, 0)

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
          items: cartItems.map(({ name, qty, unit, price }) => ({ name, qty, unit, price })),
          totalAmount,
          collectDate,
          collectTime,
          notes: notes.trim()
        })
      })

      if (!response.ok) throw new Error('Failed to place order')

      setOrderTime(new Date())
      setOrderSuccess(true)
      setCart({})
      setShowCheckout(false)
      setCustomerName('')
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
        <div className="brand-logo">🍽️</div>
        <h1>Swaad Sutra</h1>
        <p className="subtitle">Homemade with Love</p>
      </header>

      <section className="menu-section">
        <h2>Today's Menu</h2>
        <div className="menu-grid">
          {MENU_ITEMS.map(item => (
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
                <span className="qty-value">{cart[item.id] || 0}</span>
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
      </section>

      {totalItems > 0 && !showCheckout && (
        <div className="cart-summary">
          <div className="cart-info">
            <span className="cart-count">{totalItems} item{totalItems > 1 ? 's' : ''}</span>
            <span className="cart-total">₹{totalAmount}</span>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => setShowCheckout(true)}
          >
            Place Order →
          </button>
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
    </div>
  )
}

export default MenuPage
