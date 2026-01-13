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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('orders')
  
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

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 30000)
    return () => clearInterval(interval)
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

  const sendWhatsAppMessage = (order, message) => {
    // For Swaad Sutra, we might not have phone. Use a placeholder
    const phone = order.phone || '9999999999'
    const phoneClean = phone.startsWith('+') ? phone : `+91${phone}`
    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/${phoneClean.replace(/\D/g, '')}?text=${encodedMessage}`, '_blank')
  }

  const sendSMSMessage = (order, message) => {
    const phone = order.phone || '9999999999'
    window.open(`sms:${phone}?body=${encodeURIComponent(message)}`, '_blank')
  }

  const getStatusMessage = (order) => {
    const itemsList = order.items.map(i => `${i.name} x${i.qty}`).join(', ')
    const collectInfo = order.collectDate ? `\nCollection: ${order.collectDate} ${order.collectTime || ''}` : ''
    
    switch (order.status) {
      case 'COOKING':
        return `🍽️ Swaad Sutra: Your order #${order.id} is being prepared!\n\nItems: ${itemsList}${collectInfo}\n\nWe'll notify you when it's ready. Thank you!`
      case 'READY':
        return `✅ Swaad Sutra: Your order #${order.id} is READY for pickup!\n\nItems: ${itemsList}\nFlat: ${order.flatNumber}\nTotal: ₹${order.totalAmount}\n\nPlease collect your order. Thank you!`
      case 'DELIVERED':
        return `🎉 Swaad Sutra: Your order #${order.id} has been delivered!\n\nWe hope you enjoy your meal. Thank you for ordering! 🍽️`
      case 'CANCELLED':
        return `❌ Swaad Sutra: Your order #${order.id} has been cancelled.\n\nReason: ${order.cancelReason || 'N/A'}\n\nIf you have questions, please contact us.`
      default:
        return `🍽️ Swaad Sutra: Update for your order #${order.id}\n\nStatus: ${order.status}\nItems: ${itemsList}\nTotal: ₹${order.totalAmount}`
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
                onChange={e => {
                  if (e.target.value === 'CANCELLED') {
                    setCancelModal({ show: true, orderId: order.id })
                  } else {
                    updateOrder(order.id, { status: e.target.value })
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
        <button className="btn btn-secondary refresh-btn" onClick={fetchOrders}>↻ Refresh</button>
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
          className={`tab-btn ${activeTab === 'kitchen' ? 'active' : ''}`}
          onClick={() => setActiveTab('kitchen')}
        >
          🍳 Kitchen View
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <>
          <section className="summary-section">
            <h2>📊 Today's Summary</h2>
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

      {/* Status Tab */}
      {activeTab === 'status' && (
        <section className="status-sections">
          {STATUS_OPTIONS.map(status => {
            const statusOrders = getOrdersByStatus(status)
            if (statusOrders.length === 0) return null
            return (
              <div key={status} className={`status-section ${getStatusColor(status)}`}>
                <h2 className="status-section-title">
                  {getStatusEmoji(status)} {status} ({statusOrders.length})
                </h2>
                <div className="orders-list">
                  {statusOrders.map(renderOrderCard)}
                </div>
              </div>
            )
          })}
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
    </div>
  )
}

export default AdminPage
