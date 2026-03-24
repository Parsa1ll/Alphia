import { useState, useEffect, useRef } from 'react'
import CartGrid from './components/CartGrid'
import Header from './components/Header'
import CartSummary from './components/CartSummary'
import Rating from './components/Rating'
import LoadingState from './components/LoadingState'

const STORAGE_KEY = 'alphia_cart'

function App() {
  const [cartItems, setCartItems] = useState([])
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [userPhoto, setUserPhoto] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [previewData, setPreviewData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const cartScrollRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    loadCartItems()

    const onStorageChange = (e) => {
      if (e.key === STORAGE_KEY) {
        setCartItems(JSON.parse(e.newValue || '[]'))
      }
    }
    window.addEventListener('storage', onStorageChange)
    return () => window.removeEventListener('storage', onStorageChange)
  }, [])

  const loadCartItems = () => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        setCartItems(result[STORAGE_KEY] || [])
      })
    } else {
      const stored = localStorage.getItem(STORAGE_KEY)
      setCartItems(stored ? JSON.parse(stored) : [])
    }
  }

  const deleteItem = (itemId) => {
    const updatedCart = cartItems.filter((item) => item.id !== itemId)
    setCartItems(updatedCart)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(itemId)
      return next
    })
    saveCartItems(updatedCart)
  }

  const toggleSelect = (itemId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }

  const saveCartItems = (items) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ [STORAGE_KEY]: items })
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
      window.dispatchEvent(new CustomEvent('alphia_cart_updated', {
        detail: JSON.stringify(items),
      }))
    }
  }

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const processFile = (file) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (event) => setUserPhoto(event.target.result)
    reader.readAsDataURL(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => setDragOver(false)

  const scrollCart = (direction) => {
    if (cartScrollRef.current) {
      const amount = 320
      cartScrollRef.current.scrollBy({
        left: direction === 'right' ? amount : -amount,
        behavior: 'smooth',
      })
    }
  }

  const selectedItems = cartItems.filter((item) => selectedIds.has(item.id))

  const generateOutfitPreview = async () => {
    if (selectedItems.length === 0) {
      setError('Select at least one item')
      return
    }
    if (!userPhoto) {
      setError('Please upload a photo first')
      return
    }

    setLoading(true)
    setError(null)
    setPreviewData(null)

    try {
      const itemDetails = selectedItems.map((item) => item.title).join(', ')

      const outfitImage = await generateOutfitImage(itemDetails)
      const messageData = await generateAlphiaMessage(outfitImage, itemDetails)

      setPreviewData({
        image: outfitImage,
        message: messageData.message,
        rating: messageData.rating,
      })
    } catch (err) {
      setError(err.message || 'Failed to generate outfit preview')
    } finally {
      setLoading(false)
    }
  }

  const generateOutfitImage = async (itemDetails) => {
    const BACKEND_URL = 'http://localhost:4000'
    const response = await fetch(`${BACKEND_URL}/api/generate-outfit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userPhotoBase64: userPhoto.split(',')[1],
        itemNames: itemDetails.split(', '),
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to generate outfit')
    }

    const data = await response.json()
    if (data.imageBase64) return `data:image/png;base64,${data.imageBase64}`
    throw new Error(data.message || 'No image generated')
  }

  const generateAlphiaMessage = async (outfitImage, itemDetails) => {
    const BACKEND_URL = 'http://localhost:4000'
    const response = await fetch(`${BACKEND_URL}/api/generate-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        outfitImageBase64: outfitImage.split(',')[1],
        itemNames: itemDetails.split(', '),
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to generate message')
    }

    const data = await response.json()
    return { message: data.message, rating: data.rating }
  }

  return (
    <div className="container">
      <Header />

      {/* Shopping Cart Row */}
      <section className="cart-row">
        <div className="cart-row-header">
          <h2>Shopping Cart</h2>
          <div className="cart-controls">
            <button
              className={`select-all-btn ${selectedIds.size === 0 && cartItems.length > 0 && !userPhoto ? 'glow-ready' : ''}`}
              onClick={() => {
                if (selectedIds.size === cartItems.length) {
                  setSelectedIds(new Set())
                } else {
                  setSelectedIds(new Set(cartItems.map((i) => i.id)))
                }
              }}
              disabled={cartItems.length === 0}
            >
              {selectedIds.size === cartItems.length && cartItems.length > 0 ? 'Deselect All' : 'Select All'}
            </button>
            <button
              className="select-all-btn"
              onClick={() => {
                setCartItems([])
                setSelectedIds(new Set())
                saveCartItems([])
              }}
              disabled={cartItems.length === 0}
            >
              Clear Cart
            </button>
            <div className="cart-scroll-controls">
              <button className="scroll-btn" onClick={() => scrollCart('left')}>
                <i className="fas fa-chevron-left"></i>
              </button>
              <button className="scroll-btn" onClick={() => scrollCart('right')}>
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
        <div className="cart-scroll" ref={cartScrollRef}>
          {cartItems.length === 0 ? (
            <div className="empty-state">
              <p>No items yet. Start saving from your favorite stores!</p>
            </div>
          ) : (
            <CartGrid
              items={cartItems}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onDeleteItem={deleteItem}
              glowReady={selectedIds.size === 0 && cartItems.length > 0}
            />
          )}
        </div>
      </section>

      {/* Bottom Section - 3 columns */}
      <section className="bottom-section">
        {/* Upload */}
        <div
          className={`upload-zone ${dragOver ? 'drag-over' : ''} ${userPhoto ? 'has-photo' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <h2>Upload a snapshot</h2>
          <div className={`upload-area ${selectedIds.size > 0 && !userPhoto ? 'glow-ready' : ''}`}>
            {userPhoto ? (
              <img src={userPhoto} alt="Your photo" className="upload-preview" />
            ) : (
              <div className="upload-placeholder">
                <i className="fas fa-cloud-arrow-up"></i>
                <p>Drag & drop or click to upload</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              hidden
            />
          </div>
        </div>

        {/* Visualization */}
        <div className="visualization-zone">
          <h2><span className="alphia-text">Alphia</span> Visualization</h2>
          <div className={`visualization-area ${loading ? 'glow-ready' : ''}`}>
            {loading ? (
              <LoadingState />
            ) : previewData?.image ? (
              <img src={previewData.image} alt="Outfit preview" className="outfit-result-img" />
            ) : (
              <div className="visualization-placeholder">
                <i className="fas fa-wand-magic-sparkles"></i>
                <p>Your outfit will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Summary Sidebar */}
        <div className="summary-zone">
          <div className="summary-card">
            <h3>Cart Summary</h3>
            <CartSummary items={selectedItems} />
          </div>
          <div className={`summary-card alphia-card ${selectedItems.length > 0 && userPhoto && !loading ? 'glow-ready' : ''}`}>
            <h3><span className="alphia-text">Alphia</span> Feedback</h3>
            <div className="bot-message">
              <div className="bot-avatar">
                <img src="/alphia.png" alt="Alphia" />
              </div>
              <div className="bot-bubble">
                {previewData?.message
                  || (loading
                    ? 'Working on your outfit, hold tight...'
                    : selectedItems.length === 0
                      ? <>Hi I'm <span className="alphia-text">Alphia</span>! Your smart shopping assistant. Start by selecting some items from your cart!</>
                      : !userPhoto
                        ? 'Now upload a photo of yourself!'
                        : 'Hit the generate button to see the magic!'
                  )}
              </div>
            </div>
            <Rating
              score={previewData?.rating}
              onGenerate={generateOutfitPreview}
              disabled={selectedItems.length === 0 || !userPhoto || loading}
              loading={loading}
              glowReady={selectedItems.length > 0 && userPhoto && !loading}
            />
          </div>
          {error && (
            <div className="error-state">
              <p>{error}</p>
              <button className="btn btn-secondary" onClick={() => setError(null)}>Dismiss</button>
            </div>
          )}
        </div>

      </section>
    </div>
  )
}

export default App
