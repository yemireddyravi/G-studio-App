import React, { useState } from "react";
import { Transaction } from "../types";
import { 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight, 
  ChevronDown, 
  Calendar,
  Wifi,
  Sparkles,
  RefreshCcw,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface TransactionListProps {
  transactions: Transaction[];
}

export default function TransactionList({ transactions }: TransactionListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [visibleCount, setVisibleCount] = useState(10);

  // Extract unique categories for filtering
  const categories = ["all", ...new Set(transactions.map((t) => t.category))];

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = 
      tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.bankName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || tx.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const displayedTransactions = filteredTransactions.slice(0, visibleCount);

  const formatAmount = (amt: number) => {
    const abs = Math.abs(amt).toLocaleString("en-US", { minimumFractionDigits: 2 });
    return amt > 0 ? `+$${abs}` : `-$${abs}`;
  };

  const getCategoryColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case "groceries": return "bg-emerald-50 text-emerald-700 border-emerald-200/50";
      case "restaurants": return "bg-rose-50 text-rose-700 border-rose-200/50";
      case "utilities": return "bg-sky-50 text-sky-700 border-sky-200/50";
      case "entertainment": return "bg-indigo-50 text-indigo-700 border-indigo-200/50";
      case "shopping": return "bg-pink-50 text-pink-700 border-pink-200/50";
      case "travel": return "bg-violet-50 text-violet-700 border-violet-200/50";
      case "income": return "bg-teal-50 text-teal-700 border-teal-200/50";
      default: return "bg-zinc-100 text-zinc-700 border-zinc-200/50";
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm flex flex-col h-full" id="transactions-log-canvas">
      {/* Search and filter controller bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950 tracking-tight flex items-center gap-2">
            <Wifi className="w-5 h-5 text-indigo-500 animate-pulse" />
            Live Transaction Stream
          </h2>
          <p className="text-xs text-zinc-500">Live monitoring of linked card swipe networks</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search merchants..."
              className="pl-8.5 pr-3 py-1.5 text-xs rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 w-[180px] bg-zinc-50/50 text-zinc-800"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              id="search-transactions-input"
            />
          </div>

          {/* Category Filter selector */}
          <div className="flex items-center gap-1 border border-zinc-200 bg-white rounded-xl px-2.5 py-1.5">
            <Filter className="w-3 h-3 text-zinc-400" />
            <select
              className="text-xs font-semibold bg-transparent border-none outline-none focus:ring-0 pr-1 text-zinc-600 capitalize cursor-pointer"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              id="category-filter-select"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "all" ? "All Categories" : cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid Table */}
      <div className="flex-1 overflow-x-auto">
        {displayedTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle2 className="w-10 h-10 text-zinc-200 mb-3" />
            <p className="text-sm font-semibold text-zinc-700">No transactions located</p>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm">
              We couldn't locate any synced records matching your filter parameters. Link a bank or trigger simulated swipes to start streaming data.
            </p>
          </div>
        ) : (
          <div className="min-w-[600px]">
            <table className="w-full text-left border-collapse" id="transactions-data-table">
              <thead>
                <tr className="border-b border-zinc-100 text-[10.5px] uppercase font-bold text-zinc-400">
                  <th className="pb-3 width-[40%]">Merchant & Source</th>
                  <th className="pb-3 width-[20%]">Category</th>
                  <th className="pb-3 width-[20%]">Timestamp</th>
                  <th className="pb-3 width-[20%] text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {displayedTransactions.map((tx) => {
                    const isIncome = tx.amount > 0;
                    return (
                      <motion.tr
                        key={tx.id}
                        initial={tx.realTimeSync ? { backgroundColor: "rgba(99, 102, 241, 0.15)", opacity: 0.3 } : false}
                        animate={{ backgroundColor: "rgba(255, 255, 255, 0)", opacity: 1 }}
                        transition={{ duration: 1.8 }}
                        className="border-b border-zinc-150/50 hover:bg-zinc-50/70 text-sm align-middle group"
                        id={`tx-row-${tx.id}`}
                      >
                        {/* Title */}
                        <td className="py-3.5">
                          <div className="flex items-center gap-3">
                            <span className={`p-1.5 rounded-xl border ${
                              isIncome ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-zinc-50 border-zinc-100 text-zinc-600'
                            }`}
                            >
                              {isIncome ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                            </span>
                            <div>
                              <p className="font-semibold text-zinc-900 flex items-center gap-1.5 leading-snug">
                                {tx.description}
                                {tx.realTimeSync && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full animate-pulse uppercase tracking-wider">
                                    <Sparkles className="w-2 h-2 text-indigo-505" />
                                    Live Sync
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-zinc-400 font-medium">Source: <span className="font-semibold">{tx.bankName}</span></p>
                            </div>
                          </div>
                        </td>

                        {/* Category badge */}
                        <td className="py-3.5">
                          <span className={`px-2.5 py-1 text-[11px] font-medium rounded-full border ${getCategoryColor(tx.category)}`}>
                            {tx.category}
                          </span>
                        </td>

                        {/* Timestamp */}
                        <td className="py-3.5 text-xs text-zinc-500 font-medium">
                          <span className="flex items-center gap-1 font-mono">
                            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                            {new Date(tx.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className={`py-3.5 text-right font-bold text-sm tracking-tight font-mono ${isIncome ? 'text-emerald-600' : 'text-zinc-900'}`}>
                          {formatAmount(tx.amount)}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Load More buttons */}
      {filteredTransactions.length > visibleCount && (
        <div className="pt-4 text-center border-t border-zinc-100 mt-2">
          <button
            onClick={() => setVisibleCount((prev) => prev + 10)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-650 hover:text-indigo-650 hover:bg-zinc-50 px-4 py-2 border border-zinc-200 rounded-xl transition-all cursor-pointer"
            id="load-more-transactions-btn"
          >
            <ChevronDown className="w-4 h-4 text-zinc-400" />
            Show Older Transactions ({filteredTransactions.length - visibleCount} hidden)
          </button>
        </div>
      )}
    </div>
  );
}
