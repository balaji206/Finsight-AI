import { useState, useEffect } from "react";
import axios from "axios";
import NaturalLanguageInput from "../components/NaturalLanguageInput";
import TransactionsTable from "../components/TransactionsTable";
import WeeklySummaryCard from "../components/WeeklySummaryCard";
import EditTransactionModal from "../components/EditTransactionModal";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function LedgerPage() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingTx, setEditingTx] = useState(null);

  const fetchTransactions = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/ledger/transactions`);
      if (res.data.success) {
        setTransactions(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch transactions", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/ledger/weekly-summary`);
      if (res.data.success) {
        setSummary(res.data.summary);
      }
    } catch (err) {
      console.error("Failed to fetch weekly summary", err);
    }
  };

  const loadData = () => {
    fetchTransactions();
    fetchSummary();
  }

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  const handleLogTransaction = async (input) => {
    try {
      await axios.post(`${API_URL}/api/ledger/log`, { raw_input: input });
      // Fetch data again instead of using WebSockets
      loadData();
    } catch (err) {
      alert("Error logging transaction.");
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await axios.delete(`${API_URL}/api/ledger/transactions/${id}`);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveEdit = async (id, updates) => {
    try {
      await axios.put(`${API_URL}/api/ledger/transactions/${id}`, updates);
      setEditingTx(null);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 bg-gray-50 min-h-screen text-black">
      <h1 className="text-2xl font-bold mb-4 text-blue-900">Conversational Ledger (MongoDB Offline Mode)</h1>
      <p className="mb-6 text-gray-600">
        Simply type your daily expenses or profits. Since no keys are provided, it is using local fast regex matching!
      </p>

      <WeeklySummaryCard summary={summary} />
      
      <NaturalLanguageInput onLog={handleLogTransaction} />

      {loading ? (
        <div className="text-gray-500 py-4">Loading...</div>
      ) : (
        <TransactionsTable 
          transactions={transactions} 
          onEdit={setEditingTx} 
          onDelete={handleDelete} 
        />
      )}

      {editingTx && (
        <EditTransactionModal 
          transaction={editingTx} 
          onClose={() => setEditingTx(null)} 
          onSave={handleSaveEdit} 
        />
      )}
    </div>
  );
}
