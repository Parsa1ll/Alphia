function ItemCard({ item, selected, onToggle, glowReady }) {
  const details = [item.brand, item.color, item.size, item.material, item.category].filter(Boolean)

  return (
    <div className={`item-card ${selected ? 'selected' : ''} ${glowReady ? 'glow-ready' : ''}`} onClick={onToggle}>
      <div className={`item-check ${glowReady ? 'glow-ready' : ''}`}>
        <i className="fas fa-check"></i>
      </div>
      <div className="item-image">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.title} />
        ) : (
          <div style={{ color: '#999', fontSize: '0.8rem' }}>No Image</div>
        )}
      </div>
      <div className="item-info">
        <div className="item-title">{item.title}</div>
        <div className="item-price">${parseFloat(item.price).toFixed(2)}</div>
        {details.length > 0 && (
          <div className="item-details">{details.join(' · ')}</div>
        )}
        {item.sourceUrl && (
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="item-shop-btn"
            onClick={(e) => e.stopPropagation()}
          >
            Shop item
          </a>
        )}
      </div>
    </div>
  )
}

export default ItemCard
