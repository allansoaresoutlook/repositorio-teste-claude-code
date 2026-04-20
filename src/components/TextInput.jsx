import { useMemo } from 'react'

export default function TextInput({ onNumbersLoaded }) {
  function handleTextChange(e) {
    const text = e.target.value

    const raw = text
      .split(/[\n,\s]+/)
      .map((num) => num.trim())
      .filter((num) => num.length > 0)

    const seen = new Set()
    const unique = raw.filter((num) => {
      if (seen.has(num)) return false
      seen.add(num)
      return true
    })

    onNumbersLoaded(unique)
  }

  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Números <span className="text-red-500">*</span>
      </label>
      <p className="text-xs text-gray-500 mb-2">
        Um por linha, ou separados por vírgula/espaço
      </p>
      <textarea
        className="w-full border border-gray-300 rounded-lg p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
        rows={8}
        placeholder="558591241426&#10;5511987654321&#10;5521999999999&#10;&#10;Ou: 558591241426, 5511987654321, 5521999999999"
        onChange={handleTextChange}
      />
      <p className="text-xs text-gray-400 mt-1">
        Aceita: um por linha, separados por vírgula ou espaço
      </p>
    </div>
  )
}
