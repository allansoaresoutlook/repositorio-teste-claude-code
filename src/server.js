require('dotenv').config()
const express = require('express')
const cors = require('cors')
const axios = require('axios')

const app = express()
const PORT = process.env.BACKEND_PORT || 3001

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY
const INSTANCE_NAME = process.env.INSTANCE_NAME
const DELAY_MIN = parseInt(process.env.DELAY_MIN) || 5000
const DELAY_MAX = parseInt(process.env.DELAY_MAX) || 15000

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

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

async function processQueue(numbers, message) {
  console.log(`[LOG] Iniciando processamento de fila para ${numbers.length} números em segundo plano...`)
  
  for (let i = 0; i < numbers.length; i++) {
    const raw = numbers[i]
    const clean = sanitizeNumber(raw)
    
    console.log(`[LOG] [${i + 1}/${numbers.length}] Processando: ${raw}`)

    if (!isValidNumber(clean)) {
      console.error(`[LOG] [${i + 1}/${numbers.length}] Ignorado: Número inválido.`)
      continue
    }

    try {
      const jid = await checkWhatsAppNumber(clean)
      
      if (!jid) {
         console.error(`[LOG] [${i + 1}/${numbers.length}] Erro: WhatsApp não registrado.`)
         continue
      }

      await sendWhatsAppMessage(jid, message.trim(), clean)
      
      // Se não for o último número, aguarda o delay
      if (i < numbers.length - 1) {
        const waitTime = Math.floor(Math.random() * (DELAY_MAX - DELAY_MIN + 1)) + DELAY_MIN
        console.log(`[LOG] Aguardando ${waitTime/1000} segundos antes do próximo envio...`)
        await sleep(waitTime)
      }
      
    } catch (err) {
      console.error(`[LOG] [${i + 1}/${numbers.length}] Erro no processamento:`, err.message)
    }
  }
  
  console.log(`[LOG] Processamento de fila finalizado!`)
}

app.post('/api/send-messages', async (req, res) => {
  const { numbers, message } = req.body

  if (!Array.isArray(numbers) || numbers.length === 0) {
    return res.status(400).json({ error: 'Lista de números inválida ou vazia.' })
  }
  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: 'Mensagem é obrigatória.' })
  }

  // Inicia o processamento no "background" (não usa await aqui)
  processQueue(numbers, message).catch(err => {
    console.error('[CRITICAL] Erro na fila de segundo plano:', err)
  })

  // Responde imediatamente ao cliente
  res.json({ 
    status: 'accepted', 
    message: `Envio de ${numbers.length} mensagens iniciado em segundo plano.`,
    estimatedTimeMinutes: Math.round((numbers.length * ((DELAY_MIN + DELAY_MAX) / 2)) / 60000)
  })
})

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', instance: INSTANCE_NAME })
})

app.listen(PORT, () => {
  console.log(`Backend rodando em http://localhost:${PORT}`)
  console.log(`Instance: ${INSTANCE_NAME}`)
})

