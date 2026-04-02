import { useState } from "react";

export default function EditTransactionModal({ transaction, onClose, onSave }) {
  const [formData, setFormData] = useState({
    type: transaction.type,
    amount: transaction.amount,
    category: transaction.category,
    notes: transaction.notes || "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(transaction._id, formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full text-black">
        <h2 className="text-lg font-bold mb-4">Edit Transaction</h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-sm mb-1">Type</label>
            <select name="type" value={formData.type} onChange={handleChange} className="w-full border p-2 rounded">
              <option value="expense">Expense</option>
              <option value="income">Income</option>
              <option value="profit">Profit</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Amount (₹)</label>
            <input type="number" name="amount" value={formData.amount} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>

          <div>
            <label className="block text-sm mb-1">Category</label>
            <input type="text" name="category" value={formData.category} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>

          <div>
            <label className="block text-sm mb-1">Notes</label>
            <input type="text" name="notes" value={formData.notes} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
