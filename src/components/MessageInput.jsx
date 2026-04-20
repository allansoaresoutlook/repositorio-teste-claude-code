export default function MessageInput({ value, onChange }) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Mensagem <span className="text-red-500">*</span>
      </label>
      <textarea
        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
        rows={5}
        placeholder="Digite a mensagem que será enviada para todos os números..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <p className="text-xs text-gray-400 mt-1">{value.length} caractere(s)</p>
    </div>
  )
}
