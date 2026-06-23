import React, { useState } from "react";
import { BankAccount, AccountType } from "../types";
import { 
  CreditCard, 
  Trash2, 
  RefreshCw, 
  Plus, 
  X, 
  CheckCircle2, 
  Wifi, 
  ShieldAlert, 
  TrendingUp, 
  Info 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface BankConnectionsProps {
  accounts: BankAccount[];
  isSyncing: boolean;
  onConnect: (details: { institution: string; name: string; accountType: AccountType; initialBalance: number }) => void;
  onDisconnect: (id: string) => void;
  onSyncCheck: () => void;
}

export default function BankConnections({
  accounts,
  isSyncing,
  onConnect,
  onDisconnect,
  onSyncCheck,
}: BankConnectionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [institution, setInstitution] = useState("Chase Bank");
  const [name, setName] = useState("Total Savings Joint");
  const [accountType, setAccountType] = useState<AccountType>("checking");
  const [initialBalance, setInitialBalance] = useState("5000");
  const [showPlaidGuide, setShowPlaidGuide] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConnect({
      institution,
      name,
      accountType,
      initialBalance: parseFloat(initialBalance) || 0,
    });
    setIsOpen(false);
    // Reset forms
    setName("");
  };

  const getCardStyle = (institution: string) => {
    switch (institution.toLowerCase()) {
      case "chase bank":
        return "from-blue-600 to-indigo-800 text-white border-blue-400/20";
      case "bank of america":
        return "from-red-600 to-rose-800 text-white border-rose-400/20";
      case "wells fargo":
        return "from-amber-500 to-orange-700 text-white border-amber-400/20";
      default:
        return "from-zinc-800 to-zinc-950 text-white border-zinc-700/50";
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm flex flex-col h-full" id="bank-connections-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            Linked Accounts
          </h2>
          <p className="text-xs text-zinc-500">Real-time balances synched from live streams</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onSyncCheck}
            disabled={isSyncing}
            className={`p-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 transition-all text-zinc-600 ${
              isSyncing ? "animate-spin cursor-not-allowed opacity-50" : ""
            }`}
            title="Sync all now"
            id="sync-now-button"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200"
            id="link-account-button"
          >
            <Plus className="w-3.5 h-3.5" />
            Link Bank
          </button>
        </div>
      </div>

      {/* Account List */}
      <div className="flex-1 space-y-4 overflow-y-auto max-h-[360px] pr-1">
        {accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-zinc-100 rounded-xl bg-zinc-50/50">
            <CreditCard className="w-10 h-10 text-zinc-300 stroke-[1.5] mb-3" />
            <p className="text-sm font-medium text-zinc-600">No bank accounts linked</p>
            <p className="text-xs text-zinc-400 max-w-[200px] mt-1">Connect your first bank account to stream transaction activity</p>
          </div>
        ) : (
          accounts.map((acct) => (
            <div
              key={acct.id}
              className={`p-5 rounded-2xl border bg-gradient-to-r ${getCardStyle(
                acct.institution
              )} shadow-md relative overflow-hidden transition-all duration-300 hover:shadow-lg`}
              id={`bank-account-card-${acct.id}`}
            >
              {/* Background Glow effects */}
              <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -left-12 -bottom-12 w-28 h-28 bg-black/10 rounded-full blur-xl pointer-events-none" />

              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full font-medium">
                    {acct.accountType === "credit_card" ? "Credit Card" : acct.accountType}
                  </span>
                  <h3 className="font-bold text-base mt-2 tracking-wide leading-tight">{acct.institution}</h3>
                  <p className="text-xs text-white/80 font-mono tracking-wider">{acct.name}</p>
                </div>
                <button
                  onClick={() => onDisconnect(acct.id)}
                  className="p-1 px-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                  title="Remove account connection"
                  id={`disconnect-btn-${acct.id}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mt-6 flex justify-between items-end">
                <div>
                  <p className="text-[10px] text-white/70 uppercase">Current Balance</p>
                  <p className="text-2xl font-bold font-sans tracking-tight">
                    ${acct.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1 bg-white/15 backdrop-blur-md px-2 py-0.5 rounded-full text-[10.5px]">
                    <span className={`w-1.5 h-1.5 rounded-full ${acct.status === 'syncing' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-ping'}`} />
                    <span className="font-medium capitalize text-white/95">{acct.status}</span>
                  </div>
                  <span className="text-[9px] text-white/60 italic">
                    Synced {new Date(acct.lastSynced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Mini Plaid Integration Information Box */}
      <div className="mt-4 pt-3 border-t border-zinc-100 flex items-start gap-2 bg-indigo-50/50 p-2.5 rounded-xl">
        <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-[11px] font-medium text-indigo-950">Active Open-Banking Simulator</p>
          <p className="text-[10px] text-indigo-600/90 leading-tight">
            Runs fully operational on client/server SSE streams. Want to bind your real Plaid token credentials?{" "}
            <button 
              onClick={() => setShowPlaidGuide(!showPlaidGuide)} 
              className="underline hover:text-indigo-805 font-semibold scroll-smooth inline"
              id="plaid-toggle-guide"
            >
              {showPlaidGuide ? "Hide config details" : "Learn how"}
            </button>
          </p>
        </div>
      </div>

      <AnimatePresence>
        {showPlaidGuide && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-3 text-[11px] text-zinc-600 border border-indigo-100 p-3 rounded-xl bg-indigo-50/20 space-y-1.5"
            id="plaid-guide-popover"
          >
            <p className="font-semibold text-zinc-800">🔌 Integrating Real Plaid Link SDK:</p>
            <p>1. Open your secrets block and add your keys to your <code className="bg-zinc-100 px-1 py-0.2 rounded font-mono text-xs">.env</code>:</p>
            <pre className="p-1.5 bg-zinc-950 text-emerald-400 rounded-lg text-[9.5px] font-mono leading-tight">
{`PLAID_CLIENT_ID="your_client_id"
PLAID_SECRET="your_secret_sandbox_key"
PLAID_ENV="sandbox"`}
            </pre>
            <p>2. The application backend automatically detects Plaid credentials and loads raw institution tokens bypassing simulated bank endpoints!</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connect Bank Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-fade-in" id="add-bank-modal">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-zinc-100"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-zinc-950">Connect Financial Account</h3>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                  id="close-bank-modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase mb-1">Financial Institution</label>
                  <select
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white text-zinc-900"
                    value={institution}
                    onChange={(e) => {
                      setInstitution(e.target.value);
                      if (e.target.value === "Chase Bank") setName("Total Checking");
                      else if (e.target.value === "Bank of America") setName("Cash Rewards Credit");
                      else if (e.target.value === "Wells Fargo") setName("Way2Save Savings");
                    }}
                    id="institution-select"
                  >
                    <option value="Chase Bank">Chase Bank</option>
                    <option value="Bank of America">Bank of America</option>
                    <option value="Wells Fargo">Wells Fargo</option>
                    <option value="Fidelity Investments">Fidelity Investments</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase mb-1">Custom Account Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Premium Reward Credit Card"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-zinc-900"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    id="account-name-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 uppercase mb-1">Account Type</label>
                    <select
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white text-zinc-900"
                      value={accountType}
                      onChange={(e) => setAccountType(e.target.value as AccountType)}
                      id="account-type-select"
                    >
                      <option value="checking">Checking</option>
                      <option value="savings">Savings</option>
                      <option value="credit_card">Credit Card</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 uppercase mb-1">Starting Balance ($)</label>
                    <input
                      type="number"
                      required
                      placeholder="5000"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-zinc-900"
                      value={initialBalance}
                      onChange={(e) => setInitialBalance(e.target.value)}
                      id="initial-balance-input"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 font-semibold transition-colors text-zinc-700 cursor-pointer text-center"
                    id="cancel-add-bank-btn"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all shadow-md shadow-indigo-150 cursor-pointer text-center"
                    id="submit-add-bank-btn"
                  >
                    Link Secure Account
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
