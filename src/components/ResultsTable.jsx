export default function ResultsTable({ results }) {
  if (!results) return null

  const { success, failed, details } = results

  return (
    <div className="mt-6">
      <div className="flex gap-4 mb-4">
        <div className="flex-1 bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{success}</p>
          <p className="text-sm text-green-700">Enviadas com sucesso</p>
        </div>
        <div className="flex-1 bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{failed}</p>
          <p className="text-sm text-red-700">Falharam</p>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-3 font-medium">
        {success} mensagens enviadas com sucesso, {failed} falharam.
      </p>

      <div className="overflow-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2 font-semibold text-gray-600">Número</th>
              <th className="text-left px-4 py-2 font-semibold text-gray-600">Status</th>
              <th className="text-left px-4 py-2 font-semibold text-gray-600">Detalhe</th>
            </tr>
          </thead>
          <tbody>
            {details.map((row, i) => (
              <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-2 font-mono text-gray-700">{row.number}</td>
                <td className="px-4 py-2">
                  {row.status === 'success' ? (
                    <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                      Sucesso
                    </span>
                  ) : (
                    <span className="inline-block bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                      Erro
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-gray-500 text-xs">{row.message || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
