function ItemCard({ item, selected, onToggle, glowReady }) {
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
      </div>
    </div>
  )
}

export default ItemCard
