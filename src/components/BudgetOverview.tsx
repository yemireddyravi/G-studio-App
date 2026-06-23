import React, { useState } from "react";
import { BankAccount, Transaction, BudgetCategory } from "../types";
import { 
  Plus, 
  Settings, 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  AlertTriangle, 
  Sparkles,
  Edit2,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface BudgetOverviewProps {
  categories: BudgetCategory[];
  accounts: BankAccount[];
  transactions: Transaction[];
  onUpdateBudget: (categoryId: string, newLimit: number) => void;
}

export default function BudgetOverview({
  categories,
  accounts,
  transactions,
  onUpdateBudget,
}: BudgetOverviewProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLimit, setEditLimit] = useState("");

  // Analytical Calculations
  const totalCheckingSavings = accounts
    .filter((a) => a.accountType !== "credit_card")
    .reduce((sum, a) => sum + a.balance, 0);

  const totalCreditDebt = accounts
    .filter((a) => a.accountType === "credit_card")
    .reduce((sum, a) => sum + Math.abs(a.balance), 0);

  // Absolute Cash/Liquidity Net Worth
  const totalNetWorth = totalCheckingSavings - totalCreditDebt;

  // Monthly values based on current calendar month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const currentMonthTxs = transactions.filter((tx) => {
    const txDate = new Date(tx.date);
    return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
  });

  const monthlySpentTotal = currentMonthTxs
    .filter((tx) => tx.amount < 0 && tx.category !== "Income")
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const monthlyIncomeTotal = currentMonthTxs
    .filter((tx) => tx.amount > 0 || tx.category === "Income")
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Compute actual spent per category
  const categorySpentMap = categories.reduce((map, cat) => {
    const total = currentMonthTxs
      .filter((tx) => tx.category.toLowerCase() === cat.name.toLowerCase() && tx.amount < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    map[cat.id] = total;
    return map;
  }, {} as Record<string, number>);

  const totalBudgetLimit = categories.reduce((sum, cat) => sum + cat.limit, 0);

  // Toggle inline budgets edit
  const startEdit = (cat: BudgetCategory) => {
    setEditingId(cat.id);
    setEditLimit(cat.limit.toString());
  };

  const saveEdit = (id: string) => {
    const numLimit = parseFloat(editLimit);
    if (!isNaN(numLimit) && numLimit >= 0) {
      onUpdateBudget(id, numLimit);
    }
    setEditingId(null);
  };

  // Get color for progress state
  const getProgressStyles = (spent: number, limit: number) => {
    const percent = limit > 0 ? (spent / limit) * 100 : 0;
    if (percent >= 100) {
      return {
        bar: "bg-rose-500",
        bg: "bg-rose-50",
        text: "text-rose-600 font-bold",
        indicator: "🚨 OVER BUDGET",
        warningIcon: true,
      };
    } else if (percent >= 85) {
      return {
        bar: "bg-amber-500",
        bg: "bg-amber-50",
        text: "text-amber-600 font-semibold",
        indicator: "⚠️ 85% Warning",
        warningIcon: true,
      };
    } else {
      return {
        bar: "bg-indigo-600",
        bg: "bg-indigo-50",
        text: "text-zinc-600 font-medium",
        indicator: "✅ Solid Bounds",
        warningIcon: false,
      };
    }
  };

  return (
    <div className="space-y-6" id="budget-overview-canvas">
      {/* Top Aggregated Stat Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="stats-widget-grid">
        {/* Net Cash */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm relative overflow-hidden" id="net-worth-panel">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Net Assets</span>
            <span className="p-1 px-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-bold">SAVINGS</span>
          </div>
          <p className="text-2xl font-bold text-zinc-900 mt-2 tracking-tight">
            ${totalNetWorth.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600">
            <Coins className="w-3.5 h-3.5" />
            <span>Liquid: ${totalCheckingSavings.toFixed(2)}</span>
          </div>
        </div>

        {/* Expenses */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm relative overflow-hidden" id="expenses-panel">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Monthly Spending</span>
            <span className="p-1 px-1.5 rounded-lg bg-rose-50 text-rose-700 text-[10px] font-bold">EXPENSES</span>
          </div>
          <p className="text-2xl font-bold text-zinc-900 mt-2 tracking-tight">
            ${monthlySpentTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-rose-500">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Outflow of current month</span>
          </div>
        </div>

        {/* Income */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm relative overflow-hidden" id="income-panel">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Monthly Receipts</span>
            <span className="p-1 px-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold">INCOME</span>
          </div>
          <p className="text-2xl font-bold text-zinc-900 mt-2 tracking-tight">
            ${monthlyIncomeTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Inflow of current month</span>
          </div>
        </div>

        {/* Limit Aggregation */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm relative overflow-hidden" id="limits-panel">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Tracked Limits</span>
            <span className="p-1 px-1.5 rounded-lg bg-amber-50 text-amber-700 text-[10px] font-bold">CAPACITY</span>
          </div>
          <p className="text-2xl font-bold text-zinc-900 mt-2 tracking-tight">
            ${totalBudgetLimit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-indigo-600">
            <PiggyBank className="w-3.5 h-3.5" />
            <span>Spent {totalBudgetLimit > 0 ? ((monthlySpentTotal / totalBudgetLimit) * 100).toFixed(0) : 0}% of limits</span>
          </div>
        </div>
      </div>

      {/* Main Budget Progress Bars List */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm" id="categories-tracker-canvas">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-semibold text-zinc-900 tracking-tight">Monthly Category Budgets</h3>
            <p className="text-xs text-zinc-400">Click the edit button next to any category limit to adjust instantly</p>
          </div>
          <span className="text-[11.5px] font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-xl flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            Live sync updates progress
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="categories-progress-list">
          {categories.map((cat) => {
            const spent = categorySpentMap[cat.id] || 0;
            const isEditing = editingId === cat.id;
            const pr = getProgressStyles(spent, cat.limit);
            const percentage = cat.limit > 0 ? Math.min((spent / cat.limit) * 100, 100) : 0;

            return (
              <div
                key={cat.id}
                className="p-4 border border-zinc-50 rounded-xl bg-zinc-50/40 relative overflow-hidden transition-all duration-200 hover:border-zinc-200"
                id={`category-bar-${cat.id}`}
              >
                {/* Visual Indicators */}
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-zinc-100 text-zinc-700 font-medium font-mono text-[12px]">
                      {cat.name}
                    </span>
                    {pr.warningIcon && (
                      <AlertTriangle className={`w-4 h-4 ${spent >= cat.limit ? 'text-rose-500 animate-pulse' : 'text-amber-500'}`} />
                    )}
                  </div>
                  
                  {/* Action inline edit trigger */}
                  <div className="flex items-center gap-1.5">
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-zinc-400 font-semibold">$</span>
                        <input
                          type="number"
                          className="w-16 px-1 py-0.5 border border-zinc-300 rounded font-mono text-xs focus:ring-1 focus:ring-indigo-505 outline-none text-zinc-900 bg-white"
                          value={editLimit}
                          onChange={(e) => setEditLimit(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(cat.id);
                          }}
                          id={`limit-edit-input-${cat.id}`}
                          autoFocus
                        />
                        <button
                          onClick={() => saveEdit(cat.id)}
                          className="p-0.5 rounded bg-indigo-150 hover:bg-emerald-100 text-emerald-700 transition-colors"
                          id={`save-limit-btn-${cat.id}`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-zinc-400 font-semibold font-mono">
                          Limit: ${cat.limit}
                        </span>
                        <button
                          onClick={() => startEdit(cat)}
                          className="p-1 ml-1 text-zinc-400 hover:text-indigo-600 rounded transition-colors"
                          id={`edit-limit-btn-${cat.id}`}
                          title="Click to adjust limit"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Meter Details */}
                <div className="flex justify-between text-xs text-zinc-500 mb-2">
                  <span>Spent: <strong className="text-zinc-800">${spent.toFixed(2)}</strong></span>
                  <span className={`text-[11px] uppercase font-mono ${pr.text}`}>
                    {percentage.toFixed(0)}% ({pr.indicator})
                  </span>
                </div>

                {/* Progress Visual Tracker */}
                <div className="h-2.5 w-full bg-zinc-200/60 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ type: "spring", stiffness: 60, damping: 15 }}
                    className={`h-full ${pr.bar} rounded-full`}
                  />
                </div>

                {/* Danger warn notification text */}
                {spent >= cat.limit && (
                  <p className="text-[10px] text-rose-500 font-medium mt-1.5 flex items-center gap-1 animate-pulse">
                    Over budget limits by ${(spent - cat.limit).toFixed(2)}! Consider cutting back immediately.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
