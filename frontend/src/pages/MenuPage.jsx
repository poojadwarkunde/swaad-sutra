import { useState, useEffect } from 'react'

function MenuPage() {
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState({})
  const [searchQuery, setSearchQuery] = useState('')
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
  
  // Order history state
  const [showOrderHistory, setShowOrderHistory] = useState(false)
  const [orderHistory, setOrderHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  
  // Image zoom state
  const [zoomImage, setZoomImage] = useState(null)
  
  // Custom items state
  const [customItems, setCustomItems] = useState([])
  const [newCustomItem, setNewCustomItem] = useState({ name: '', qty: 1, price: '' })
  
  // Ratings state
  const [productRatings, setProductRatings] = useState({})
  
  // Feedback screenshots state
  const [feedbackScreenshots, setFeedbackScreenshots] = useState([])
  const [zoomFeedback, setZoomFeedback] = useState(null)
  
  // Written reviews state
  const [writtenReviews, setWrittenReviews] = useState([])

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
  
  // Fetch product ratings
  const fetchRatings = async () => {
    try {
      const response = await fetch('/api/ratings/all')
      if (response.ok) {
        const data = await response.json()
        setProductRatings(data)
      }
    } catch (err) {
      console.error('Failed to fetch ratings:', err)
    }
  }
  
  // Fetch feedback screenshots
  const fetchFeedbackScreenshots = async () => {
    try {
      const response = await fetch('/api/feedback-screenshots')
      if (response.ok) {
        const data = await response.json()
        setFeedbackScreenshots(data)
      }
    } catch (err) {
      console.error('Failed to fetch feedback screenshots:', err)
    }
  }
  
  // Fetch written reviews
  const fetchWrittenReviews = async () => {
    try {
      const response = await fetch('/api/reviews')
      if (response.ok) {
        const data = await response.json()
        setWrittenReviews(data)
      }
    } catch (err) {
      console.error('Failed to fetch written reviews:', err)
    }
  }
  
  // Star display helper - defaults to 5 stars if no ratings
  const renderStars = (rating, count) => {
    const displayRating = rating && count > 0 ? rating : 5
    const fullStars = Math.floor(displayRating)
    const hasHalf = displayRating % 1 >= 0.5
    return (
      <div className="product-rating">
        <span className="stars">
          {'★'.repeat(fullStars)}
          {hasHalf && '½'}
          {'☆'.repeat(5 - fullStars - (hasHalf ? 1 : 0))}
        </span>
        {count > 0 && <span className="rating-count">({count})</span>}
      </div>
    )
  }

  // Fetch order history for logged in user
  const fetchOrderHistory = async () => {
    if (!user?.mobile) return
    
    setHistoryLoading(true)
    try {
      const response = await fetch(`/api/orders/history/${user.mobile}`)
      if (response.ok) {
        const data = await response.json()
        setOrderHistory(data)
      }
    } catch (err) {
      console.error('Failed to fetch order history:', err)
    } finally {
      setHistoryLoading(false)
    }
  }

  // Get status color and emoji
  const getStatusInfo = (status) => {
    switch (status) {
      case 'NEW': return { color: '#f59e0b', bg: '#fef3c7', emoji: '🆕', text: 'Order Placed' }
      case 'COOKING': return { color: '#f97316', bg: '#ffedd5', emoji: '🍳', text: 'Being Prepared' }
      case 'READY': return { color: '#10b981', bg: '#d1fae5', emoji: '✅', text: 'Ready for Pickup' }
      case 'DELIVERED': return { color: '#22c55e', bg: '#dcfce7', emoji: '🎉', text: 'Delivered' }
      case 'CANCELLED': return { color: '#ef4444', bg: '#fee2e2', emoji: '❌', text: 'Cancelled' }
      default: return { color: '#6b7280', bg: '#f3f4f6', emoji: '📋', text: status }
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
    fetchRatings()
    fetchFeedbackScreenshots()
    fetchWrittenReviews()
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

  const customItemsTotal = customItems.reduce((sum, item) => sum + (item.price || 0) * item.qty, 0)
  const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0) + customItemsTotal
  const totalItems = cartItems.reduce((sum, item) => sum + item.qty, 0) + customItems.reduce((sum, item) => sum + item.qty, 0)

  // Filter menu items based on search
  const filteredMenuItems = menuItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Custom item functions
  const addCustomItem = () => {
    if (!newCustomItem.name.trim()) return
    setCustomItems(prev => [...prev, { 
      id: `custom-${Date.now()}`, 
      name: newCustomItem.name.trim(), 
      qty: newCustomItem.qty || 1, 
      price: newCustomItem.price ? parseInt(newCustomItem.price) : 0,
      isCustom: true
    }])
    setNewCustomItem({ name: '', qty: 1, price: '' })
  }

  const removeCustomItem = (id) => {
    setCustomItems(prev => prev.filter(item => item.id !== id))
  }

  const updateCustomItemQty = (id, qty) => {
    if (qty < 1) return removeCustomItem(id)
    setCustomItems(prev => prev.map(item => item.id === id ? { ...item, qty } : item))
  }

  // Reorder - add items from previous order to cart
  const handleReorder = (order) => {
    const newCart = { ...cart }
    const newCustomItems = [...customItems]
    
    order.items.forEach(item => {
      if (item.isCustom) {
        // Add custom item
        newCustomItems.push({
          id: `custom-${Date.now()}-${Math.random()}`,
          name: item.name,
          qty: item.qty,
          price: item.price || 0,
          isCustom: true
        })
      } else {
        // Find matching menu item and add to cart
        const menuItem = menuItems.find(m => m.name === item.name)
        if (menuItem) {
          newCart[menuItem.id] = (newCart[menuItem.id] || 0) + item.qty
        }
      }
    })
    
    setCart(newCart)
    setCustomItems(newCustomItems)
    setShowOrderHistory(false)
    alert('Items added to cart! 🛒')
  }

  // Format phone for WhatsApp - accepts 10 digit Indian numbers
  const formatPhoneForWhatsApp = (phoneNum) => {
    if (!phoneNum) return null
    // Remove all non-digit characters
    let cleaned = phoneNum.toString().replace(/\D/g, '')
    // Remove leading 0 if present
    if (cleaned.startsWith('0')) cleaned = cleaned.substring(1)
    // Remove +91 or 91 prefix if already present
    if (cleaned.startsWith('91') && cleaned.length > 10) {
      cleaned = cleaned.substring(2)
    }
    // If we have 10 digits, add 91 prefix
    if (cleaned.length === 10) {
      return '91' + cleaned
    }
    // If already 12 digits with 91, return as is
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return cleaned
    }
    // For any valid-looking number, just add 91 if needed
    if (cleaned.length >= 10) {
      return cleaned.length === 10 ? '91' + cleaned : cleaned
    }
    return null
  }

  // Admin WhatsApp number for order notifications
  const ADMIN_WHATSAPP = '917722039146'

  // Send WhatsApp message to admin for new order
  const sendOrderToAdmin = (order) => {
    const itemsList = order.items.map(i => {
      const customTag = i.isCustom ? ' ⭐CUSTOM' : ''
      const priceInfo = i.price ? ` (₹${i.price})` : ' (Price TBD)'
      return `${i.name} x${i.qty}${i.isCustom ? priceInfo + customTag : ''}`
    }).join('\n• ')
    const collectInfo = order.collectDate ? `\n📅 Collection: ${order.collectDate} ${order.collectTime || ''}` : ''
    const hasCustomItems = order.items.some(i => i.isCustom)
    
    const message = `🔔 *NEW ORDER - Swaad Sutra*${hasCustomItems ? ' ⭐HAS CUSTOM ITEMS' : ''}

👤 Customer: ${order.customerName}
🏠 Flat: ${order.flatNumber}
📱 Phone: ${order.phone || 'Not provided'}${collectInfo}

🛍️ *Items:*
• ${itemsList}

💰 *Total: ₹${order.totalAmount}*${hasCustomItems ? ' (may vary for custom items)' : ''}
${order.notes ? `\n📝 Notes: ${order.notes}` : ''}

⏰ ${new Date().toLocaleString('en-IN')}`

    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodedMessage}`, '_blank')
  }

  const handlePlaceOrder = async () => {
    if (!customerName.trim()) {
      alert('Please enter your name')
      return
    }
    if (!flatNumber.trim()) {
      alert('Please enter your flat number')
      return
    }
    if (!phone.trim() || phone.length !== 10) {
      alert('Please enter a valid 10-digit mobile number')
      return
    }
    if (!collectDate) {
      alert('Please select a collection date')
      return
    }
    if (!collectTime) {
      alert('Please select a collection time')
      return
    }
    
    if (cartItems.length === 0 && customItems.length === 0) {
      alert('Please add at least one item to your order')
      return
    }

    // Combine cart items and custom items
    const allItems = [
      ...cartItems.map(({ name, qty, unit, price }) => ({ name, qty, unit, price })),
      ...customItems.map(({ name, qty, price }) => ({ name, qty, price, isCustom: true }))
    ]

    setSubmitting(true)
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          flatNumber: flatNumber.trim(),
          phone: phone.trim(),
          items: allItems,
          totalAmount,
          collectDate,
          collectTime,
          notes: notes.trim()
        })
      })

      if (!response.ok) throw new Error('Failed to place order')
      
      const orderData = await response.json()

      // Send WhatsApp notification to admin with order details
      sendOrderToAdmin({
        ...orderData,
        customerName: customerName.trim(),
        flatNumber: flatNumber.trim(),
        phone: phone.trim(),
        items: allItems,
        totalAmount,
        collectDate,
        collectTime,
        notes: notes.trim()
      })

      setOrderTime(new Date())
      setOrderSuccess(true)
      setCart({})
      setCustomItems([])
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
              <>
                <button 
                  className="orders-btn"
                  onClick={() => { setShowOrderHistory(true); fetchOrderHistory(); }}
                >
                  📋 My Orders
                </button>
                <div className="user-info">
                  <span className="user-name">👤 {user.name}</span>
                  <button className="logout-btn" onClick={handleLogout}>Logout</button>
                </div>
              </>
            ) : (
              <button className="login-btn" onClick={() => setShowAuth(true)}>
                👤 Login
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="main-content-layout">
        {/* Reviews Section - Top Right */}
        <aside className="reviews-sidebar">
          <h3>⭐ Customer Reviews</h3>
          
          {/* Written Reviews */}
          {writtenReviews.length > 0 && (
            <div className="written-reviews-section">
              <h4>💬 What Our Customers Say</h4>
              <div className="written-reviews-list">
                {writtenReviews.map(review => (
                  <div key={review.id} className="written-review-card">
                    <div className="review-header">
                      <span className="review-product">{review.productName}</span>
                      <span className="review-stars">
                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                      </span>
                    </div>
                    <p className="review-text">"{review.review}"</p>
                    <div className="review-footer">
                      <span className="review-author">— {review.customerName || 'Happy Customer'}</span>
                      <span className="review-date">
                        {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Screenshot Reviews */}
          {feedbackScreenshots.length > 0 && (
            <div className="screenshot-reviews-section">
              <h4>📸 Customer Screenshots</h4>
              <div className="reviews-sidebar-gallery">
                {feedbackScreenshots.map(screenshot => (
                  <div 
                    key={screenshot._id} 
                    className="review-sidebar-card"
                    onClick={() => setZoomFeedback(screenshot)}
                  >
                    <img 
                      src={screenshot.imageUrl} 
                      alt={screenshot.caption || 'Customer feedback'}
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                    {screenshot.customerName && (
                      <span className="review-sidebar-name">— {screenshot.customerName}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {writtenReviews.length === 0 && feedbackScreenshots.length === 0 && (
            <p className="no-reviews-sidebar">🌟 Reviews coming soon!</p>
          )}
        </aside>

        {/* Menu Section */}
        <section className="menu-section">
          <div className="menu-header">
            <h2>Today's Menu</h2>
            <div className="search-bar">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button className="clear-search" onClick={() => setSearchQuery('')}>×</button>
              )}
            </div>
          </div>
        {filteredMenuItems.length === 0 ? (
          <div className="no-menu">{searchQuery ? `No items found for "${searchQuery}"` : 'No items available today. Please check back later!'}</div>
        ) : (
          <div className="menu-grid">
            {filteredMenuItems.map(item => (
              <div key={item.id} className="menu-card">
                <div className="menu-card-left">
                  <div 
                    className="menu-image-wrapper zoomable"
                    onClick={() => setZoomImage({ src: item.image, name: item.name, emoji: item.emoji })}
                    title="Tap to zoom"
                  >
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
                    <span className="zoom-icon">🔍</span>
                  </div>
                  <div className="menu-info">
                    <span className="menu-name">{item.name}</span>
                    <span className="menu-price">₹{item.price}<span className="menu-unit">/{item.unit}</span></span>
                    {renderStars(productRatings[item.id]?.avgRating, productRatings[item.id]?.count || 0)}
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
      </div>

      {/* Feedback Zoom Modal */}
      {zoomFeedback && (
        <div className="zoom-overlay" onClick={() => setZoomFeedback(null)}>
          <div className="zoom-content feedback-zoom" onClick={e => e.stopPropagation()}>
            <button className="zoom-close" onClick={() => setZoomFeedback(null)}>×</button>
            
            {/* Navigation Buttons */}
            {feedbackScreenshots.length > 1 && (
              <>
                <button 
                  className="zoom-nav zoom-prev"
                  onClick={() => {
                    const currentIndex = feedbackScreenshots.findIndex(f => f._id === zoomFeedback._id)
                    const prevIndex = currentIndex === 0 ? feedbackScreenshots.length - 1 : currentIndex - 1
                    setZoomFeedback(feedbackScreenshots[prevIndex])
                  }}
                >
                  ‹
                </button>
                <button 
                  className="zoom-nav zoom-next"
                  onClick={() => {
                    const currentIndex = feedbackScreenshots.findIndex(f => f._id === zoomFeedback._id)
                    const nextIndex = currentIndex === feedbackScreenshots.length - 1 ? 0 : currentIndex + 1
                    setZoomFeedback(feedbackScreenshots[nextIndex])
                  }}
                >
                  ›
                </button>
              </>
            )}
            
            <img src={zoomFeedback.imageUrl} alt={zoomFeedback.caption || 'Customer feedback'} />
            {zoomFeedback.caption && <p className="zoom-caption">"{zoomFeedback.caption}"</p>}
            {zoomFeedback.customerName && <p className="zoom-customer">— {zoomFeedback.customerName}</p>}
            
            {/* Counter */}
            {feedbackScreenshots.length > 1 && (
              <p className="zoom-counter">
                {feedbackScreenshots.findIndex(f => f._id === zoomFeedback._id) + 1} / {feedbackScreenshots.length}
              </p>
            )}
          </div>
        </div>
      )}

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
            
            <div className="order-summary editable-summary">
              <p className="edit-hint">Tap +/− to edit or 🗑️ to remove</p>
              {cartItems.map(item => (
                <div key={item.id} className="summary-item editable">
                  <div className="summary-item-info">
                    <span className="item-name">{item.emoji} {item.name}</span>
                    <span className="item-price-each">₹{item.price}</span>
                  </div>
                  <div className="summary-item-controls">
                    <button className="qty-btn-sm" onClick={() => updateQuantity(item.id, -1)}>−</button>
                    <span className="qty-display">{item.qty}</span>
                    <button className="qty-btn-sm" onClick={() => updateQuantity(item.id, 1)}>+</button>
                    <button className="remove-btn-sm" onClick={() => setCart(prev => { const updated = {...prev}; delete updated[item.id]; return updated; })}>🗑️</button>
                  </div>
                  <span className="summary-item-total">₹{item.price * item.qty}</span>
                </div>
              ))}
              {customItems.map(item => (
                <div key={item.id} className="summary-item custom-item editable">
                  <div className="summary-item-info">
                    <span className="item-name">✨ {item.name}</span>
                    <span className="item-price-each">{item.price > 0 ? `₹${item.price}` : 'TBD'}</span>
                  </div>
                  <div className="summary-item-controls">
                    <button className="qty-btn-sm" onClick={() => setCustomItems(prev => prev.map(i => i.id === item.id ? {...i, qty: Math.max(1, i.qty - 1)} : i))}>−</button>
                    <span className="qty-display">{item.qty}</span>
                    <button className="qty-btn-sm" onClick={() => setCustomItems(prev => prev.map(i => i.id === item.id ? {...i, qty: i.qty + 1} : i))}>+</button>
                    <button className="remove-btn-sm" onClick={() => removeCustomItem(item.id)}>🗑️</button>
                  </div>
                  <span className="summary-item-total">{item.price > 0 ? `₹${item.price * item.qty}` : 'TBD'}</span>
                </div>
              ))}
              {cartItems.length === 0 && customItems.length === 0 && (
                <p className="empty-cart-warning">Your cart is empty. Add some items first!</p>
              )}
              <div className="summary-total">
                <strong>Total</strong>
                <strong>₹{totalAmount}{customItems.some(i => !i.price) ? '+' : ''}</strong>
              </div>
            </div>

            {/* Add Custom Item Section */}
            <div className="custom-item-section">
              <label className="instructions-label">➕ Add Custom Item (not in menu)</label>
              <div className="custom-item-form">
                <input
                  type="text"
                  placeholder="Item name"
                  value={newCustomItem.name}
                  onChange={e => setNewCustomItem(prev => ({ ...prev, name: e.target.value }))}
                  className="input custom-name-input"
                />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Qty"
                  value={newCustomItem.qty}
                  onChange={e => setNewCustomItem(prev => ({ ...prev, qty: parseInt(e.target.value.replace(/\D/g, '')) || 1 }))}
                  className="input custom-qty-input"
                />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Price (optional)"
                  value={newCustomItem.price}
                  onChange={e => setNewCustomItem(prev => ({ ...prev, price: e.target.value.replace(/\D/g, '') }))}
                  className="input custom-price-input"
                />
                <button 
                  type="button" 
                  className="btn btn-add-custom"
                  onClick={addCustomItem}
                  disabled={!newCustomItem.name.trim()}
                >
                  Add
                </button>
              </div>
              <small className="custom-item-hint">Add items not listed in the menu. Leave price empty if unsure.</small>
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
                placeholder="Mobile Number (10 digits) *"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="input"
                maxLength={10}
              />
              
              <div className="collect-datetime">
                <label className="instructions-label">
                  📅 When do you want to collect? *
                </label>
                <div className="datetime-inputs">
                  <input
                    type="date"
                    value={collectDate}
                    onChange={e => setCollectDate(e.target.value)}
                    className="input date-input"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                  <input
                    type="time"
                    value={collectTime}
                    onChange={e => setCollectTime(e.target.value)}
                    className="input time-input"
                    required
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

      {/* Order History Modal */}
      {showOrderHistory && (
        <div className="auth-overlay" onClick={() => setShowOrderHistory(false)}>
          <div className="order-history-modal" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowOrderHistory(false)}>×</button>
            <h2>📋 My Orders</h2>
            
            {historyLoading ? (
              <div className="history-loading">Loading your orders...</div>
            ) : orderHistory.length === 0 ? (
              <div className="no-orders-history">
                <span className="no-orders-icon">🛒</span>
                <p>No orders yet!</p>
                <p className="no-orders-sub">Your order history will appear here.</p>
              </div>
            ) : (
              <div className="order-history-list">
                {orderHistory.map(order => {
                  const statusInfo = getStatusInfo(order.status)
                  return (
                    <div key={order.id} className="history-order-card">
                      <div className="history-order-header">
                        <div className="history-order-date-title">📅 {order.orderDate}</div>
                        <div 
                          className="history-order-status"
                          style={{ color: statusInfo.color, background: statusInfo.bg }}
                        >
                          {statusInfo.emoji} {statusInfo.text}
                        </div>
                      </div>
                      
                      <div className="history-order-time">
                        🕐 {order.orderTime}
                      </div>
                      
                      <div className="history-order-items">
                        {order.items.map((item, idx) => (
                          <span key={idx} className="history-item-tag">
                            {item.name} × {item.qty}
                          </span>
                        ))}
                      </div>
                      
                      {order.collectDate && (
                        <div className="history-collect-info">
                          🕐 Collection: {order.collectDate} {order.collectTime || ''}
                        </div>
                      )}
                      
                      <div className="history-order-footer">
                        <span className="history-order-total">₹{order.totalAmount}</span>
                        <span className={`history-payment-status ${order.paymentStatus === 'PAID' ? 'paid' : 'pending'}`}>
                          {order.paymentStatus === 'PAID' ? '✓ Paid' : '○ Payment Pending'}
                        </span>
                      </div>
                      
                      {order.cancelReason && (
                        <div className="history-cancel-reason">
                          Reason: {order.cancelReason}
                        </div>
                      )}
                      
                      {order.status !== 'CANCELLED' && (
                        <button 
                          className="btn btn-reorder"
                          onClick={() => handleReorder(order)}
                        >
                          🔄 Reorder
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
            
            <button 
              className="btn btn-secondary history-close-btn"
              onClick={() => setShowOrderHistory(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {zoomImage && (
        <div className="zoom-overlay" onClick={() => setZoomImage(null)}>
          <div className="zoom-modal" onClick={e => e.stopPropagation()}>
            <button className="zoom-close-btn" onClick={() => setZoomImage(null)}>×</button>
            <img 
              src={zoomImage.src} 
              alt={zoomImage.name}
              className="zoom-image"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'flex'
              }}
            />
            <span className="zoom-emoji-fallback" style={{display: 'none'}}>{zoomImage.emoji}</span>
            <p className="zoom-title">{zoomImage.name}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default MenuPage
