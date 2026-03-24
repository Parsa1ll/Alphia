function updateBadgeCount() {
  chrome.storage.local.get(['alphia_cart'], (result) => {
    const activeCart = result.alphia_cart || [];
    const itemCount = activeCart.length;
    const badgeText = itemCount > 0 ? itemCount.toString() : '';
    
    chrome.action.setBadgeText({ text: badgeText });
    chrome.action.setBadgeBackgroundColor({ color: '#000000' });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  updateBadgeCount();
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.alphia_cart) {
    updateBadgeCount();
  }
});
