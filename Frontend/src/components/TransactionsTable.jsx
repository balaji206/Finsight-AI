export default function TransactionsTable({ transactions, onEdit, onDelete }) {
  if (!transactions || transactions.length === 0) {
    return <div className="text-gray-500 py-4">No transactions recorded yet.</div>;
  }

  return (
    <div className="overflow-x-auto border border-gray-300 rounded bg-white text-black">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-100 border-b border-gray-300">
            <th className="p-3 text-sm font-semibold">Date</th>
            <th className="p-3 text-sm font-semibold">Type</th>
            <th className="p-3 text-sm font-semibold">Category</th>
            <th className="p-3 text-sm font-semibold">Amount</th>
            <th className="p-3 text-sm font-semibold">Notes & SDGs</th>
            <th className="p-3 text-sm font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t._id} className="border-b border-gray-200 hover:bg-gray-50">
              <td className="p-3 text-sm">{new Date(t.created_at).toLocaleDateString()}</td>
              <td className="p-3 text-sm capitalize">{t.type}</td>
              <td className="p-3 text-sm">{t.category}</td>
              <td className="p-3 text-sm font-medium">
                {t.type === 'expense' ? '-' : '+'}₹{t.amount}
              </td>
              <td className="p-3 text-sm">
                <div>{t.notes}</div>
                {t.sdg_tags && t.sdg_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {t.sdg_tags.map(tag => (
                      <span key={tag} className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </td>
              <td className="p-3 text-sm text-right">
                <button onClick={() => onEdit(t)} className="text-blue-600 hover:underline mr-3">Edit</button>
                <button onClick={() => onDelete(t._id)} className="text-red-600 hover:underline">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
