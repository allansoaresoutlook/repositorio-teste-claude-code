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
  let clean = String(num).replace(/[\s\-\(\)\+\.]/g, '')
  // Se o número tiver 10 ou 11 dígitos (DDD + número), adiciona o prefixo 55 (Brasil)
  if (clean.length === 10 || clean.length === 11) {
    clean = '55' + clean
  }
  return clean
}

function isValidNumber(num) {
  // Aceita números de 12 a 15 dígitos (incluindo o prefixo do país)
  return /^\d{12,15}$/.test(num)
}

async function sendWhatsAppMessage(number, text) {
  const baseUrl = EVOLUTION_API_URL.replace(/\/$/, '')
  const encodedInstance = encodeURIComponent(INSTANCE_NAME)
  const url = `${baseUrl}/message/sendText/${encodedInstance}`

  console.log(`[LOG] Enviando mensagem para ${number}...`)
  
  try {
    const response = await axios.post(
      url,
      { 
        number: number.includes('@') ? number : `${number}@s.whatsapp.net`, 
        text 
      },
      {
        headers: {
          apikey: EVOLUTION_API_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    )
    return response.data
  } catch (err) {
    console.error(`[ERROR] Falha ao enviar para ${number}:`, {
      status: err.response?.status,
      data: err.response?.data,
      message: err.message
    })
    throw err
  }
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
