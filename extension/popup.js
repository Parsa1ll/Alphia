const titleInput = document.getElementById('titleInput');
const priceInput = document.getElementById('priceInput');
const imageInput = document.getElementById('imageInput');
const colorInput = document.getElementById('colorInput');
const sizeInput = document.getElementById('sizeInput');
const materialInput = document.getElementById('materialInput');
const skuInput = document.getElementById('skuInput');
const notesInput = document.getElementById('notesInput');
const imagePreview = document.getElementById('imagePreview');
const saveBtn = document.getElementById('saveBtn');
const statusMsg = document.getElementById('statusMsg');

let currentSourceUrl = '';

function extractPageData() {
  // ===== HELPER FUNCTIONS =====
  
  const extractPrice = (text) => {
    if (!text) return '';
    const match = text.match(/[\d,]+(\.[\d]{2})?/);
    return match ? match[0].replace(/,/g, '') : '';
  };

  const isValidImageUrl = (url) => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    const excludePatterns = ['avatar', 'logo', 'icon', 'shipping', 'delivery', 'pixel', 'tracking', 'spacer'];
    return !excludePatterns.some(p => lowerUrl.includes(p));
  };

  const isLikelyIcon = (img) => {
    const width = img.naturalWidth || img.width || 0;
    const height = img.naturalHeight || img.height || 0;
    return (width < 200 && height < 200) || (width === height && width < 150);
  };

  // ===== TITLE EXTRACTION =====
  const finalTitle = document.querySelector('meta[property="og:title"]')?.content ||
                    document.querySelector('meta[name="twitter:title"]')?.content ||
                    document.title || '';

  // ===== PRICE EXTRACTION =====
  let finalPrice = '';
  
  finalPrice = document.querySelector('meta[itemprop="price"]')?.content ||
              document.querySelector('meta[property="product:price:amount"]')?.content ||
              document.querySelector('meta[name="price"]')?.content;

  if (!finalPrice) {
    const priceSelectors = [
      '[data-price]',
      '[data-original-price]',
      '.price',
      '.product-price',
      '.product__price',
      '[itemprop="price"]',
      '.current-price',
      '.final-price',
      '.sale-price'
    ];
    
    for (let selector of priceSelectors) {
      const elem = document.querySelector(selector);
      if (elem) {
        const text = elem.textContent || elem.value || elem.getAttribute('data-price') || '';
        const extracted = extractPrice(text);
        if (extracted) {
          finalPrice = extracted;
          break;
        }
      }
    }
  }

  if (!finalPrice) {
    const patterns = [/\$\d+(\.\d{2})?/, /[\d,]+\.\d{2}/, /\d+\.\d{2}/];
    for (let pattern of patterns) {
      const match = document.body.innerText.match(pattern);
      if (match) {
        finalPrice = extractPrice(match[0]);
        if (finalPrice) break;
      }
    }
  }

  // ===== IMAGE EXTRACTION =====
  let finalImage = document.querySelector('meta[property="og:image"]')?.content ||
                  document.querySelector('meta[name="twitter:image"]')?.content ||
                  document.querySelector('meta[itemprop="image"]')?.content;

  if (!finalImage) {
    const imageSelectors = [
      'img[alt*="product" i]',
      'img[src*="product" i]',
      'img[class*="product" i]',
      '.product-image img',
      '.product-photo img',
      'img.product'
    ];
    
    for (let selector of imageSelectors) {
      const elem = document.querySelector(selector);
      if (elem && isValidImageUrl(elem.src)) {
        finalImage = elem.src;
        break;
      }
    }
  }

  if (!finalImage) {
    const images = document.querySelectorAll('img');
    let largestImg = null;
    let largestArea = 0;
    
    for (let img of images) {
      const src = img.src || img.getAttribute('data-src');
      if (src && isValidImageUrl(src) && !isLikelyIcon(img)) {
        const width = img.naturalWidth || img.width || 0;
        const height = img.naturalHeight || img.height || 0;
        const area = width * height;
        if (area > largestArea && area > 5000) {
          largestArea = area;
          largestImg = src;
        }
      }
    }
    if (largestImg) finalImage = largestImg;
  }

  // ===== COLOR EXTRACTION =====
  let finalColor = document.querySelector('[name="color" i] option:checked')?.textContent?.trim() ||
                  document.querySelector('[data-color]')?.textContent?.trim() ||
                  document.querySelector('[class*="color"][class*="selected" i]')?.textContent?.trim() ||
                  document.querySelector('meta[itemprop="color"]')?.content || '';

  // ===== SIZE EXTRACTION =====
  let finalSize = document.querySelector('[name="size" i] option:checked')?.textContent?.trim() ||
                 document.querySelector('[data-size]')?.textContent?.trim() ||
                 document.querySelector('[class*="size"][class*="selected" i]')?.textContent?.trim() ||
                 document.querySelector('meta[itemprop="size"]')?.content || '';

  // ===== MATERIAL EXTRACTION =====
  let finalMaterial = document.querySelector('meta[itemprop="material"]')?.content ||
                     document.querySelector('[data-material]')?.textContent?.trim() ||
                     document.querySelector('[class*="material" i]')?.textContent?.trim() ||
                     document.querySelector('[class*="fabric" i]')?.textContent?.trim() ||
                     document.querySelector('[class*="composition" i]')?.textContent?.trim() || '';

  // ===== SKU EXTRACTION =====
  let finalSku = document.querySelector('meta[itemprop="sku"]')?.content ||
                document.querySelector('[data-sku]')?.getAttribute('data-sku') ||
                document.querySelector('[data-product-id]')?.getAttribute('data-product-id') ||
                document.querySelector('[class*="sku" i]')?.textContent?.trim() || '';

  return {
    finalTitle: finalTitle.trim(),
    finalPrice: finalPrice.trim(),
    finalImage: finalImage.trim(),
    finalColor: finalColor.trim(),
    finalSize: finalSize.trim(),
    finalMaterial: finalMaterial.trim(),
    finalSku: finalSku.trim()
  };
}

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const activeTab = tabs[0];
  currentSourceUrl = activeTab.url;

  chrome.scripting.executeScript(
    {
      target: { tabId: activeTab.id },
      func: extractPageData,
    },
    (injectionResults) => {
      if (injectionResults && injectionResults[0] && injectionResults[0].result) {
        const result = injectionResults[0].result;
        const {
          finalTitle = '',
          finalPrice = '',
          finalImage = '',
          finalColor = '',
          finalSize = '',
          finalMaterial = '',
          finalSku = ''
        } = result || {};

        titleInput.value = finalTitle;
        priceInput.value = parseFloat(finalPrice) || '';
        imageInput.value = finalImage;
        colorInput.value = finalColor;
        sizeInput.value = finalSize;
        materialInput.value = finalMaterial;
        skuInput.value = finalSku;
        notesInput.value = '';

        if (finalImage) {
          imagePreview.src = finalImage;
          imagePreview.style.display = 'block';
        }
      } else {
        statusMsg.textContent = 'Could not extract data from this page.';
        statusMsg.style.color = 'orange';
      }
    }
  );
});

