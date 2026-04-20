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

async function checkWhatsAppNumber(number) {
  const baseUrl = EVOLUTION_API_URL.replace(/\/$/, '')
  const encodedInstance = encodeURIComponent(INSTANCE_NAME)
  const url = `${baseUrl}/chat/whatsappNumbers/${encodedInstance}`

  try {
    const response = await axios.post(
      url,
      { numbers: [number] },
      {
        headers: {
          apikey: EVOLUTION_API_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    )
    const result = response.data[0]
    return result && result.exists ? result.jid : null
  } catch (err) {
    console.error(`[ERROR] Falha ao verificar número ${number}:`, err.response?.data || err.message)
    // Se a checagem falhar por instabilidade, tentaremos mandar o próprio número como fallback
    return `${number}@s.whatsapp.net`
  }
}

async function sendWhatsAppMessage(jid, text, originalNumber) {
  const baseUrl = EVOLUTION_API_URL.replace(/\/$/, '')
  const encodedInstance = encodeURIComponent(INSTANCE_NAME)
  const url = `${baseUrl}/message/sendText/${encodedInstance}`

  const payload = { number: jid, text }

  console.log(`\n[LOG] ========================================`)
  console.log(`[LOG] Preparando envio para: ${originalNumber} (JID final: ${jid.replace('@s.whatsapp.net','')})`)
  
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
    console.log(`[LOG] SUCESSO! Mensagem processada na rede.`)
    console.log(`[LOG] ========================================\n`)
    return response.data
  } catch (err) {
    const status = err.response?.status
    const errorData = err.response?.data
    console.error(`\n[ERROR] ======================================`)
    console.error(`[ERROR] Falha ao enviar para ${originalNumber}`)
    console.error(`[ERROR] HTTP Status: ${status}`)
    console.error(`[ERROR] Message:`, err.message)
    console.error(`[ERROR] ======================================\n`)
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
      details.push({ number: String(raw), status: 'error', message: 'Número inválido (12-15 dígitos necessários).' })
      continue
    }

    try {
      // Passo 1: Checa/Valida na Evolution API (Resolve o Mito do Nono Digito BR)
      const jid = await checkWhatsAppNumber(clean)
      
      if (!jid) {
         details.push({ number: String(raw), status: 'error', message: 'WhatsApp não registrado para este número' })
         continue
      }

      // Passo 2: Envia usando a id formatada correta 
      await sendWhatsAppMessage(jid, message.trim(), clean)
      details.push({ number: String(raw), status: 'success' })
      
    } catch (err) {
      let errMsg = 'Erro desconhecido'
      const resData = err.response?.data
      
      if (resData) {
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

      details.push({ number: String(raw), status: 'error', message: errMsg })
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

