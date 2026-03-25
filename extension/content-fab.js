(() => {
  const STORAGE_KEY = 'alphia_cart'

  // Don't inject on extension pages or localhost (webapp)
  if (
    location.protocol === 'chrome-extension:' ||
    location.hostname === 'localhost'
  )
    return

  // Build the FAB container
  const fab = document.createElement('div')
  fab.id = 'alphia-fab'
  fab.innerHTML = `
    <button id="alphia-fab-btn" title="Save to Alphia">
      <img src="${chrome.runtime.getURL('icons/alphia.png')}" alt="Alphia" />
    </button>
    <div id="alphia-fab-panel">
      <div class="alphia-panel-header">
        <span>Add to Alphia</span>
        <button id="alphia-panel-close">&times;</button>
      </div>
      <img id="alphia-panel-img" />
      <label>Title</label>
      <input type="text" id="alphia-panel-title" placeholder="Product title" />
      <div class="alphia-panel-row">
        <div class="alphia-panel-field">
          <label>Price</label>
          <input type="number" id="alphia-panel-price" placeholder="0.00" step="0.01" />
        </div>
        <div class="alphia-panel-field">
          <label>Brand</label>
          <input type="text" id="alphia-panel-brand" placeholder="Brand" />
        </div>
      </div>
      <div class="alphia-panel-row">
        <div class="alphia-panel-field">
          <label>Color</label>
          <input type="text" id="alphia-panel-color" placeholder="Color" />
        </div>
        <div class="alphia-panel-field">
          <label>Size</label>
          <input type="text" id="alphia-panel-size" placeholder="Size" />
        </div>
      </div>
      <div class="alphia-panel-row">
        <div class="alphia-panel-field">
          <label>Material</label>
          <input type="text" id="alphia-panel-material" placeholder="Material" />
        </div>
        <div class="alphia-panel-field">
          <label>Category</label>
          <input type="text" id="alphia-panel-category" placeholder="Category" />
        </div>
      </div>
      <label>Image URL</label>
      <input type="text" id="alphia-panel-image" placeholder="Image URL" />
      <button id="alphia-panel-save">Save Item</button>
      <div id="alphia-panel-status"></div>
    </div>
  `
  document.body.appendChild(fab)

  const fabBtn = document.getElementById('alphia-fab-btn')
  const panel = document.getElementById('alphia-fab-panel')
  const closeBtn = document.getElementById('alphia-panel-close')
  const titleInput = document.getElementById('alphia-panel-title')
  const priceInput = document.getElementById('alphia-panel-price')
  const brandInput = document.getElementById('alphia-panel-brand')
  const colorInput = document.getElementById('alphia-panel-color')
  const sizeInput = document.getElementById('alphia-panel-size')
  const materialInput = document.getElementById('alphia-panel-material')
  const categoryInput = document.getElementById('alphia-panel-category')
  const imageInput = document.getElementById('alphia-panel-image')
  const imgPreview = document.getElementById('alphia-panel-img')
  const saveBtn = document.getElementById('alphia-panel-save')
  const statusMsg = document.getElementById('alphia-panel-status')

  let panelOpen = false

  function extractPageData() {
    const extractPrice = (text) => {
      if (!text) return ''
      const match = text.match(/\d+(\.\d{2})?/)
      return match ? match[0] : ''
    }

    const isValidImageUrl = (url) => {
      if (!url) return false
      const lower = url.toLowerCase()
      const exclude = ['avatar', 'logo', 'icon', 'shipping', 'delivery', 'pixel', 'tracking', 'spacer']
      return !exclude.some((p) => lower.includes(p))
    }

    // Title
    const title =
      document.querySelector('meta[property="og:title"]')?.content ||
      document.querySelector('meta[name="twitter:title"]')?.content ||
      document.title ||
      ''

    // Price
    let price =
      document.querySelector('meta[itemprop="price"]')?.content ||
      document.querySelector('meta[property="product:price:amount"]')?.content ||
      ''

    if (!price) {
      const selectors = ['[data-price]', '.price', '.product-price', '.product__price', '[itemprop="price"]', '.current-price', '.final-price', '.sale-price']
      for (const sel of selectors) {
        const el = document.querySelector(sel)
        if (el) {
          const text = el.textContent || el.getAttribute('data-price') || ''
          const extracted = extractPrice(text)
          if (extracted) { price = extracted; break }
        }
      }
    }

    if (!price) {
      const match = document.body.innerText.match(/\$\d+(\.\d{2})?/)
      if (match) price = extractPrice(match[0])
    }

    // Image
    let image =
      document.querySelector('meta[property="og:image"]')?.content ||
      document.querySelector('meta[name="twitter:image"]')?.content ||
      ''

    if (!image) {
      const selectors = ['img[alt*="product" i]', 'img[src*="product" i]', '.product-image img', '.product-photo img']
      for (const sel of selectors) {
        const el = document.querySelector(sel)
        if (el && isValidImageUrl(el.src)) { image = el.src; break }
      }
    }

    if (!image) {
      let largest = null
      let largestArea = 0
      for (const img of document.querySelectorAll('img')) {
        const src = img.src || img.getAttribute('data-src')
        if (src && isValidImageUrl(src)) {
          const area = (img.naturalWidth || img.width || 0) * (img.naturalHeight || img.height || 0)
          if (area > largestArea && area > 5000) { largestArea = area; largest = src }
        }
      }
      if (largest) image = largest
    }

    // Brand
    const brand =
      document.querySelector('meta[property="product:brand"]')?.content ||
      document.querySelector('meta[name="brand"]')?.content ||
      document.querySelector('[itemprop="brand"] [itemprop="name"]')?.textContent?.trim() ||
      document.querySelector('[itemprop="brand"]')?.content ||
      document.querySelector('[itemprop="brand"]')?.textContent?.trim() ||
      document.querySelector('[data-brand]')?.getAttribute('data-brand') ||
      document.querySelector('meta[property="og:site_name"]')?.content ||
      ''

    // Color
    const color =
      document.querySelector('[name="color" i] option:checked')?.textContent?.trim() ||
      document.querySelector('meta[itemprop="color"]')?.content ||
      document.querySelector('[data-color]')?.textContent?.trim() ||
      document.querySelector('[class*="color"][class*="selected" i]')?.textContent?.trim() ||
      document.querySelector('[class*="colour"][class*="selected" i]')?.textContent?.trim() ||
      ''

    // Size
    const size =
      document.querySelector('[name="size" i] option:checked')?.textContent?.trim() ||
      document.querySelector('meta[itemprop="size"]')?.content ||
      document.querySelector('[data-size]')?.textContent?.trim() ||
      document.querySelector('[class*="size"][class*="selected" i]')?.textContent?.trim() ||
      ''

    // Material
    const material =
      document.querySelector('meta[itemprop="material"]')?.content ||
      document.querySelector('[data-material]')?.textContent?.trim() ||
      document.querySelector('[class*="material" i]')?.textContent?.trim() ||
      document.querySelector('[class*="fabric" i]')?.textContent?.trim() ||
      document.querySelector('[class*="composition" i]')?.textContent?.trim() ||
      ''

    // Category
    const category =
      document.querySelector('meta[property="product:category"]')?.content ||
      document.querySelector('[itemprop="category"]')?.content ||
      document.querySelector('[data-category]')?.getAttribute('data-category') ||
      document.querySelector('nav[class*="breadcrumb" i] a:last-of-type')?.textContent?.trim() ||
      document.querySelector('[class*="breadcrumb" i] a:last-of-type')?.textContent?.trim() ||
      ''

    return {
      title: title.trim(),
      price: price.trim(),
      image: image.trim(),
      brand: brand.trim(),
      color: color.trim(),
      size: size.trim(),
      material: material.trim(),
      category: category.trim(),
    }
  }

  function populatePanel() {
    const data = extractPageData()
    titleInput.value = data.title
    priceInput.value = parseFloat(data.price) || ''
    brandInput.value = data.brand
    colorInput.value = data.color
    sizeInput.value = data.size
    materialInput.value = data.material
    categoryInput.value = data.category
    imageInput.value = data.image
    if (data.image) {
      imgPreview.src = data.image
      imgPreview.style.display = 'block'
    } else {
      imgPreview.style.display = 'none'
    }
    statusMsg.textContent = ''
  }

  fabBtn.addEventListener('click', () => {
    panelOpen = !panelOpen
    panel.classList.toggle('open', panelOpen)
    fabBtn.classList.toggle('active', panelOpen)
    if (panelOpen) populatePanel()
  })

  closeBtn.addEventListener('click', () => {
    panelOpen = false
    panel.classList.remove('open')
    fabBtn.classList.remove('active')
  })

  imageInput.addEventListener('input', () => {
    imgPreview.src = imageInput.value
    imgPreview.style.display = imageInput.value ? 'block' : 'none'
  })

  saveBtn.addEventListener('click', () => {
    const newItem = {
      id: Date.now().toString(),
      title: titleInput.value,
      price: parseFloat(priceInput.value) || 0,
      brand: brandInput.value,
      color: colorInput.value,
      size: sizeInput.value,
      material: materialInput.value,
      category: categoryInput.value,
      imageUrl: imageInput.value,
      savedAt: new Date().toISOString(),
      sourceUrl: location.href,
    }

    chrome.storage.local.get([STORAGE_KEY], (result) => {
      const cart = result[STORAGE_KEY] || []
      cart.push(newItem)
      chrome.storage.local.set({ [STORAGE_KEY]: cart }, () => {
        statusMsg.textContent = 'Saved!'
        statusMsg.style.color = '#22c55e'
        setTimeout(() => {
          panelOpen = false
          panel.classList.remove('open')
          fabBtn.classList.remove('active')
        }, 1200)
      })
    })
  })

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (panelOpen && !fab.contains(e.target)) {
      panelOpen = false
      panel.classList.remove('open')
      fabBtn.classList.remove('active')
    }
  })
})()