imageInput.addEventListener('input', () => {
  imagePreview.src = imageInput.value;
  imagePreview.style.display = imageInput.value ? 'block' : 'none';
});

saveBtn.addEventListener('click', () => {
  const newItem = {
    id: Date.now().toString(),
    title: titleInput.value,
    price: parseFloat(priceInput.value) || 0,
    imageUrl: imageInput.value,
    color: colorInput.value,
    size: sizeInput.value,
    material: materialInput.value,
    sku: skuInput.value,
    notes: notesInput.value,
    savedAt: new Date().toISOString(),
    sourceUrl: currentSourceUrl
  };

  chrome.storage.local.get(['alphia_cart'], (result) => {
    const activeCart = result.alphia_cart || [];
    activeCart.push(newItem);

    chrome.storage.local.set({ alphia_cart: activeCart }, () => {
      statusMsg.textContent = 'Saved to Alphia!';
      setTimeout(() => window.close(), 1500);
    });
  });
});

// Toggle More Details section
document.addEventListener('DOMContentLoaded', function() {
  const toggle = document.getElementById('toggleOptional');
  const fields = document.getElementById('optionalFields');
  
  if (toggle && fields) {
    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      toggle.classList.toggle('collapsed');
      fields.classList.toggle('visible');
    });
  }
});