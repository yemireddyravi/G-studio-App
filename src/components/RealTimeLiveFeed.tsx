import React, { useState, useEffect } from "react";
import { BankAccount } from "../types";
import { 
  Wifi, 
  WifiOff, 
  Play, 
  Terminal, 
  ShieldCheck, 
  Zap, 
  AlertCircle,
  HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface RealTimeLiveFeedProps {
  accounts: BankAccount[];
  sseStatus: "connected" | "connecting" | "disconnected";
  onSwipeCharge: (details: { accountId: string; description: string; amount: number; category: string }) => Promise<void>;
  localLogs: string[];
}

export default function RealTimeLiveFeed({
  accounts,
  sseStatus,
  onSwipeCharge,
  localLogs,
}: RealTimeLiveFeedProps) {
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [description, setDescription] = useState("Starbucks Coffee");
  const [amount, setAmount] = useState("4.75");
  const [category, setCategory] = useState("Restaurants");
  const [isSwiping, setIsSwiping] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  // Sync selectedAccountId to first account if empty
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  const handleChargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId) return;
    
    setIsSwiping(true);
    setFeedbackMsg("");
    
    try {
      const numAmt = -Math.abs(parseFloat(amount) || 5.00);
      await onSwipeCharge({
        accountId: selectedAccountId,
        description,
        amount: numAmt,
        category,
      });
      
      setFeedbackMsg("Contactless swipe approved! Streaming live transaction...");
      setTimeout(() => setFeedbackMsg(""), 3500);
    } catch (err) {
      setFeedbackMsg("Failed to stream POS transaction.");
    } finally {
      setIsSwiping(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm flex flex-col h-full" id="live-feed-canvas">
      {/* Stream Status header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-bold text-zinc-900 tracking-wider uppercase">Open-Banking Stream</h2>
          <p className="text-[11px] text-zinc-400">Live SSE stream client tracker</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-50 border border-zinc-150 rounded-xl">
          <span className={`w-2 h-2 rounded-full ${
            sseStatus === "connected" ? "bg-emerald-505 bg-emerald-500 animate-pulse" : 
            sseStatus === "connecting" ? "bg-amber-400 animate-ping" : 
            "bg-rose-500"
          }`} />
          <span className="text-[10px] font-bold uppercase text-zinc-600">
            {sseStatus === "connected" ? "Live Connected" : sseStatus === "connecting" ? "Linking Channel" : "Offline"}
          </span>
        </div>
      </div>

      {/* Simulator POS trigger card */}
      <div className="bg-zinc-900 text-zinc-200 rounded-2xl p-5 border border-zinc-800 shadow-md mb-5" id="simulator-terminal">
        <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold mb-3">
          <Terminal className="w-4 h-4" />
          <span>Interactive Credit Card Swipe Simulator</span>
        </div>

        {accounts.length === 0 ? (
          <div className="py-6 text-center text-zinc-500 text-xs text-zinc-400">
            <AlertCircle className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            Link a bank account first to swipe/test real-time notifications.
          </div>
        ) : (
          <form onSubmit={handleChargeSubmit} className="space-y-3.5 text-xs">
            {/* Choose account */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Select card swipe source</label>
              <select
                className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 font-medium outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer text-xs"
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                id="swipe-account-select"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.institution} - {a.name} (${a.balance.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            {/* Merchant detail and Amount */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Merchant / POS Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Whole Foods"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 font-mono outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                  id="swipe-merchant-input"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="4.75"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 font-mono outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                  id="swipe-amount-input"
                />
              </div>
            </div>

            {/* Category selection */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Budget categorization</label>
              <select
                className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 font-medium outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer text-xs"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                id="swipe-category-select"
              >
                <option value="Groceries">Groceries</option>
                <option value="Restaurants">Restaurants</option>
                <option value="Utilities">Utilities</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Shopping">Shopping</option>
                <option value="Travel">Travel</option>
                <option value="Uncategorized">Uncategorized</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSwiping || sseStatus !== "connected"}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 font-bold tracking-wide text-zinc-950 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-900/30 cursor-pointer text-xs uppercase"
              id="execute-swipe-btn"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              {isSwiping ? "Encrypting transaction..." : "Tap Contactless Card Swipe"}
            </button>

            <AnimatePresence>
              {feedbackMsg && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="p-2 rounded bg-indigo-950 border border-indigo-805/50 text-[11px] text-indigo-305 flex items-center gap-1"
                  id="simulator-feedback-banner"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>{feedbackMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        )}
      </div>

      {/* SSE logs stream dashboard console block */}
      <div className="flex-1 flex flex-col min-h-[160px] max-h-[196px]">
        <span className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5 tracking-wider">Sync Log Telemetry</span>
        <div className="flex-1 bg-zinc-950 border border-zinc-900 rounded-2xl p-4 font-mono text-[10px] leading-relaxed text-zinc-400 overflow-y-auto block select-text">
          {localLogs.length === 0 ? (
            <p className="text-zinc-650 italic">Idle. Initializing network listeners...</p>
          ) : (
            localLogs.map((log, index) => {
              let logCol = "text-zinc-500";
              if (log.includes("[SSE SUCCESS]") || log.includes("[NEW TX CLEAR]")) {
                logCol = "text-emerald-400 font-semibold";
              } else if (log.includes("[SYNCING INITIALIZED]")) {
                logCol = "text-amber-400";
              } else if (log.includes("[DISCONNECT]")) {
                logCol = "text-red-400";
              } else if (log.includes("[SSE HELLO]")) {
                logCol = "text-indigo-400";
              }
              return (
                <div key={index} className={`border-b border-zinc-900/40 pb-1 mb-1 last:border-0 ${logCol}`}>
                  {log}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
