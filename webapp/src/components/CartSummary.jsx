function CartSummary({ items }) {
  if (items.length === 0) {
    return <div className="cart-summary-empty">Select items to see summary</div>
  }

  const total = items.reduce((sum, item) => sum + parseFloat(item.price || 0), 0)

  return (
    <div className="cart-summary-list">
      {items.map((item) => (
        <div key={item.id} className="cart-summary-item">
          <span>{item.title}</span>
          <span>${parseFloat(item.price).toFixed(2)}</span>
        </div>
      ))}
      <div className="cart-summary-divider" />
      <div className="cart-summary-total">
        <span>Total</span>
        <span>${total.toFixed(2)}</span>
      </div>
    </div>
  )
}

export default CartSummary
