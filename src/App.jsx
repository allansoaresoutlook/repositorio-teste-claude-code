import { useState } from 'react'
import FileUpload from './components/FileUpload'
import TextInput from './components/TextInput'
import MessageInput from './components/MessageInput'
import ResultsTable from './components/ResultsTable'
import LoadingSpinner from './components/LoadingSpinner'

export default function App() {
  const [tab, setTab] = useState('excel')
  const [numbers, setNumbers] = useState([])
  const [fileName, setFileName] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')

  const canSend = numbers.length > 0 && message.trim().length > 0 && !loading

  function handleTabChange(newTab) {
    setTab(newTab)
    setNumbers([])
    setFileName('')
    setResults(null)
    setError('')
  }

  function handleReset() {
    setResults(null)
    setError('')
  }

  async function handleSend() {
    setLoading(true)
    setResults(null)
    setError('')

    try {
      const res = await fetch('/api/send-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numbers, message }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `HTTP ${res.status}`)
      }

      const data = await res.json()
      setResults(data)
    } catch (err) {
      setError(err.message || 'Erro ao conectar com o backend.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-start justify-center py-10 px-4">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-2xl p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Disparador de Mensagens</h1>
          <p className="text-sm text-gray-500 mt-1">Via Evolution API — WhatsApp</p>
        </div>

        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => handleTabChange('excel')}
            className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors ${
              tab === 'excel'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-800'
            }`}
          >
            📁 Upload Excel
          </button>
          <button
            onClick={() => handleTabChange('text')}
            className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors ${
              tab === 'text'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-800'
            }`}
          >
            ✏️ Digitar Números
          </button>
        </div>

        {tab === 'excel' && (
          <FileUpload
            onNumbersLoaded={setNumbers}
            fileName={fileName}
            setFileName={setFileName}
          />
        )}

        {tab === 'text' && (
          <TextInput onNumbersLoaded={setNumbers} />
        )}

        {numbers.length > 0 && (
          <p className="text-sm text-blue-600 -mt-4 mb-4 font-medium">
            {numbers.length} número(s) carregado(s)
          </p>
        )}

        <MessageInput value={message} onChange={setMessage} />

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
            {error}
          </div>
        )}

        {loading ? (
          <LoadingSpinner />
        ) : results ? (
          <button
            onClick={handleReset}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Enviar Novamente
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!canSend}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Enviar Mensagens
            {numbers.length > 0 && ` (${numbers.length})`}
          </button>
        )}

        <ResultsTable results={results} />
      </div>
    </div>
  )
}
