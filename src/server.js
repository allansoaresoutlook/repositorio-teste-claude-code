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

  const payload = { 
    number: number.includes('@') ? number : `${number}@s.whatsapp.net`, 
    text 
  }

  console.log(`\n[LOG] ========================================`)
  console.log(`[LOG] Preparando envio para: ${number}`)
  console.log(`[LOG] Evolution API URL: ${url}`)
  console.log(`[LOG] Headers: apikey = ${EVOLUTION_API_KEY ? '****' + EVOLUTION_API_KEY.slice(-4) : 'MISSING'}`)
  console.log(`[LOG] Body (Payload) enviado:`, JSON.stringify(payload))
  
  try {
    const response = await axios.post(
      url,
      payload,
      {
        headers: {
          apikey: EVOLUTION_API_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    )
    console.log(`[LOG] Resposta da Evolution API [SUCESSO]:`, JSON.stringify(response.data))
    console.log(`[LOG] ========================================\n`)
    return response.data
  } catch (err) {
    const status = err.response?.status
    const errorData = err.response?.data
    console.error(`\n[ERROR] ======================================`)
    console.error(`[ERROR] Falha ao enviar para ${number}`)
    console.error(`[ERROR] HTTP Status: ${status}`)
    console.error(`[ERROR] Response Data:`, JSON.stringify(errorData))
    console.error(`[ERROR] Message:`, err.message)
    console.error(`[ERROR] ======================================\n`)
    // throw error to be handled by original function
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
      let errMsg = 'Erro desconhecido'
      const resData = err.response?.data
      
      if (resData) {
        // A Evolution API envia { exists: false } se o número não tiver WhatsApp
        if (resData.response && Array.isArray(resData.response.message) && resData.response.message[0]?.exists === false) {
           errMsg = "WhatsApp não registrado para este número"
        } else if (typeof resData.message === 'string') {
           errMsg = resData.message
        } else if (resData.error) {
           errMsg = resData.error
        }
      } else {
        errMsg = err.message
      }

      details.push({ number: clean, status: 'error', message: errMsg })
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
