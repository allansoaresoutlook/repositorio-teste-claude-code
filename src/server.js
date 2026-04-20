require('dotenv').config()
const express = require('express')
const cors = require('cors')
const axios = require('axios')

const app = express()
const PORT = process.env.BACKEND_PORT || 3001

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY
const INSTANCE_NAME = process.env.INSTANCE_NAME

app.use(cors())
app.use(express.json())

function sanitizeNumber(num) {
  return String(num).replace(/[\s\-\(\)\+\.]/g, '')
}

function isValidNumber(num) {
  return /^\d{10,15}$/.test(num)
}

async function sendWhatsAppMessage(number, text) {
  const baseUrl = EVOLUTION_API_URL.replace(/\/$/, '')
  const url = `${baseUrl}/message/sendText/${INSTANCE_NAME}`

  const response = await axios.post(
    url,
    { number: `${number}@s.whatsapp.net`, text },
    {
      headers: {
        apikey: EVOLUTION_API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    }
  )
  return response.data
}

app.post('/api/send-messages', async (req, res) => {
  const { numbers, message } = req.body

  if (!Array.isArray(numbers) || numbers.length === 0) {
    return res.status(400).json({ error: 'Lista de números inválida ou vazia.' })
  }
  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: 'Mensagem é obrigatória.' })
  }

  const details = []

  for (const raw of numbers) {
    const clean = sanitizeNumber(raw)

    if (!isValidNumber(clean)) {
      details.push({ number: String(raw), status: 'error', message: 'Número inválido (deve ter 10-15 dígitos).' })
      continue
    }

    try {
      await sendWhatsAppMessage(clean, message.trim())
      details.push({ number: clean, status: 'success' })
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Erro desconhecido'
      details.push({ number: clean, status: 'error', message: String(errMsg) })
    }
  }

  const success = details.filter((d) => d.status === 'success').length
  const failed = details.filter((d) => d.status === 'error').length

  res.json({ success, failed, details })
})

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', instance: INSTANCE_NAME })
})

app.listen(PORT, () => {
  console.log(`Backend rodando em http://localhost:${PORT}`)
  console.log(`Instance: ${INSTANCE_NAME}`)
})
