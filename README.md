# Alphia - Smart Cart & AI Outfit Assistant

Alphia is a Chrome Extension and web app that lets you save clothing items from any online store, view them in a smart cart, and generate AI-powered outfit previews using your own photo.

To make this possible, we are using a Chrome Extension (Manifest V3) for product scraping and storage, a React + Vite web app for the smart cart dashboard, an Express.js backend as a proxy, and Google's Gemini API for AI-powered outfit generation and styling feedback.

---

## Features

### Save Items From Any Store
- A floating button appears on every website you visit
- Click it to auto-extract the product title, price, image, brand, color, size, material, and category
- Manually edit any field before saving
- Items are stored locally in Chrome's extension storage

### Smart Cart Dashboard
- View all saved items in a horizontal scrollable cart
- Select items to include in your outfit
- See a live cart summary with prices and totals
- Clear your cart or delete individual items
- Click "Shop item" to go back to the original product page

### AI Outfit Generation
- Upload a photo of yourself
- Select the clothing items you want to try on
- Gemini generates a realistic image of you wearing those exact items, using the actual product images as reference
- Alphia provides a personalized outfit feedback message and rating

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Extension | Chrome Extension, Manifest V3, Vanilla JS |
| Frontend | React 18, Vite |
| Backend | Express.js, Node.js |
| AI | Google Gemini API (gemini-3-pro-image-preview) |
| Storage | chrome.storage.local (synced to localStorage for dev) |

---

## Project Structure

```
Alphia/
├── extension/
│   ├── manifest.json           # Manifest V3 config
│   ├── popup.html / popup.js   # Extension popup UI & scraping logic
│   ├── background.js           # Badge count service worker
│   ├── content-fab.js          # Floating action button on all sites
│   ├── content-fab.css         # FAB styles
│   ├── content-bridge.js       # Storage sync bridge for localhost
│   └── icons/                  # Extension & app icons
├── webapp/
│   ├── index.html              # Entry HTML
│   ├── src/
│   │   ├── App.jsx             # Main app component
│   │   ├── main.jsx            # React entry point
│   │   ├── index.css           # All styles
│   │   └── components/
│   │       ├── CartGrid.jsx    # Cart item grid
│   │       ├── ItemCard.jsx    # Individual item card
│   │       ├── CartSummary.jsx # Price summary for selected items
│   │       ├── Header.jsx      # App header
│   │       ├── Rating.jsx      # Rating display & generate button
│   │       └── LoadingState.jsx# Animated loading indicator
│   └── public/                 # Static assets (logos, favicon)
├── backend/
│   ├── server.js               # Express API (Gemini proxy)
│   ├── package.json
│   └── .env                    # API keys & config
├── PLAN.md                     # Original project plan
└── README.md
```

---

## Getting Started

### Prerequisites

- **Chrome** browser
- **Node.js** (v18+)
- **Google Gemini API key** from [Google AI Studio](https://aistudio.google.com)

### 1. Clone the repo

```bash
git clone https://github.com/Parsa1ll/Alphia.git
cd Alphia
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create a `.env` file:

```env
GEMINI_API_KEY=your-gemini-api-key
GEMINI_TEXT_MODEL=gemini-3-pro-image-preview
GEMINI_IMAGE_MODEL=gemini-3-pro-image-preview
PORT=4000
FRONTEND_ORIGIN=http://localhost:3000,http://localhost:3001
```

Start the backend:

```bash
npm run dev
```

### 3. Set up the web app

```bash
cd webapp
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

### 4. Load the Chrome Extension

1. Open `chrome://extensions`
2. Enable **Developer Mode** (top right)
3. Click **Load unpacked**
4. Select the `extension/` folder
5. The Alphia icon appears in your toolbar

---

## Usage

1. **Browse** any clothing store (H&M, Zara, Nike, etc.)
2. **Click** the floating Alphia button in the bottom-right corner
3. **Review** the auto-extracted product details and click **Save Item**
4. **Open** `http://localhost:3000` to see your smart cart
5. **Select** the items you want to try on
6. **Upload** a photo of yourself
7. **Click** the generate button to see your AI outfit preview

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/generate-outfit` | Generate outfit image from user photo + product images |
| POST | `/api/generate-message` | Generate Alphia's feedback message and rating |
