const STORAGE_KEY = 'alphia_cart'

// chrome.storage.local → localStorage (on load)
chrome.storage.local.get([STORAGE_KEY], (result) => {
  const cart = result[STORAGE_KEY] || []
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart))
  window.dispatchEvent(new Event('storage'))
})

// chrome.storage.local → localStorage (on change from extension popup)
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes[STORAGE_KEY]) {
    const cart = changes[STORAGE_KEY].newValue || []
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart))
    window.dispatchEvent(new StorageEvent('storage', {
      key: STORAGE_KEY,
      newValue: JSON.stringify(cart),
    }))
  }
})

// localStorage → chrome.storage.local (when webapp updates cart)
window.addEventListener('alphia_cart_updated', (e) => {
  const cart = JSON.parse(e.detail || '[]')
  chrome.storage.local.set({ [STORAGE_KEY]: cart })
})
