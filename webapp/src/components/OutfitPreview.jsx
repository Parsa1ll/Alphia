function OutfitPreview({ image, message, onBack }) {
  return (
    <div className="result-section">
      <h2>Your Outfit</h2>
      {image && (
        <div className="outfit-image">
          <img src={image} alt="Generated outfit preview" />
        </div>
      )}
      {message && <div className="alphia-message">{message}</div>}
      <div style={{ textAlign: 'center' }}>
        <button className="btn btn-secondary" onClick={onBack}>
          ← Back to Cart
        </button>
      </div>
    </div>
  )
}

export default OutfitPreview
