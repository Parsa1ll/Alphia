import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import { GoogleGenAI } from '@google/genai'

dotenv.config()

const app = express()
const port = process.env.PORT || 4000
const corsOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || corsOrigins.includes(origin)) {
        callback(null, true)
        return
      }
      callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
  })
)
app.use(express.json({ limit: '10mb' }))

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

const getGemini = () => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set')
  }
  return new GoogleGenAI({ apiKey })
}

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`)
  next()
})

// Generate outfit image from user photo + items
app.post('/api/generate-outfit', async (req, res) => {
  try {
    const { userPhotoBase64, itemNames } = req.body

    if (!userPhotoBase64) {
      return res.status(400).json({ error: 'User photo is required.' })
    }

    if (!itemNames || itemNames.length === 0) {
      return res.status(400).json({ error: 'Item names are required.' })
    }

    const itemList = itemNames.join(', ')
    const prompt = `You are a professional fashion designer and stylist. Look at the person in the uploaded photo. Generate a realistic image of that same person wearing these clothing items together: ${itemList}.

Keep the person's pose, body proportions, and facial features the same. Only change their clothing to the items listed. The setting and background should remain similar. Make it look natural and stylish.`

    const client = getGemini()
    const imageModel = process.env.GEMINI_IMAGE_MODEL || 'gemini-3-pro-image-preview'
    console.log('Using image model:', imageModel)

    const response = await client.models.generateContent({
      model: imageModel,
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: userPhotoBase64,
              },
            },
          ],
        },
      ],
    })

    const imagePart = response.candidates?.[0]?.content?.parts?.find(
      (part) => part.inlineData
    )

    if (imagePart?.inlineData?.data) {
      return res.json({
        imageBase64: imagePart.inlineData.data,
        mimeType: imagePart.inlineData.mimeType || 'image/png',
      })
    }

    const textPart = response.candidates?.[0]?.content?.parts?.find(
      (part) => part.text
    )
    return res.json({ message: textPart?.text || 'No image was generated.' })
  } catch (error) {
    console.error('Generate outfit error:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Outfit generation failed.',
    })
  }
})

// Generate Alphia's message from outfit image
app.post('/api/generate-message', async (req, res) => {
  try {
    const { outfitImageBase64, itemNames } = req.body

    if (!outfitImageBase64) {
      return res.status(400).json({ error: 'Outfit image is required.' })
    }

    if (!itemNames || itemNames.length === 0) {
      return res.status(400).json({ error: 'Item names are required.' })
    }

    const itemList = itemNames.join(', ')
    const prompt = `You are Alphia, a friendly shopping assistant. Look at this outfit image featuring these items: ${itemList}.

Respond in EXACTLY this JSON format (no markdown, no code fences):
{"message": "Your 2-sentence compliment about the outfit here. Be warm, encouraging, mention how the pieces work together. Under 50 words.", "rating": 85}

The rating should be a number from 0-100 representing how well the outfit works together (style cohesion, color harmony, overall look). Be honest but encouraging.`

    const client = getGemini()
    const textModel = process.env.GEMINI_TEXT_MODEL || 'gemini-2.0-flash-exp'

    const response = await client.models.generateContent({
      model: textModel,
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: outfitImageBase64,
              },
            },
          ],
        },
      ],
    })

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text

    if (text) {
      try {
        const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
        const parsed = JSON.parse(cleaned)
        return res.json({
          message: parsed.message || text,
          rating: typeof parsed.rating === 'number' ? parsed.rating : null,
        })
      } catch {
        return res.json({ message: text, rating: null })
      }
    }

    return res.json({ message: 'No message generated.', rating: null })
  } catch (error) {
    console.error('Generate message error:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Message generation failed.',
    })
  }
})

// 404 handler
app.use((req, res) => {
  console.error(`404: ${req.method} ${req.path}`)
  res.status(404).json({ error: 'Not found' })
})

// Error handler
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Server error.' })
})

app.listen(port, () => {
  console.log(`Alphia backend listening on port ${port}`)
})
