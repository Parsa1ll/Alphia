import ItemCard from './ItemCard'

function CartGrid({ items, selectedIds, onToggleSelect, onDeleteItem, glowReady }) {
  return (
    <div className="cart-grid">
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          selected={selectedIds.has(item.id)}
          onToggle={() => onToggleSelect(item.id)}
          onDelete={() => onDeleteItem(item.id)}
          glowReady={glowReady}
        />
      ))}
    </div>
  )
}

export default CartGrid
