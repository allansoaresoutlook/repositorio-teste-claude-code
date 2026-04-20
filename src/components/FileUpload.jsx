import { useRef } from 'react'
import * as XLSX from 'xlsx'

export default function FileUpload({ onNumbersLoaded, fileName, setFileName }) {
  const inputRef = useRef(null)

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return

    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 })

      const numbers = []
      const seen = new Set()

      for (const row of rows) {
        const cell = row[0]
        if (cell === undefined || cell === null || String(cell).trim() === '') continue
        const val = String(cell).trim()
        if (!seen.has(val)) {
          seen.add(val)
          numbers.push(val)
        }
      }

      onNumbersLoaded(numbers)
    }
    reader.readAsArrayBuffer(file)
  }

  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Planilha Excel (.xlsx)
      </label>
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
        onClick={() => inputRef.current.click()}
      >
        {fileName ? (
          <div className="text-green-600 font-medium">
            <span className="text-2xl">✓</span>
            <p className="mt-1">{fileName}</p>
          </div>
        ) : (
          <div className="text-gray-400">
            <svg className="mx-auto h-10 w-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">Clique para selecionar um arquivo .xlsx</p>
            <p className="text-xs mt-1">Números na primeira coluna (A)</p>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  )
}
