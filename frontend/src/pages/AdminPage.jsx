import { useState, useEffect } from 'react'

const STATUS_OPTIONS = ['NEW', 'COOKING', 'READY', 'DELIVERED', 'CANCELLED']
const PAYMENT_OPTIONS = ['PENDING', 'PAID', 'REFUNDED']
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'amount-high', label: 'Amount: High to Low' },
  { value: 'amount-low', label: 'Amount: Low to High' },
  { value: 'collect-time', label: 'Collection Time' },
]

function AdminPage() {
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('orders')
  
  // WhatsApp status
  const [whatsappStatus, setWhatsappStatus] = useState('disconnected')
  const [whatsappQR, setWhatsappQR] = useState(null)
  const [showQRModal, setShowQRModal] = useState(false)
  
  // Filter & Sort state
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [paymentFilter, setPaymentFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState('newest')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  
  // Cancel modal state
  const [cancelModal, setCancelModal] = useState({ show: false, orderId: null })
  const [cancelReason, setCancelReason] = useState('')
  
  // Feedback modal state
  const [feedbackModal, setFeedbackModal] = useState({ show: false, orderId: null })
  const [feedbackText, setFeedbackText] = useState('')
  
  // Notification modal state
  const [notifyModal, setNotifyModal] = useState({ show: false, order: null })
  
  // Product management state
  const [productModal, setProductModal] = useState({ show: false, product: null, isNew: false })
  const [productForm, setProductForm] = useState({
    name: '', price: 0, unit: 'pc', emoji: '🍽️', image: '', available: true
  })
  const [savingProduct, setSavingProduct] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [showUnavailable, setShowUnavailable] = useState(true)
  
  // Section collapse state
  const [collapsedSections, setCollapsedSections] = useState({
    completed: true // Auto-collapse completed orders
  })

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      if (!response.ok) throw new Error('Failed to fetch orders')
      const data = await response.json()
      setOrders(data)
      setError(null)
    } catch (err) {
      setError('Failed to load orders')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products?includeHidden=true')
      if (!response.ok) throw new Error('Failed to fetch products')
      const data = await response.json()
      setProducts(data)
    } catch (err) {
      console.error('Failed to load products:', err)
    }
  }

  // Fetch WhatsApp status
  const fetchWhatsAppStatus = async () => {
    try {
      const response = await fetch('/api/whatsapp/status')
      if (response.ok) {
        const data = await response.json()
        setWhatsappStatus(data.status)
        if (data.qrAvailable) {
          fetchWhatsAppQR()
        } else {
          setWhatsappQR(null)
        }
      }
    } catch (err) {
      console.error('Failed to fetch WhatsApp status:', err)
    }
  }

  const fetchWhatsAppQR = async () => {
    try {
      const response = await fetch('/api/whatsapp/qr')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.qr) {
          setWhatsappQR(data.qr)
        }
      }
    } catch (err) {
      console.error('Failed to fetch QR:', err)
    }
  }

  const restartWhatsApp = async () => {
    try {
      const response = await fetch('/api/whatsapp/restart', { method: 'POST' })
      const data = await response.json()
      alert(data.message || 'WhatsApp restarting...')
      setTimeout(fetchWhatsAppStatus, 3000)
    } catch (err) {
      alert('Failed to restart WhatsApp')
    }
  }

  const logoutWhatsApp = async () => {
    if (!confirm('This will disconnect WhatsApp and require scanning QR code again. Continue?')) return
    try {
      const response = await fetch('/api/whatsapp/logout', { method: 'POST' })
      const data = await response.json()
      alert(data.message || 'Logged out')
      setTimeout(fetchWhatsAppStatus, 3000)
    } catch (err) {
      alert('Failed to logout')
    }
  }

  useEffect(() => {
    fetchOrders()
    fetchProducts()
    fetchWhatsAppStatus()
    const ordersInterval = setInterval(fetchOrders, 30000)
    const waInterval = setInterval(fetchWhatsAppStatus, 5000)
    return () => {
      clearInterval(ordersInterval)
      clearInterval(waInterval)
    }
  }, [])

  const updateOrder = async (id, updates) => {
    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      if (!response.ok) throw new Error('Failed to update order')
      const updated = await response.json()
      setOrders(prev => prev.map(o => o.id === id ? updated : o))
      return updated
    } catch (err) {
      alert('Failed to update order')
      console.error(err)
      return null
    }
  }

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      alert('Please provide a cancellation reason')
      return
    }
    const updated = await updateOrder(cancelModal.orderId, { 
      status: 'CANCELLED', 
      cancelReason: cancelReason.trim(),
      cancelledAt: new Date().toISOString()
    })
    if (updated) {
      setCancelModal({ show: false, orderId: null })
      setCancelReason('')
    }
  }

  const handleAddFeedback = async () => {
    if (!feedbackText.trim()) {
      alert('Please enter feedback')
      return
    }
    const updated = await updateOrder(feedbackModal.orderId, { 
      adminFeedback: feedbackText.trim(),
      feedbackAt: new Date().toISOString()
    })
    if (updated) {
      setFeedbackModal({ show: false, orderId: null })
      setFeedbackText('')
    }
  }

  // Product management functions
  const toggleProductAvailability = async (product) => {
    try {
      const response = await fetch(`/api/products/${product.id}/toggle`, {
        method: 'PUT'
      })
      if (!response.ok) throw new Error('Failed to toggle')
      await fetchProducts()
    } catch (err) {
      alert('Failed to toggle availability')
      console.error(err)
    }
  }

  const openProductEdit = (product) => {
    setProductForm({
      name: product.name,
      price: product.price,
      unit: product.unit || 'pc',
      emoji: product.emoji || '🍽️',
      image: product.image || '',
      available: product.available !== false
    })
    setProductModal({ show: true, product, isNew: false })
  }

  const openAddProduct = () => {
    setProductForm({
      name: '',
      price: 0,
      unit: 'pc',
      emoji: '🍽️',
      image: '',
      available: true
    })
    setProductModal({ show: true, product: null, isNew: true })
  }

  const handleSaveProduct = async () => {
    if (!productForm.name.trim()) {
      alert('Product name is required')
      return
    }
    
    setSavingProduct(true)
    try {
      if (productModal.isNew) {
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productForm)
        })
        if (!response.ok) throw new Error('Failed to add product')
      } else {
        const response = await fetch(`/api/products/${productModal.product.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productForm)
        })
        if (!response.ok) throw new Error('Failed to update product')
      }
      
      await fetchProducts()
      setProductModal({ show: false, product: null, isNew: false })
    } catch (err) {
      alert('Failed to save product: ' + err.message)
      console.error(err)
    } finally {
      setSavingProduct(false)
    }
  }

  const handleDeleteProduct = async (product) => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return
    
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete')
      await fetchProducts()
    } catch (err) {
      alert('Failed to delete product')
      console.error(err)
    }
  }

  const toggleAllProducts = async (available) => {
    const ids = products.map(p => p.id)
    try {
      const response = await fetch('/api/products/bulk/toggle', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, available })
      })
      if (!response.ok) throw new Error('Failed to bulk toggle')
      await fetchProducts()
    } catch (err) {
      alert('Failed to update products')
      console.error(err)
    }
  }

  // Format phone for WhatsApp - accepts 10 digit Indian numbers
  const formatPhoneForWhatsApp = (phone) => {
    if (!phone) return null
    // Remove all non-digit characters
    let cleaned = phone.toString().replace(/\D/g, '')
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

  const sendWhatsAppMessage = (order, message) => {
    const phone = formatPhoneForWhatsApp(order.phone)
    if (!phone) {
      console.log('Phone validation failed for:', order.phone)
      return false
    }
    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank')
    return true
  }

  const sendSMSMessage = (order, message) => {
    const phone = order.phone
    window.open(`sms:${phone}?body=${encodeURIComponent(message)}`, '_blank')
  }

  // Auto-send notification when status changes
  const sendStatusNotification = (order, newStatus) => {
    const updatedOrder = { ...order, status: newStatus }
    const message = getStatusMessage(updatedOrder)
    sendWhatsAppMessage(updatedOrder, message)
  }

  const getStatusMessage = (order) => {
    const itemsList = order.items.map(i => `${i.name} x${i.qty}`).join('\n• ')
    const collectInfo = order.collectDate ? `📅 Collection: ${order.collectDate} ${order.collectTime || ''}` : ''
    
    switch (order.status) {
      case 'NEW':
        return `🍽️ *Swaad Sutra - Order Received!*

📋 Order #${order.id || order.orderId}
👤 ${order.customerName}
🏠 Flat: ${order.flatNumber}
${collectInfo}

🛍️ *Items:*
• ${itemsList}

💰 *Total: ₹${order.totalAmount}*

✅ We've received your order and will start preparing soon!

Thank you for ordering from Swaad Sutra! 🙏`
      case 'COOKING':
        return `🍳 *Swaad Sutra - Order Being Prepared!*

📋 Order #${order.id || order.orderId}
${collectInfo}

🛍️ *Items:*
• ${itemsList}

👨‍🍳 Your delicious food is being prepared!

We'll notify you when it's ready. Thank you! 🙏`
      case 'READY':
        return `✅ *Swaad Sutra - Order READY!*

📋 Order #${order.id || order.orderId}
🏠 Flat: ${order.flatNumber}

🛍️ *Items:*
• ${itemsList}

💰 *Total: ₹${order.totalAmount}*

🎉 Your order is ready for pickup!

Please collect your fresh homemade food. Thank you! 🙏`
      case 'DELIVERED':
        return `🎉 *Swaad Sutra - Order Delivered!*

📋 Order #${order.id || order.orderId}

✅ Your order has been delivered!

We hope you enjoy your homemade meal. Thank you for ordering from Swaad Sutra! 🍽️🙏`
      case 'CANCELLED':
        return `❌ *Swaad Sutra - Order Cancelled*

📋 Order #${order.id || order.orderId}

⚠️ Reason: ${order.cancelReason || 'N/A'}

If you have questions, please contact us.`
      default:
        return `🍽️ *Swaad Sutra - Order Update*

📋 Order #${order.id || order.orderId}
📊 Status: ${order.status}

🛍️ *Items:*
• ${itemsList}

💰 *Total: ₹${order.totalAmount}*`
    }
  }

  // Filter and sort orders
  const getFilteredOrders = () => {
    let filtered = [...orders]
    
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(o => o.status === statusFilter)
    }
    if (paymentFilter !== 'ALL') {
      filtered = filtered.filter(o => o.paymentStatus === paymentFilter)
    }
    if (dateFilter) {
      filtered = filtered.filter(o => o.createdAt.startsWith(dateFilter))
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(o => 
        o.customerName.toLowerCase().includes(query) ||
        o.flatNumber.toLowerCase().includes(query) ||
        o.items.some(i => i.name.toLowerCase().includes(query))
      )
    }
    
    switch (sortBy) {
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        break
      case 'amount-high':
        filtered.sort((a, b) => b.totalAmount - a.totalAmount)
        break
      case 'amount-low':
        filtered.sort((a, b) => a.totalAmount - b.totalAmount)
        break
      case 'collect-time':
        filtered.sort((a, b) => {
          const aTime = a.collectDate ? new Date(`${a.collectDate}T${a.collectTime || '00:00'}`) : new Date(a.createdAt)
          const bTime = b.collectDate ? new Date(`${b.collectDate}T${b.collectTime || '00:00'}`) : new Date(b.createdAt)
          return aTime - bTime
        })
        break
      default:
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }
    
    return filtered
  }

  const getOrdersByStatus = (status) => {
    return getFilteredOrders().filter(o => o.status === status)
  }

  // Filter products
  const getFilteredProducts = () => {
    let filtered = [...products]
    
    if (!showUnavailable) {
      filtered = filtered.filter(p => p.available !== false)
    }
    if (productSearch.trim()) {
      const query = productSearch.toLowerCase()
      filtered = filtered.filter(p => p.name.toLowerCase().includes(query))
    }
    
    return filtered
  }

  const today = new Date().toISOString().split('T')[0]
  const todayOrders = orders.filter(o => o.createdAt.startsWith(today))
  
  const itemTotals = todayOrders.filter(o => o.status !== 'CANCELLED').reduce((acc, order) => {
    order.items.forEach(item => {
      acc[item.name] = (acc[item.name] || 0) + item.qty
    })
    return acc
  }, {})

  const todayRevenue = todayOrders.filter(o => o.status !== 'CANCELLED').reduce((sum, o) => sum + o.totalAmount, 0)
  const paidAmount = todayOrders.filter(o => o.paymentStatus === 'PAID').reduce((sum, o) => sum + o.totalAmount, 0)
  const availableCount = products.filter(p => p.available !== false).length

  const formatDateTime = (isoString) => {
    const date = new Date(isoString)
    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()
    const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    if (isToday) return `Today, ${timeStr}`
    return `${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${timeStr}`
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'NEW': return 'status-new'
      case 'COOKING': return 'status-cooking'
      case 'READY': return 'status-ready'
      case 'DELIVERED': return 'status-delivered'
      case 'CANCELLED': return 'status-cancelled'
      default: return ''
    }
  }

  const getStatusEmoji = (status) => {
    switch (status) {
      case 'NEW': return '🆕'
      case 'COOKING': return '🍳'
      case 'READY': return '✅'
      case 'DELIVERED': return '🎉'
      case 'CANCELLED': return '❌'
      default: return '📋'
    }
  }

  const filteredOrders = getFilteredOrders()
  const filteredProducts = getFilteredProducts()

  const renderOrderCard = (order) => (
    <div key={order.id} className={`order-card ${getStatusColor(order.status)}`}>
      <div className="order-header">
        <div className="order-id">#{order.id}</div>
        <div className="order-customer">
          <strong>{order.customerName}</strong>
          <span className="flat-badge">Flat {order.flatNumber}</span>
        </div>
        <div className="order-time">{formatDateTime(order.createdAt)}</div>
      </div>

      <div className="order-items">
        {order.items.map((item, idx) => (
          <span key={idx} className="order-item-tag">
            {item.name} × {item.qty}{item.unit ? ` (${item.unit})` : ''}
          </span>
        ))}
      </div>

      {(order.collectDate || order.collectTime) && (
        <div className="order-collect-time">
          📅 Collect: {order.collectDate && new Date(order.collectDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
          {order.collectTime && ` at ${order.collectTime}`}
        </div>
      )}

      {order.notes && <div className="order-notes">📝 {order.notes}</div>}
      
      {order.cancelReason && (
        <div className="order-cancel-reason">❌ Cancelled: {order.cancelReason}</div>
      )}
      
      {order.adminFeedback && (
        <div className="order-feedback">💬 Feedback: {order.adminFeedback}</div>
      )}

      <div className="order-footer">
        <div className="order-amount">₹{order.totalAmount}</div>
        
        <div className="order-controls">
          {order.status !== 'CANCELLED' && (
            <>
              <select
                value={order.status}
                onChange={async e => {
                  const newStatus = e.target.value
                  if (newStatus === 'CANCELLED') {
                    setCancelModal({ show: true, orderId: order.id })
                  } else {
                    const updated = await updateOrder(order.id, { status: newStatus })
                    if (updated) {
                      // Auto-send WhatsApp notification
                      sendStatusNotification(updated, newStatus)
                    }
                  }
                }}
                className={`select-status ${getStatusColor(order.status)}`}
              >
                {STATUS_OPTIONS.filter(s => s !== 'CANCELLED').map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <button
                className={`btn-payment ${order.paymentStatus === 'PAID' ? 'paid' : 'pending'}`}
                onClick={() => updateOrder(order.id, { 
                  paymentStatus: order.paymentStatus === 'PAID' ? 'PENDING' : 'PAID' 
                })}
              >
                {order.paymentStatus === 'PAID' ? '✓ Paid' : '₹ Mark Paid'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="order-actions">
        <button 
          className="btn-action btn-notify"
          onClick={() => setNotifyModal({ show: true, order })}
          title="Send notification"
        >
          📤 Notify
        </button>
        <button 
          className="btn-action btn-feedback"
          onClick={() => {
            setFeedbackText(order.adminFeedback || '')
            setFeedbackModal({ show: true, orderId: order.id })
          }}
          title="Add feedback"
        >
          💬 Feedback
        </button>
        {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
          <button 
            className="btn-action btn-cancel"
            onClick={() => setCancelModal({ show: true, orderId: order.id })}
            title="Cancel order"
          >
            ❌ Cancel
          </button>
        )}
      </div>
    </div>
  )

  if (loading) {
    return <div className="container admin"><div className="loading">Loading orders...</div></div>
  }

  return (
    <div className="container admin">
      <header className="header admin-header">
        <div>
          <h1>🍽️ Swaad Sutra Admin</h1>
          <p>Kitchen Dashboard</p>
        </div>
        <div className="header-actions">
          <div 
            className={`whatsapp-status-badge ${whatsappStatus}`}
            onClick={() => setShowQRModal(true)}
            title="Click to manage WhatsApp"
          >
            📱 {whatsappStatus === 'connected' ? '✅ Connected' : 
                whatsappStatus === 'qr_ready' ? '📲 Scan QR' : 
                whatsappStatus === 'connecting' ? '🔄 Connecting...' : '❌ Disconnected'}
          </div>
          <button className="btn btn-secondary refresh-btn" onClick={() => { fetchOrders(); fetchProducts(); fetchWhatsAppStatus(); }}>↻ Refresh</button>
        </div>
      </header>

      {/* Tabs */}
      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          📋 Orders ({orders.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'status' ? 'active' : ''}`}
          onClick={() => setActiveTab('status')}
        >
          📊 By Status
        </button>
        <button 
          className={`tab-btn ${activeTab === 'menu' ? 'active' : ''}`}
          onClick={() => setActiveTab('menu')}
        >
          🍽️ Menu ({availableCount}/{products.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'kitchen' ? 'active' : ''}`}
          onClick={() => setActiveTab('kitchen')}
        >
          🍳 Kitchen
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <>
          <section className="summary-section">
            <div className="summary-header">
              <h2>📊 Today's Summary</h2>
              <div className="export-buttons">
                <a href="/api/export/daily" className="btn btn-export" download>
                  📥 Daily Report
                </a>
                <a href="/api/export/consolidated" className="btn btn-export" download>
                  📊 All Orders
                </a>
              </div>
            </div>
            <div className="summary-grid">
              <div className="summary-card">
                <div className="summary-value">{todayOrders.length}</div>
                <div className="summary-label">Orders</div>
              </div>
              <div className="summary-card">
                <div className="summary-value">₹{todayRevenue}</div>
                <div className="summary-label">Total</div>
              </div>
              <div className="summary-card">
                <div className="summary-value">₹{paidAmount}</div>
                <div className="summary-label">Collected</div>
              </div>
            </div>
          </section>

          {/* Filters */}
          <section className="filters-section">
            <h3>🔍 Filter & Sort</h3>
            <div className="filters-grid">
              <div className="filter-group">
                <label>Search</label>
                <input
                  type="text"
                  placeholder="Name, flat, item..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="filter-input"
                />
              </div>
              <div className="filter-group">
                <label>Status</label>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="filter-select">
                  <option value="ALL">All Status</option>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="filter-group">
                <label>Payment</label>
                <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)} className="filter-select">
                  <option value="ALL">All Payments</option>
                  {PAYMENT_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="filter-group">
                <label>Date</label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value)}
                  className="filter-input"
                />
              </div>
              <div className="filter-group">
                <label>Sort By</label>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="filter-select">
                  {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div className="filter-group">
                <label>&nbsp;</label>
                <button 
                  className="btn btn-secondary clear-filters"
                  onClick={() => {
                    setSearchQuery('')
                    setStatusFilter('ALL')
                    setPaymentFilter('ALL')
                    setDateFilter('')
                    setSortBy('newest')
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          </section>

          <section className="orders-section">
            <h2>📋 Orders ({filteredOrders.length})</h2>
            
            {filteredOrders.length === 0 ? (
              <div className="no-orders">No orders match your filters</div>
            ) : (
              <div className="orders-list">
                {filteredOrders.map(renderOrderCard)}
              </div>
            )}
          </section>
        </>
      )}

      {/* Status Tab - Organized Sections */}
      {activeTab === 'status' && (
        <section className="status-sections">
          {/* New Orders */}
          {(() => {
            const newOrders = orders.filter(o => o.status === 'NEW').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            return newOrders.length > 0 && (
              <div className="status-section status-new">
                <div className="section-header" onClick={() => toggleSection('new')}>
                  <h2 className="status-section-title">
                    🆕 New Orders ({newOrders.length})
                  </h2>
                  <span className="collapse-icon">{collapsedSections.new ? '▶' : '▼'}</span>
                </div>
                {!collapsedSections.new && (
                  <div className="orders-list">
                    {newOrders.map(renderOrderCard)}
                  </div>
                )}
              </div>
            )
          })()}

          {/* In Progress (Cooking + Ready) */}
          {(() => {
            const inProgressOrders = orders.filter(o => o.status === 'COOKING' || o.status === 'READY').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            return inProgressOrders.length > 0 && (
              <div className="status-section status-cooking">
                <div className="section-header" onClick={() => toggleSection('inProgress')}>
                  <h2 className="status-section-title">
                    🍳 In Progress ({inProgressOrders.length})
                  </h2>
                  <span className="collapse-icon">{collapsedSections.inProgress ? '▶' : '▼'}</span>
                </div>
                {!collapsedSections.inProgress && (
                  <div className="orders-list">
                    {inProgressOrders.map(renderOrderCard)}
                  </div>
                )}
              </div>
            )
          })()}

          {/* Delivered (Pending Payment) */}
          {(() => {
            const deliveredPending = orders.filter(o => o.status === 'DELIVERED' && o.paymentStatus !== 'PAID').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            return deliveredPending.length > 0 && (
              <div className="status-section status-delivered">
                <div className="section-header" onClick={() => toggleSection('delivered')}>
                  <h2 className="status-section-title">
                    📦 Delivered - Payment Pending ({deliveredPending.length})
                  </h2>
                  <span className="collapse-icon">{collapsedSections.delivered ? '▶' : '▼'}</span>
                </div>
                {!collapsedSections.delivered && (
                  <div className="orders-list">
                    {deliveredPending.map(renderOrderCard)}
                  </div>
                )}
              </div>
            )
          })()}

          {/* Completed (Delivered + Paid) */}
          {(() => {
            const completedOrders = orders.filter(o => o.status === 'DELIVERED' && o.paymentStatus === 'PAID').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            return completedOrders.length > 0 && (
              <div className="status-section status-completed">
                <div className="section-header clickable" onClick={() => toggleSection('completed')}>
                  <h2 className="status-section-title">
                    ✅ Completed ({completedOrders.length})
                  </h2>
                  <span className="collapse-icon">{collapsedSections.completed ? '▶' : '▼'}</span>
                </div>
                {!collapsedSections.completed && (
                  <div className="orders-list">
                    {completedOrders.map(renderOrderCard)}
                  </div>
                )}
                {collapsedSections.completed && (
                  <p className="collapsed-hint">Click to view {completedOrders.length} completed orders</p>
                )}
              </div>
            )
          })()}

          {/* Cancelled */}
          {(() => {
            const cancelledOrders = orders.filter(o => o.status === 'CANCELLED').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            return cancelledOrders.length > 0 && (
              <div className="status-section status-cancelled">
                <div className="section-header clickable" onClick={() => toggleSection('cancelled')}>
                  <h2 className="status-section-title">
                    ❌ Cancelled ({cancelledOrders.length})
                  </h2>
                  <span className="collapse-icon">{collapsedSections.cancelled ? '▶' : '▼'}</span>
                </div>
                {!collapsedSections.cancelled && (
                  <div className="orders-list">
                    {cancelledOrders.map(renderOrderCard)}
                  </div>
                )}
              </div>
            )
          })()}
        </section>
      )}

      {/* Menu Management Tab */}
      {activeTab === 'menu' && (
        <section className="menu-management">
          <div className="menu-header">
            <h2>🍽️ Menu Management</h2>
            <div className="menu-actions">
              <button className="btn btn-primary" onClick={openAddProduct}>
                ➕ Add Item
              </button>
              <button className="btn btn-success" onClick={() => toggleAllProducts(true)}>
                ✅ Show All
              </button>
              <button className="btn btn-secondary" onClick={() => toggleAllProducts(false)}>
                🚫 Hide All
              </button>
            </div>
          </div>

          <div className="menu-filters">
            <input
              type="text"
              placeholder="🔍 Search items..."
              value={productSearch}
              onChange={e => setProductSearch(e.target.value)}
              className="filter-input"
            />
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showUnavailable}
                onChange={e => setShowUnavailable(e.target.checked)}
              />
              Show Hidden Items
            </label>
          </div>

          <div className="menu-stats">
            <span className="stat-badge available">✅ {availableCount} Available</span>
            <span className="stat-badge unavailable">🚫 {products.length - availableCount} Hidden</span>
          </div>

          <div className="menu-grid-admin">
            {filteredProducts.map(product => (
              <div key={product.id} className={`menu-item-card ${!product.available ? 'hidden-item' : ''}`}>
                <div className="item-toggle">
                  <button 
                    className={`toggle-btn ${product.available ? 'on' : 'off'}`}
                    onClick={() => toggleProductAvailability(product)}
                    title={product.available ? 'Click to hide' : 'Click to show'}
                  >
                    {product.available ? '✅' : '🚫'}
                  </button>
                </div>
                <div className="item-image">
                  <span className="item-emoji">{product.emoji}</span>
                </div>
                <div className="item-details">
                  <h4>{product.name}</h4>
                  <p className="item-price">₹{product.price}/{product.unit}</p>
                </div>
                <div className="item-actions">
                  <button className="btn-sm btn-edit" onClick={() => openProductEdit(product)}>
                    ✏️ Edit
                  </button>
                  <button className="btn-sm btn-delete" onClick={() => handleDeleteProduct(product)}>
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="no-orders">No menu items found</div>
          )}
        </section>
      )}

      {/* Kitchen View */}
      {activeTab === 'kitchen' && (
        <section className="kitchen-section">
          <h2>🍳 Items to Prepare Today</h2>
          {Object.keys(itemTotals).length > 0 ? (
            <div className="items-summary large">
              <div className="items-list">
                {Object.entries(itemTotals).sort((a, b) => b[1] - a[1]).map(([name, qty]) => (
                  <div key={name} className="item-count large">
                    <span className="item-name">{name}</span>
                    <span className="item-qty">× {qty}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="no-orders">No items to prepare today</div>
          )}

          <h2 style={{marginTop: '24px'}}>📋 Pending Orders</h2>
          <div className="orders-list">
            {orders.filter(o => o.status === 'NEW' || o.status === 'COOKING').map(renderOrderCard)}
          </div>
        </section>
      )}

      {/* Cancel Modal */}
      {cancelModal.show && (
        <div className="modal-overlay" onClick={() => setCancelModal({ show: false, orderId: null })}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>❌ Cancel Order</h2>
            <p>Please provide a reason for cancellation:</p>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="e.g., Customer requested, Out of ingredients..."
              className="modal-textarea"
              rows={3}
            />
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setCancelModal({ show: false, orderId: null })}>
                Back
              </button>
              <button className="btn btn-danger" onClick={handleCancelOrder}>
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {feedbackModal.show && (
        <div className="modal-overlay" onClick={() => setFeedbackModal({ show: false, orderId: null })}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>💬 Admin Feedback</h2>
            <p>Add notes or feedback for this order:</p>
            <textarea
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
              placeholder="e.g., Extra spicy requested, Delivery timing changed..."
              className="modal-textarea"
              rows={3}
            />
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setFeedbackModal({ show: false, orderId: null })}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAddFeedback}>
                Save Feedback
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {notifyModal.show && notifyModal.order && (
        <div className="modal-overlay" onClick={() => setNotifyModal({ show: false, order: null })}>
          <div className="modal notify-modal" onClick={e => e.stopPropagation()}>
            <h2>📤 Send Notification</h2>
            <p>Send order update to <strong>{notifyModal.order.customerName}</strong> (Flat {notifyModal.order.flatNumber})</p>
            
            <div className="message-preview">
              <h4>Message Preview:</h4>
              <pre>{getStatusMessage(notifyModal.order)}</pre>
            </div>
            
            <div className="notify-buttons">
              <button 
                className="btn btn-whatsapp"
                onClick={() => {
                  sendWhatsAppMessage(notifyModal.order, getStatusMessage(notifyModal.order))
                  setNotifyModal({ show: false, order: null })
                }}
              >
                📱 Send via WhatsApp
              </button>
              <button 
                className="btn btn-sms"
                onClick={() => {
                  sendSMSMessage(notifyModal.order, getStatusMessage(notifyModal.order))
                  setNotifyModal({ show: false, order: null })
                }}
              >
                💬 Send via SMS
              </button>
            </div>
            
            <button 
              className="btn btn-secondary close-notify"
              onClick={() => setNotifyModal({ show: false, order: null })}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Product Edit Modal */}
      {productModal.show && (
        <div className="modal-overlay" onClick={() => setProductModal({ show: false, product: null, isNew: false })}>
          <div className="modal product-modal" onClick={e => e.stopPropagation()}>
            <h2>{productModal.isNew ? '➕ Add Menu Item' : '✏️ Edit Menu Item'}</h2>
            
            <div className="form-group">
              <label>Item Name *</label>
              <input
                type="text"
                value={productForm.name}
                onChange={e => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Paneer Paratha"
                className="form-input"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Price (₹) *</label>
                <input
                  type="number"
                  min="0"
                  value={productForm.price}
                  onChange={e => setProductForm(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Unit</label>
                <input
                  type="text"
                  value={productForm.unit}
                  onChange={e => setProductForm(prev => ({ ...prev, unit: e.target.value }))}
                  placeholder="pc, Plate, Bowl..."
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Emoji</label>
                <input
                  type="text"
                  value={productForm.emoji}
                  onChange={e => setProductForm(prev => ({ ...prev, emoji: e.target.value }))}
                  placeholder="🍽️"
                  className="form-input"
                  maxLength={4}
                />
              </div>
              <div className="form-group">
                <label>Image Path</label>
                <input
                  type="text"
                  value={productForm.image}
                  onChange={e => setProductForm(prev => ({ ...prev, image: e.target.value }))}
                  placeholder="/images/item.jpg"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={productForm.available}
                  onChange={e => setProductForm(prev => ({ ...prev, available: e.target.checked }))}
                />
                Available Today
              </label>
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-secondary" 
                onClick={() => setProductModal({ show: false, product: null, isNew: false })}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleSaveProduct}
                disabled={savingProduct}
              >
                {savingProduct ? 'Saving...' : 'Save Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Status Modal */}
      {showQRModal && (
        <div className="modal-overlay" onClick={() => setShowQRModal(false)}>
          <div className="modal whatsapp-modal" onClick={e => e.stopPropagation()}>
            <h2>📱 WhatsApp Status</h2>
            
            <div className={`wa-status-display ${whatsappStatus}`}>
              {whatsappStatus === 'connected' && (
                <>
                  <div className="wa-connected">
                    <span className="wa-icon">✅</span>
                    <h3>WhatsApp Connected!</h3>
                    <p>Messages will be sent automatically when order status changes.</p>
                  </div>
                  <div className="wa-info">
                    <p>📤 Auto-notifications enabled for:</p>
                    <ul>
                      <li>✓ New order confirmation</li>
                      <li>✓ Order cooking status</li>
                      <li>✓ Order ready notification</li>
                      <li>✓ Delivery confirmation</li>
                      <li>✓ Cancellation alerts</li>
                    </ul>
                  </div>
                </>
              )}
              
              {whatsappStatus === 'qr_ready' && whatsappQR && (
                <>
                  <div className="wa-qr-section">
                    <h3>Scan QR Code to Connect</h3>
                    <p>Open WhatsApp on your phone → Settings → Linked Devices → Link a Device</p>
                    <img src={whatsappQR} alt="WhatsApp QR Code" className="wa-qr-image" />
                  </div>
                </>
              )}
              
              {whatsappStatus === 'connecting' && (
                <div className="wa-connecting">
                  <span className="wa-icon spin">🔄</span>
                  <h3>Connecting...</h3>
                  <p>Please wait while WhatsApp connects.</p>
                </div>
              )}
              
              {whatsappStatus === 'disconnected' && !whatsappQR && (
                <div className="wa-disconnected">
                  <span className="wa-icon">❌</span>
                  <h3>WhatsApp Disconnected</h3>
                  <p>Click "Restart" to generate a new QR code.</p>
                </div>
              )}
            </div>

            <div className="wa-actions">
              {whatsappStatus === 'connected' && (
                <button className="btn btn-danger" onClick={logoutWhatsApp}>
                  🔓 Logout & Reset
                </button>
              )}
              {whatsappStatus !== 'connected' && (
                <button className="btn btn-primary" onClick={restartWhatsApp}>
                  🔄 Restart WhatsApp
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => setShowQRModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPage
