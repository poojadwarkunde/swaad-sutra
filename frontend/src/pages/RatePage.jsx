import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

function RatePage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [ratings, setRatings] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [existingRatings, setExistingRatings] = useState([])

  useEffect(() => {
    fetchOrder()
    checkExistingRatings()
  }, [orderId])

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`)
      if (response.ok) {
        const data = await response.json()
        setOrder(data)
        // Initialize ratings for each item
        const initialRatings = {}
        data.items.forEach(item => {
          initialRatings[item.id || item.name] = { rating: 0, review: '' }
        })
        setRatings(initialRatings)
      }
    } catch (err) {
      console.error('Failed to fetch order:', err)
    } finally {
      setLoading(false)
    }
  }

  const checkExistingRatings = async () => {
    try {
      const response = await fetch(`/api/ratings/order/${orderId}`)
      if (response.ok) {
        const data = await response.json()
        setExistingRatings(data)
      }
    } catch (err) {
      console.error('Failed to check ratings:', err)
    }
  }

  const setItemRating = (itemKey, rating) => {
    setRatings(prev => ({
      ...prev,
      [itemKey]: { ...prev[itemKey], rating }
    }))
  }

  const setItemReview = (itemKey, review) => {
    setRatings(prev => ({
      ...prev,
      [itemKey]: { ...prev[itemKey], review }
    }))
  }

  const handleSubmit = async () => {
    // Check if at least one rating is given
    const hasRating = Object.values(ratings).some(r => r.rating > 0)
    if (!hasRating) {
      alert('Please rate at least one item')
      return
    }

    setSubmitting(true)
    try {
      const ratingsToSubmit = order.items
        .filter(item => ratings[item.id || item.name]?.rating > 0)
        .map(item => ({
          productId: item.id || 0,
          productName: item.name,
          rating: ratings[item.id || item.name].rating,
          review: ratings[item.id || item.name].review
        }))

      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: parseInt(orderId),
          ratings: ratingsToSubmit,
          customerName: order.customerName,
          phone: order.phone
        })
      })

      if (response.ok) {
        setSubmitted(true)
      } else {
        alert('Failed to submit ratings')
      }
    } catch (err) {
      console.error('Error submitting ratings:', err)
      alert('Failed to submit ratings')
    } finally {
      setSubmitting(false)
    }
  }

  const renderStarInput = (itemKey, currentRating) => {
    return (
      <div className="star-input">
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            className={`star ${star <= currentRating ? 'filled' : ''}`}
            onClick={() => setItemRating(itemKey, star)}
          >
            {star <= currentRating ? '★' : '☆'}
          </span>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="rate-page">
        <div className="loading">Loading order details...</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="rate-page">
        <div className="error-message">
          <h2>Order Not Found</h2>
          <p>Sorry, we couldn't find this order.</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Go to Menu
          </button>
        </div>
      </div>
    )
  }

  if (existingRatings.length > 0) {
    return (
      <div className="rate-page">
        <div className="already-rated">
          <h2>🙏 Thank You!</h2>
          <p>You have already rated this order.</p>
          <div className="existing-ratings">
            {existingRatings.map((r, idx) => (
              <div key={idx} className="existing-rating-item">
                <span className="item-name">{r.productName}</span>
                <span className="stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/')} className="btn-primary">
            Order Again
          </button>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="rate-page">
        <div className="success-message">
          <h2>🎉 Thank You!</h2>
          <p>Your ratings have been submitted successfully.</p>
          <p className="feedback-reminder">
            If you loved the food, please share your review in:<br/>
            • La Vida Ladies WhatsApp Group<br/>
            • La Vida Marketplace Channel
          </p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Order Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rate-page">
      <header className="rate-header">
        <h1>🍽️ Rate Your Order</h1>
        <p>Order #{orderId} • {order.customerName}</p>
      </header>

      <div className="rate-items">
        {order.items.map((item, idx) => {
          const itemKey = item.id || item.name
          return (
            <div key={idx} className="rate-item-card">
              <div className="item-header">
                <span className="item-emoji">{item.emoji || '🍽️'}</span>
                <span className="item-name">{item.name}</span>
                <span className="item-qty">× {item.qty}</span>
              </div>
              
              <div className="rating-section">
                <label>Rate this item:</label>
                {renderStarInput(itemKey, ratings[itemKey]?.rating || 0)}
              </div>
              
              <div className="review-section">
                <textarea
                  placeholder="Share your experience (optional)"
                  value={ratings[itemKey]?.review || ''}
                  onChange={(e) => setItemReview(itemKey, e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="rate-actions">
        <button 
          className="btn-submit"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : '⭐ Submit Ratings'}
        </button>
        <button 
          className="btn-skip"
          onClick={() => navigate('/')}
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}

export default RatePage
