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
  const [refreshing, setRefreshing] = useState(false)
  
  // Filter & Sort state
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [paymentFilter, setPaymentFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState('newest')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [hideCompleted, setHideCompleted] = useState(true) // Hide completed orders by default
  
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
  
  // Edit Order Items modal state
  const [editItemsModal, setEditItemsModal] = useState({ show: false, order: null })
  const [orderItems, setOrderItems] = useState([]) // Current order items being edited
  const [selectedItems, setSelectedItems] = useState({}) // New items to add from menu
  const [customItemsToAdd, setCustomItemsToAdd] = useState([])
  const [newCustomItem, setNewCustomItem] = useState({ name: '', qty: 1, price: '' })
  const [savingItems, setSavingItems] = useState(false)
  
  // Section collapse state
  const [collapsedSections, setCollapsedSections] = useState({
    completed: true // Auto-collapse completed orders
  })
  
  // Create Order modal state
  const [createOrderModal, setCreateOrderModal] = useState(false)
  const [newOrderForm, setNewOrderForm] = useState({
    customerName: '',
    flatNumber: '',
    phone: '',
    notes: '',
    collectDate: '',
    collectTime: '',
    orderDate: new Date().toISOString().split('T')[0],
    orderTime: new Date().toTimeString().slice(0, 5),
    status: 'NEW',
    paymentStatus: 'PENDING'
  })
  const [newOrderItems, setNewOrderItems] = useState({})
  const [newOrderCustomItems, setNewOrderCustomItems] = useState([])
  const [newOrderCustomItem, setNewOrderCustomItem] = useState({ name: '', qty: 1, price: '' })
  const [creatingOrder, setCreatingOrder] = useState(false)

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  // Create order functions
  const openCreateOrderModal = () => {
    setNewOrderForm({
      customerName: '',
      flatNumber: '',
      phone: '',
      notes: '',
      collectDate: '',
      collectTime: '',
      orderDate: new Date().toISOString().split('T')[0],
      orderTime: new Date().toTimeString().slice(0, 5),
      status: 'NEW',
      paymentStatus: 'PENDING'
    })
    setNewOrderItems({})
    setNewOrderCustomItems([])
    setNewOrderCustomItem({ name: '', qty: 1, price: '' })
    setCreateOrderModal(true)
  }

  const handleNewOrderItemSelect = (product, qty) => {
    if (qty > 0) {
      setNewOrderItems(prev => ({ ...prev, [product.id]: { ...product, qty } }))
    } else {
      setNewOrderItems(prev => {
        const updated = { ...prev }
        delete updated[product.id]
        return updated
      })
    }
  }

  const addNewOrderCustomItem = () => {
    if (newOrderCustomItem.name.trim() && newOrderCustomItem.qty > 0) {
      setNewOrderCustomItems(prev => [...prev, { ...newOrderCustomItem, id: Date.now() }])
      setNewOrderCustomItem({ name: '', qty: 1, price: '' })
    }
  }

  const removeNewOrderCustomItem = (id) => {
    setNewOrderCustomItems(prev => prev.filter(item => item.id !== id))
  }

  const getNewOrderTotal = () => {
    const menuTotal = Object.values(newOrderItems).reduce((sum, item) => sum + (item.price * item.qty), 0)
    const customTotal = newOrderCustomItems.reduce((sum, item) => sum + ((parseInt(item.price) || 0) * item.qty), 0)
    return menuTotal + customTotal
  }

  const handleCreateOrder = async () => {
    if (!newOrderForm.customerName.trim() || !newOrderForm.flatNumber.trim()) {
      alert('Please enter customer name and flat number')
      return
    }
    
    const menuItems = Object.values(newOrderItems).filter(item => item.qty > 0).map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      qty: item.qty,
      unit: item.unit || 'pc'
    }))
    const customItems = newOrderCustomItems.map(item => ({
      id: item.id,
      name: item.name,
      price: parseInt(item.price) || 0,
      qty: parseInt(item.qty) || 1,
      unit: 'pc'
    }))
    
    const allItems = [...menuItems, ...customItems]
    
    if (allItems.length === 0) {
      alert('Please add at least one item to the order')
      return
    }
    
    const totalAmount = getNewOrderTotal()
    const orderDateTime = new Date(`${newOrderForm.orderDate}T${newOrderForm.orderTime}`)
    
    setCreatingOrder(true)
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: newOrderForm.customerName.trim(),
          flatNumber: newOrderForm.flatNumber.trim(),
          phone: newOrderForm.phone.trim(),
          items: allItems,
          totalAmount,
          collectDate: newOrderForm.collectDate,
          collectTime: newOrderForm.collectTime,
          notes: newOrderForm.notes.trim(),
          createdAt: orderDateTime.toISOString(),
          status: newOrderForm.status,
          paymentStatus: newOrderForm.paymentStatus
        })
      })
      
      if (!response.ok) throw new Error('Failed to create order')
      
      const newOrder = await response.json()
      setOrders(prev => [newOrder, ...prev])
      setCreateOrderModal(false)
      alert(`Order #${newOrder.id} created successfully!`)
    } catch (err) {
      alert('Failed to create order: ' + err.message)
      console.error(err)
    } finally {
      setCreatingOrder(false)
    }
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

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await Promise.all([fetchOrders(), fetchProducts()])
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchOrders()
    fetchProducts()
    const ordersInterval = setInterval(fetchOrders, 30000)
    return () => {
      clearInterval(ordersInterval)
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

  // Edit order items functions
  const openEditItemsModal = (order) => {
    // Initialize with current order items
    setOrderItems(order.items.map(item => ({ ...item })))
    setSelectedItems({})
    setCustomItemsToAdd([])
    setNewCustomItem({ name: '', qty: 1, price: '' })
    setEditItemsModal({ show: true, order })
  }

  // Update quantity of existing order item
  const updateOrderItemQty = (index, newQty) => {
    setOrderItems(prev => prev.map((item, i) => 
      i === index ? { ...item, qty: Math.max(0, newQty) } : item
    ))
  }

  // Remove existing order item
  const removeOrderItem = (index) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index))
  }

  // Add item from menu
  const handleItemSelect = (product, qty) => {
    if (qty > 0) {
      setSelectedItems(prev => ({ ...prev, [product.id]: { ...product, qty } }))
    } else {
      setSelectedItems(prev => {
        const updated = { ...prev }
        delete updated[product.id]
        return updated
      })
    }
  }

  // Add custom item
  const addCustomItemToOrder = () => {
    if (newCustomItem.name.trim() && newCustomItem.qty > 0) {
      setCustomItemsToAdd(prev => [...prev, { ...newCustomItem, id: Date.now() }])
      setNewCustomItem({ name: '', qty: 1, price: '' })
    }
  }

  const removeCustomItemFromOrder = (id) => {
    setCustomItemsToAdd(prev => prev.filter(item => item.id !== id))
  }

  // Save all changes to order items
  const handleSaveOrderItems = async () => {
    // Combine all items: existing (with updated qty), new from menu, custom
    const existingItems = orderItems.filter(item => item.qty > 0)
    const newMenuItems = Object.values(selectedItems).filter(item => item.qty > 0).map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      qty: item.qty,
      unit: item.unit || 'pc'
    }))
    const newCustomItems = customItemsToAdd.map(item => ({
      id: item.id,
      name: item.name,
      price: parseInt(item.price) || 0,
      qty: parseInt(item.qty) || 1,
      unit: 'pc'
    }))
    
    const allItems = [...existingItems, ...newMenuItems, ...newCustomItems]
    
    if (allItems.length === 0) {
      alert('Order must have at least one item')
      return
    }
    
    setSavingItems(true)
    try {
      const response = await fetch(`/api/orders/${editItemsModal.order.id}/items`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: allItems, mode: 'replace' })
      })
      
      if (!response.ok) throw new Error('Failed to update items')
      
      const updated = await response.json()
      setOrders(prev => prev.map(o => o.id === updated.id ? updated : o))
      setEditItemsModal({ show: false, order: null })
      alert('Order updated successfully!')
    } catch (err) {
      alert('Failed to update order')
      console.error(err)
    } finally {
      setSavingItems(false)
    }
  }

  // Calculate new total
  const getEditedOrderTotal = () => {
    const existingTotal = orderItems.reduce((sum, item) => sum + (item.price * item.qty), 0)
    const menuTotal = Object.values(selectedItems).reduce((sum, item) => sum + (item.price * item.qty), 0)
    const customTotal = customItemsToAdd.reduce((sum, item) => sum + ((parseInt(item.price) || 0) * item.qty), 0)
    return existingTotal + menuTotal + customTotal
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

${collectInfo}

🛍️ *Items:*
• ${itemsList}

👨‍🍳 Your delicious food is being prepared!

We'll notify you when it's ready. Thank you! 🙏`
      case 'READY':
        return `✅ *Swaad Sutra - Order READY!*

🏠 Flat: ${order.flatNumber}

🛍️ *Items:*
• ${itemsList}

💰 *Total: ₹${order.totalAmount}*

🎉 Your order is ready for pickup!

Please collect your fresh homemade food. Thank you! 🙏`
      case 'DELIVERED':
        return `🎉 *Swaad Sutra - Order Delivered!*

✅ Your order has been delivered!

💰 *Total Amount: ₹${order.totalAmount}*

📱 *Payment via PhonePe UPI:*
9096648553-3@ibl

Please share screenshot once payment is done. 🙏

⭐ *Rate your order:*
${window.location.origin}/rate/${order.id}

If you enjoyed the food, please share your review in:
• La Vida Ladies WhatsApp Group
• La Vida Marketplace Channel

Your support means a lot to us! 🍽️❤️`
      case 'CANCELLED':
        return `❌ *Swaad Sutra - Order Cancelled*

⚠️ Reason: ${order.cancelReason || 'N/A'}

If you have questions, please contact us.`
      default:
        return `🍽️ *Swaad Sutra - Order Update*

📊 Status: ${order.status}

🛍️ *Items:*
• ${itemsList}

💰 *Total: ₹${order.totalAmount}*`
    }
  }

  // Filter and sort orders
  const getFilteredOrders = () => {
    let filtered = [...orders]
    
    // Hide completed orders (delivered + paid) if toggle is on
    if (hideCompleted) {
      filtered = filtered.filter(o => !(o.status === 'DELIVERED' && o.paymentStatus === 'PAID'))
    }
    
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
  const todayOrders = orders.filter(o => o.createdAt.startsWith(today) && o.status !== 'CANCELLED')
  
  const itemTotals = todayOrders.reduce((acc, order) => {
    order.items.forEach(item => {
      acc[item.name] = (acc[item.name] || 0) + item.qty
    })
    return acc
  }, {})

  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0)
  const paidAmount = todayOrders.filter(o => o.paymentStatus === 'PAID').reduce((sum, o) => sum + o.totalAmount, 0)
  
  // Active orders count (excluding cancelled)
  const activeOrdersCount = orders.filter(o => o.status !== 'CANCELLED').length
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
          className="btn-action btn-edit-items"
          onClick={() => openEditItemsModal(order)}
          title="Edit order items"
        >
          ✏️ Edit Items
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
          <button 
            className="btn btn-primary create-order-btn"
            onClick={openCreateOrderModal}
          >
            ➕ New Order
          </button>
          <button 
            className={`btn btn-secondary refresh-btn ${refreshing ? 'refreshing' : ''}`}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? '🔄 Refreshing...' : '↻ Refresh'}
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          📋 Orders ({filteredOrders.length}{filteredOrders.length !== activeOrdersCount ? `/${activeOrdersCount}` : ''})
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
                    setHideCompleted(true)
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="filters-extra">
              <label className="checkbox-label hide-completed-toggle">
                <input
                  type="checkbox"
                  checked={hideCompleted}
                  onChange={e => setHideCompleted(e.target.checked)}
                />
                <span>Hide Completed Orders</span>
                {hideCompleted && (
                  <span className="hidden-count">
                    ({orders.filter(o => o.status === 'DELIVERED' && o.paymentStatus === 'PAID').length} hidden)
                  </span>
                )}
              </label>
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
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={productForm.price}
                  onChange={e => {
                    const cleanValue = e.target.value.replace(/[^0-9]/g, '')
                    setProductForm(prev => ({ ...prev, price: cleanValue === '' ? 0 : parseInt(cleanValue, 10) }))
                  }}
                  onWheel={(e) => e.target.blur()}
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

      {/* Edit Order Items Modal */}
      {editItemsModal.show && editItemsModal.order && (
        <div className="modal-overlay" onClick={() => setEditItemsModal({ show: false, order: null })}>
          <div className="modal edit-items-modal" onClick={e => e.stopPropagation()}>
            <h2>✏️ Edit Order #{editItemsModal.order.id}</h2>
            <p className="modal-subtitle">Customer: {editItemsModal.order.customerName} | Flat: {editItemsModal.order.flatNumber}</p>
            
            {/* Current Order Items - Editable */}
            <div className="current-order-items editable">
              <h4>📋 Current Items (tap to edit):</h4>
              <div className="editable-items-list">
                {orderItems.map((item, idx) => (
                  <div key={idx} className={`editable-item ${item.qty === 0 ? 'removed' : ''}`}>
                    <span className="item-info">
                      {item.name}
                      <span className="item-price-small">₹{item.price}</span>
                    </span>
                    <div className="item-controls">
                      <div className="qty-selector">
                        <button 
                          className="qty-btn"
                          onClick={() => updateOrderItemQty(idx, item.qty - 1)}
                        >
                          −
                        </button>
                        <span className="qty-value">{item.qty}</span>
                        <button 
                          className="qty-btn"
                          onClick={() => updateOrderItemQty(idx, item.qty + 1)}
                        >
                          +
                        </button>
                      </div>
                      <button 
                        className="remove-item-btn"
                        onClick={() => removeOrderItem(idx)}
                        title="Remove item"
                      >
                        🗑️
                      </button>
                    </div>
                    <span className="item-subtotal">₹{item.price * item.qty}</span>
                  </div>
                ))}
                {orderItems.length === 0 && (
                  <p className="no-items-warning">⚠️ No items! Add at least one item below.</p>
                )}
              </div>
            </div>

            {/* Add from Menu */}
            <div className="add-items-section">
              <h4>🍽️ Add from Menu:</h4>
              <div className="menu-items-grid">
                {products.filter(p => p.available !== false).map(product => (
                  <div key={product.id} className="menu-item-select">
                    <span className="item-name">{product.emoji} {product.name}</span>
                    <span className="item-price">₹{product.price}/{product.unit}</span>
                    <div className="qty-selector">
                      <button 
                        className="qty-btn"
                        onClick={() => handleItemSelect(product, (selectedItems[product.id]?.qty || 0) - 1)}
                      >
                        −
                      </button>
                      <span className="qty-value">{selectedItems[product.id]?.qty || 0}</span>
                      <button 
                        className="qty-btn"
                        onClick={() => handleItemSelect(product, (selectedItems[product.id]?.qty || 0) + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Custom Item */}
            <div className="add-custom-section">
              <h4>✨ Add Custom Item:</h4>
              <div className="custom-item-form">
                <input
                  type="text"
                  placeholder="Item name"
                  value={newCustomItem.name}
                  onChange={e => setNewCustomItem(prev => ({ ...prev, name: e.target.value }))}
                  className="form-input"
                />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Qty"
                  value={newCustomItem.qty}
                  onChange={e => setNewCustomItem(prev => ({ ...prev, qty: parseInt(e.target.value.replace(/\D/g, '')) || 1 }))}
                  className="form-input qty-input"
                />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Price ₹"
                  value={newCustomItem.price}
                  onChange={e => setNewCustomItem(prev => ({ ...prev, price: e.target.value.replace(/\D/g, '') }))}
                  className="form-input price-input"
                />
                <button className="btn btn-secondary" onClick={addCustomItemToOrder}>Add</button>
              </div>
              
              {customItemsToAdd.length > 0 && (
                <div className="custom-items-list">
                  {customItemsToAdd.map(item => (
                    <div key={item.id} className="custom-item-tag">
                      <span>✨ {item.name} × {item.qty} {item.price ? `(₹${item.price})` : '(TBD)'}</span>
                      <button className="remove-btn" onClick={() => removeCustomItemFromOrder(item.id)}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="edit-items-summary">
              <div className="summary-row">
                <span>Original Total:</span>
                <span className="original-total">₹{editItemsModal.order.totalAmount}</span>
              </div>
              <div className="summary-row new-total">
                <span>New Total:</span>
                <span>₹{getEditedOrderTotal()}</span>
              </div>
              {getEditedOrderTotal() !== editItemsModal.order.totalAmount && (
                <div className="summary-row difference">
                  <span>Difference:</span>
                  <span className={getEditedOrderTotal() > editItemsModal.order.totalAmount ? 'increase' : 'decrease'}>
                    {getEditedOrderTotal() > editItemsModal.order.totalAmount ? '+' : ''}₹{getEditedOrderTotal() - editItemsModal.order.totalAmount}
                  </span>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-secondary" 
                onClick={() => setEditItemsModal({ show: false, order: null })}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleSaveOrderItems}
                disabled={savingItems || (orderItems.filter(i => i.qty > 0).length === 0 && Object.keys(selectedItems).length === 0 && customItemsToAdd.length === 0)}
              >
                {savingItems ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {createOrderModal && (
        <div className="modal-overlay" onClick={() => setCreateOrderModal(false)}>
          <div className="modal create-order-modal" onClick={e => e.stopPropagation()}>
            <h2>➕ Create New Order</h2>
            
            {/* Customer Details */}
            <div className="form-section">
              <h4>👤 Customer Details</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Customer Name *</label>
                  <input
                    type="text"
                    value={newOrderForm.customerName}
                    onChange={e => setNewOrderForm(prev => ({ ...prev, customerName: e.target.value }))}
                    placeholder="Enter name"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Flat Number *</label>
                  <input
                    type="text"
                    value={newOrderForm.flatNumber}
                    onChange={e => setNewOrderForm(prev => ({ ...prev, flatNumber: e.target.value }))}
                    placeholder="e.g., A-101"
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={newOrderForm.phone}
                  onChange={e => setNewOrderForm(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                  placeholder="10-digit mobile"
                  className="form-input"
                  maxLength={10}
                />
              </div>
            </div>

            {/* Order Date & Time (Backdate support) */}
            <div className="form-section backdate-section">
              <h4>📅 Order Date & Time</h4>
              <p className="section-hint">Change date/time to create backdated orders</p>
              <div className="form-row">
                <div className="form-group">
                  <label>Order Date</label>
                  <input
                    type="date"
                    value={newOrderForm.orderDate}
                    onChange={e => setNewOrderForm(prev => ({ ...prev, orderDate: e.target.value }))}
                    className="form-input"
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="form-group">
                  <label>Order Time</label>
                  <input
                    type="time"
                    value={newOrderForm.orderTime}
                    onChange={e => setNewOrderForm(prev => ({ ...prev, orderTime: e.target.value }))}
                    className="form-input"
                  />
                </div>
              </div>
              {newOrderForm.orderDate !== new Date().toISOString().split('T')[0] && (
                <p className="backdate-warning">⚠️ Creating backdated order for {new Date(newOrderForm.orderDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
              )}
            </div>

            {/* Items Selection */}
            <div className="form-section">
              <h4>🍽️ Select Items</h4>
              <div className="menu-items-grid compact">
                {products.filter(p => p.available !== false).map(product => (
                  <div key={product.id} className="menu-item-select">
                    <span className="item-name">{product.emoji} {product.name}</span>
                    <span className="item-price">₹{product.price}</span>
                    <div className="qty-selector">
                      <button 
                        className="qty-btn"
                        onClick={() => handleNewOrderItemSelect(product, (newOrderItems[product.id]?.qty || 0) - 1)}
                      >
                        −
                      </button>
                      <span className="qty-value">{newOrderItems[product.id]?.qty || 0}</span>
                      <button 
                        className="qty-btn"
                        onClick={() => handleNewOrderItemSelect(product, (newOrderItems[product.id]?.qty || 0) + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Items */}
            <div className="form-section add-custom-section">
              <h4>✨ Add Custom Item</h4>
              <div className="custom-item-form">
                <input
                  type="text"
                  placeholder="Item name"
                  value={newOrderCustomItem.name}
                  onChange={e => setNewOrderCustomItem(prev => ({ ...prev, name: e.target.value }))}
                  className="form-input"
                />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Qty"
                  value={newOrderCustomItem.qty}
                  onChange={e => setNewOrderCustomItem(prev => ({ ...prev, qty: parseInt(e.target.value.replace(/\D/g, '')) || 1 }))}
                  className="form-input qty-input"
                />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Price ₹"
                  value={newOrderCustomItem.price}
                  onChange={e => setNewOrderCustomItem(prev => ({ ...prev, price: e.target.value.replace(/\D/g, '') }))}
                  className="form-input price-input"
                />
                <button className="btn btn-secondary" onClick={addNewOrderCustomItem}>Add</button>
              </div>
              {newOrderCustomItems.length > 0 && (
                <div className="custom-items-list">
                  {newOrderCustomItems.map(item => (
                    <div key={item.id} className="custom-item-tag">
                      <span>✨ {item.name} × {item.qty} {item.price ? `(₹${item.price})` : '(TBD)'}</span>
                      <button className="remove-btn" onClick={() => removeNewOrderCustomItem(item.id)}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Collection & Notes */}
            <div className="form-section">
              <h4>📝 Additional Info</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Collection Date</label>
                  <input
                    type="date"
                    value={newOrderForm.collectDate}
                    onChange={e => setNewOrderForm(prev => ({ ...prev, collectDate: e.target.value }))}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Collection Time</label>
                  <input
                    type="time"
                    value={newOrderForm.collectTime}
                    onChange={e => setNewOrderForm(prev => ({ ...prev, collectTime: e.target.value }))}
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={newOrderForm.notes}
                  onChange={e => setNewOrderForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any special instructions..."
                  className="form-textarea"
                  rows={2}
                />
              </div>
            </div>

            {/* Status */}
            <div className="form-section">
              <h4>📊 Order Status</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={newOrderForm.status}
                    onChange={e => setNewOrderForm(prev => ({ ...prev, status: e.target.value }))}
                    className="form-select"
                  >
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Payment</label>
                  <select
                    value={newOrderForm.paymentStatus}
                    onChange={e => setNewOrderForm(prev => ({ ...prev, paymentStatus: e.target.value }))}
                    className="form-select"
                  >
                    {PAYMENT_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="order-summary-section">
              <h4>💰 Order Summary</h4>
              <div className="summary-items">
                {Object.values(newOrderItems).filter(i => i.qty > 0).map(item => (
                  <div key={item.id} className="summary-row">
                    <span>{item.name} × {item.qty}</span>
                    <span>₹{item.price * item.qty}</span>
                  </div>
                ))}
                {newOrderCustomItems.map(item => (
                  <div key={item.id} className="summary-row custom">
                    <span>✨ {item.name} × {item.qty}</span>
                    <span>{item.price ? `₹${item.price * item.qty}` : 'TBD'}</span>
                  </div>
                ))}
              </div>
              <div className="summary-total-row">
                <strong>Total</strong>
                <strong>₹{getNewOrderTotal()}</strong>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-secondary" 
                onClick={() => setCreateOrderModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleCreateOrder}
                disabled={creatingOrder || (!Object.keys(newOrderItems).length && !newOrderCustomItems.length)}
              >
                {creatingOrder ? 'Creating...' : 'Create Order'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default AdminPage
