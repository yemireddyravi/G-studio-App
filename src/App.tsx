import { useState, useEffect } from "react";
import { BankAccount, Transaction, BudgetCategory } from "./types";
import BankConnections from "./components/BankConnections";
import BudgetOverview from "./components/BudgetOverview";
import TransactionList from "./components/TransactionList";
import RealTimeLiveFeed from "./components/RealTimeLiveFeed";
import { 
  Building2, 
  Activity, 
  Sparkles, 
  ShieldCheck, 
  HelpCircle,
  PiggyBank
} from "lucide-react";

export default function App() {
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [sseStatus, setSseStatus] = useState<"connected" | "connecting" | "disconnected">("connecting");
  const [localLogs, setLocalLogs] = useState<string[]>([]);

  // Telemetry log list helper
  const addLog = (message: string) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLocalLogs((prev) => [`[${timeStr}] ${message}`, ...prev].slice(0, 30));
  };

  // 1. Initial Dashboard Data hydration
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await fetch("/api/dashboard");
        if (!response.ok) throw new Error("HTTP connection degraded");
        const data = await response.json();
        
        setCategories(data.categories || []);
        setAccounts(data.accounts || []);
        setTransactions(data.transactions || []);
        addLog(`[SYSTEM CHECK] Budget core loaded. Found ${data.accounts?.length || 0} cards, ${data.transactions?.length || 0} clear records.`);
      } catch (err) {
        addLog(`[CRITICAL] Server integration failed. Check backend configuration.`);
      }
    };

    fetchInitialData();
  }, []);

  // 2. Open EventSource Real-Time stream pipeline
  useEffect(() => {
    let eventSource: EventSource | null = null;

    const establishSSE = () => {
      setSseStatus("connecting");
      
      // Establish SSE relative stream link
      eventSource = new EventSource("/api/events");

      eventSource.onopen = () => {
        setSseStatus("connected");
        addLog(`[SSE HELLO] Opened socket. Streaming live banking activities.`);
      };

      eventSource.onerror = () => {
        setSseStatus("disconnected");
        addLog(`[SSE TIMEOUT] Connectivity lost. Retrying standard proxy link...`);
        eventSource?.close();
        setTimeout(establishSSE, 4000); // Reconnect handler
      };

      // Receives real-time swipe/charge triggers
      eventSource.addEventListener("new-transaction", (event: any) => {
        try {
          const { transaction, accounts: nextAccounts } = JSON.parse(event.data);
          
          setTransactions((prev) => [transaction, ...prev]);
          setAccounts(nextAccounts);
          addLog(`[NEW TX CLEAR] ${transaction.description || 'Merchant'} charged $${Math.abs(transaction.amount).toFixed(2)} on ${transaction.bankName}.`);
        } catch (error) {
          console.error("Failed to parse incoming transaction from stream", error);
        }
      });

      // Receives system-wide account updates
      eventSource.addEventListener("accounts-update", (event: any) => {
        try {
          const nextAccounts = JSON.parse(event.data);
          setAccounts(nextAccounts);
          addLog(`[SSE SUCCESS] Account ledger balance sync complete.`);
        } catch (error) {
          console.error("Failed to parse accounts update list", error);
        }
      });

      // Receives updated sliders adjustments
      eventSource.addEventListener("budget-update", (event: any) => {
        try {
          const nextCategories = JSON.parse(event.data);
          setCategories(nextCategories);
          addLog(`[SSE SUCCESS] Stately categories limit updated.`);
        } catch (error) {
          console.error("Failed to parse category update payload", error);
        }
      });
    };

    establishSSE();

    return () => {
      eventSource?.close();
    };
  }, []);

  // 3. Command handlings: Set custom Category Limit
  const handleUpdateBudget = async (categoryId: string, newLimit: number) => {
    try {
      const res = await fetch(`/api/budget/${categoryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: newLimit }),
      });

      if (!res.ok) throw new Error("Update packet transmission failed");
      const data = await res.json();
      setCategories(data.categories);
      addLog(`[BUDGET] Category updated on Server. New limit allocated: $${newLimit}`);
    } catch (error) {
      addLog(`[ERR] Failed to alter budget limit configuration on disk.`);
    }
  };

  // 4. Command handlings: Link simulated checkings or rewards card
  const handleConnectBank = async (details: {
    institution: string;
    name: string;
    accountType: "checking" | "savings" | "credit_card";
    initialBalance: number;
  }) => {
    try {
      const res = await fetch("/api/bank/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(details),
      });

      if (!res.ok) throw new Error("Connection failed");
      const data = await res.json();
      setAccounts(data.accounts);
      addLog(`[LINK] Connected new institution portal: ${details.institution}.`);
    } catch (error) {
      addLog(`[ERR] Bypassed bank pairing protocol. Server error.`);
    }
  };

  // 5. Command handlings: Remove financial card from feed
  const handleDisconnectBank = async (id: string) => {
    try {
      const res = await fetch("/api/bank/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error("Teardown failed");
      const data = await res.json();
      setAccounts(data.accounts);
      addLog(`[DISCONNECT] Removed active security sync tokens for ${id}.`);
    } catch (error) {
      addLog(`[ERR] Terminating connections failed.`);
    }
  };

  // 6. Command handlings: Force fast polling sync simulation
  const handleSyncCheck = async () => {
    try {
      addLog(`[SYNCING INITIALIZED] Handshaking secure open-banking ports...`);
      const res = await fetch("/api/bank/sync-check", { method: "POST" });
      if (!res.ok) throw new Error("Sync trigger failed");
    } catch (error) {
      addLog(`[ERR] Synchronization system failure.`);
    }
  };

  // 7. Command handlings: Swipe terminal trigger
  const handleSwipeCharge = async (details: {
    accountId: string;
    description: string;
    amount: number;
    category: string;
  }) => {
    const res = await fetch("/api/bank/charge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(details),
    });

    if (!res.ok) throw new Error("Swipe transmission failed");
    const data = await res.json();
    
    // Optimistic update client values ahead of next keeping alive tick
    setTransactions(prev => [data.transaction, ...prev]);
    setAccounts(data.accounts);
  };

  return (
    <div className="bg-zinc-50 min-h-screen text-zinc-800 font-sans tracking-tight pb-12" id="app-root-workspace">
      {/* Visual Workspace Hero Ribbon Header */}
      <header className="bg-white border-b border-zinc-200/80 sticky top-0 z-40 py-4 shadow-xs" id="main-navigation-header">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-150">
              <PiggyBank className="w-5.5 h-5.5" />
            </span>
            <div>
              <h1 className="text-xl font-bold font-display text-zinc-950 flex items-center gap-2">
                LedgerFlow
                <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Bank-Linked
                </span>
              </h1>
              <p className="text-xs text-zinc-500">Real-Time Open Banking Budget tracking console</p>
            </div>
          </div>

          {/* Infrastructure Health Panel */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className={`p-1 px-3.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 ${
              sseStatus === "connected" ? "bg-emerald-50 border-emerald-100 text-emerald-700" :
              sseStatus === "connecting" ? "bg-amber-50 border-amber-100 text-amber-700" :
              "bg-rose-50 border-rose-100 text-rose-700"
            }`}
            >
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>
                {sseStatus === "connected" ? "Sync Feed Active" : sseStatus === "connecting" ? "Configuring Feed" : "Stream Offline"}
              </span>
            </div>
            
            <div className="p-1 px-3 rounded-full border border-zinc-200 text-zinc-500 text-[11px] font-mono font-medium bg-zinc-50 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>AES-256 SSL</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid Scaffold */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 mt-6 space-y-6" id="dashboard-scaffold">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="top-row-scaffold">
          {/* LEFT: Centralized Budget statistics & Category lists */}
          <div className="lg:col-span-2 space-y-6">
            <BudgetOverview
              categories={categories}
              accounts={accounts}
              transactions={transactions}
              onUpdateBudget={handleUpdateBudget}
            />
          </div>

          {/* RIGHT: High-contrast shiny cards list & Real-Time simulation trigger widget */}
          <div className="space-y-6 flex flex-col h-full">
            <div className="flex-1">
              <BankConnections
                accounts={accounts}
                isSyncing={accounts.some((a) => a.status === "syncing")}
                onConnect={handleConnectBank}
                onDisconnect={handleDisconnectBank}
                onSyncCheck={handleSyncCheck}
              />
            </div>
            <div className="flex-1 pt-2">
              <RealTimeLiveFeed
                accounts={accounts}
                sseStatus={sseStatus}
                onSwipeCharge={handleSwipeCharge}
                localLogs={localLogs}
              />
            </div>
          </div>
        </div>

        {/* BOTTOM: Massive transactions details history list */}
        <div className="w-full" id="bottom-row-scaffold">
          <TransactionList transactions={transactions} />
        </div>
      </main>
    </div>
  );
}
