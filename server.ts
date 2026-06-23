import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import { BankAccount, Transaction, BudgetCategory } from "./src/types";

// Setup helpers for __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db_store.json");

// Default template and seed data
const DEFAULT_CATEGORIES: BudgetCategory[] = [
  { id: "cat-1", name: "Groceries", limit: 500, color: "emerald", icon: "ShoppingCart" },
  { id: "cat-2", name: "Restaurants", limit: 300, color: "rose", icon: "Utensils" },
  { id: "cat-3", name: "Utilities", limit: 200, color: "sky", icon: "Lightbulb" },
  { id: "cat-4", name: "Entertainment", limit: 150, color: "indigo", icon: "Flame" },
  { id: "cat-5", name: "Shopping", limit: 400, color: "pink", icon: "ShoppingBag" },
  { id: "cat-6", name: "Travel", limit: 250, color: "violet", icon: "Plane" },
  { id: "cat-7", name: "Uncategorized", limit: 100, color: "gray", icon: "HelpCircle" },
];

const DEFAULT_ACCOUNTS: BankAccount[] = [
  { id: "acc-1", institution: "Chase Bank", name: "Total Checking", accountType: "checking", status: "connected", balance: 3450.25, lastSynced: new Date().toISOString() },
  { id: "acc-2", institution: "Wells Fargo", name: "Way2Save Savings", accountType: "savings", status: "connected", balance: 14200.50, lastSynced: new Date().toISOString() },
  { id: "acc-3", institution: "Bank of America", name: "Cash Rewards Credit", accountType: "credit_card", status: "connected", balance: -312.40, lastSynced: new Date().toISOString() }
];

const DEFAULT_TRANSACTIONS: Transaction[] = [
  { id: "tx-1", bankAccountId: "acc-1", bankName: "Chase Bank", date: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(), description: "Whole Foods Market", amount: -84.20, category: "Groceries", status: "cleared" },
  { id: "tx-2", bankAccountId: "acc-1", bankName: "Chase Bank", date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), description: "Starbucks Coffee", amount: -6.75, category: "Restaurants", status: "cleared" },
  { id: "tx-3", bankAccountId: "acc-2", bankName: "Wells Fargo", date: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(), description: "Employer Direct Payroll", amount: 2450.00, category: "Income", status: "cleared" },
  { id: "tx-4", bankAccountId: "acc-3", bankName: "Bank of America", date: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(), description: "Netflix Premium", amount: -15.49, category: "Entertainment", status: "cleared" },
  { id: "tx-5", bankAccountId: "acc-3", bankName: "Bank of America", date: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(), description: "Chevron Gas Station", amount: -42.50, category: "Travel", status: "cleared" },
  { id: "tx-6", bankAccountId: "acc-1", bankName: "Chase Bank", date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(), description: "Amazon.com Prime Buy", amount: -64.30, category: "Shopping", status: "cleared" },
  { id: "tx-7", bankAccountId: "acc-1", bankName: "Chase Bank", date: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(), description: "Chipotle Grill Dinner", amount: -24.80, category: "Restaurants", status: "cleared" },
  { id: "tx-8", bankAccountId: "acc-1", bankName: "Chase Bank", date: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(), description: "Pacific Gas & Electric", amount: -115.00, category: "Utilities", status: "cleared" },
];

interface DataStore {
  categories: BudgetCategory[];
  accounts: BankAccount[];
  transactions: Transaction[];
}

function loadDB(): DataStore {
  try {
    if (fs.existsSync(DB_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
      return {
        categories: parsed.categories || DEFAULT_CATEGORIES,
        accounts: parsed.accounts || DEFAULT_ACCOUNTS,
        transactions: parsed.transactions || DEFAULT_TRANSACTIONS,
      };
    }
  } catch (error) {
    console.error("Failed to parse db_store.json, resetting to defaults", error);
  }
  
  // Seed initial store
  const store = { categories: DEFAULT_CATEGORIES, accounts: DEFAULT_ACCOUNTS, transactions: DEFAULT_TRANSACTIONS };
  saveDB(store);
  return store;
}

function saveDB(store: DataStore) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to write db_store.json", error);
  }
}

// SSE Client list for real-time broadcasts
let clients: Array<{ id: string; res: any }> = [];

function broadcastToClients(type: string, data: any) {
  clients.forEach((client) => {
    client.res.write(`event: ${type}\n`);
    client.res.write(`data: ${JSON.stringify(data)}\n\n`);
  });
}

// Transaction Generator options
const EXPENSE_TEMPLATES = [
  { description: "Trader Joe's", min: 20, max: 120, category: "Groceries" },
  { description: "Shell Gas Station", min: 30, max: 60, category: "Travel" },
  { description: "Starbucks Cafe", min: 4, max: 12, category: "Restaurants" },
  { description: "Uber Lyft Ride", min: 10, max: 35, category: "Travel" },
  { description: "Target Retail Store", min: 15, max: 150, category: "Shopping" },
  { description: "Steam Store Games", min: 5, max: 60, category: "Entertainment" },
  { description: "Local Ramen & Sushi", min: 20, max: 70, category: "Restaurants" },
  { description: "Subway Sandwiches", min: 8, max: 20, category: "Restaurants" },
  { description: "Costco Bulk Retail", min: 80, max: 250, category: "Groceries" },
  { description: "Warner Bros Max Premium", min: 15.99, max: 15.99, category: "Entertainment" },
];

async function startServer() {
  const app = express();
  app.use(express.json());

  // Load Database State
  let store = loadDB();

  // API: Get Full Tracker Dashboard State
  app.get("/api/dashboard", (req, res) => {
    res.json(store);
  });

  // API: Update Budget configurations
  app.put("/api/budget/:id", (req, res) => {
    const { id } = req.params;
    const { limit } = req.body;
    
    if (typeof limit !== "number" || limit < 0) {
      return res.status(400).json({ error: "Invalid budget limit value" });
    }

    const categoryIdx = store.categories.findIndex((c) => c.id === id);
    if (categoryIdx === -1) {
      return res.status(404).json({ error: "Budget Category not found" });
    }

    store.categories[categoryIdx].limit = limit;
    saveDB(store);
    
    // Broadcast updated categories structure
    broadcastToClients("budget-update", store.categories);
    res.json({ success: true, categories: store.categories });
  });

  // API: Connect New Bank Connection
  app.post("/api/bank/connect", (req, res) => {
    const { institution, name, accountType, initialBalance } = req.body;
    
    if (!institution || !name || !accountType) {
      return res.status(400).json({ error: "Missing required bank details" });
    }

    const newAccount: BankAccount = {
      id: `acc-${Date.now()}`,
      institution,
      name,
      accountType,
      status: "connected",
      balance: Number(initialBalance) || 500,
      lastSynced: new Date().toISOString()
    };

    store.accounts.push(newAccount);
    saveDB(store);

    broadcastToClients("accounts-update", store.accounts);
    res.json({ success: true, account: newAccount, accounts: store.accounts });
  });

  // API: Disconnect Bank Connection
  app.post("/api/bank/disconnect", (req, res) => {
    const { id } = req.body;
    
    const accountIdx = store.accounts.findIndex((a) => a.id === id);
    if (accountIdx === -1) {
      return res.status(404).json({ error: "Bank account not found" });
    }

    // Filter out transactions or keep them and mark status
    store.accounts.splice(accountIdx, 1);
    saveDB(store);

    broadcastToClients("accounts-update", store.accounts);
    res.json({ success: true, accounts: store.accounts });
  });

  // API: Simulate a Direct Swipe/Charge instantly to verify live streaming syncing!
  app.post("/api/bank/charge", (req, res) => {
    const { accountId, description, amount, category } = req.body;

    if (!accountId || !description || typeof amount !== "number" || !category) {
      return res.status(400).json({ error: "Missing swipe transaction requirements" });
    }

    const account = store.accounts.find((a) => a.id === accountId);
    if (!account) {
      return res.status(404).json({ error: "Connected bank account not found" });
    }

    // Create the transaction
    const newTx: Transaction = {
      id: `tx-swiped-${Date.now()}`,
      bankAccountId: account.id,
      bankName: account.institution,
      date: new Date().toISOString(),
      description,
      amount, // should be negative for card swipe purchases
      category,
      status: "cleared",
      realTimeSync: true
    };

    // Keep balance accurate
    account.balance = Number((account.balance + amount).toFixed(2));
    account.lastSynced = new Date().toISOString();
    
    // Add transaction to the front of list
    store.transactions.unshift(newTx);
    saveDB(store);

    // Push immediate notifications
    broadcastToClients("new-transaction", { transaction: newTx, accounts: store.accounts });
    res.json({ success: true, transaction: newTx, accounts: store.accounts });
  });

  // API: Force Bank Refresh / Fast Sync Trigger
  app.post("/api/bank/sync-check", (req, res) => {
    if (store.accounts.length === 0) {
      return res.json({ message: "No bank accounts linked to sync.", synced: false });
    }

    // Set bank accounts as syncing state
    store.accounts = store.accounts.map((acc) => ({ ...acc, status: "syncing" }));
    broadcastToClients("accounts-update", store.accounts);

    // Trigger simulation sync complete in 1.5 seconds
    setTimeout(() => {
      // Pick a random account, insert one transaction, return to connected
      const activeAcct = store.accounts[Math.floor(Math.random() * store.accounts.length)];
      const template = EXPENSE_TEMPLATES[Math.floor(Math.random() * EXPENSE_TEMPLATES.length)];
      const amtVal = -Number((Math.random() * (template.max - template.min) + template.min).toFixed(2));

      const syncedTx: Transaction = {
        id: `tx-sync-${Date.now()}`,
        bankAccountId: activeAcct.id,
        bankName: activeAcct.institution,
        date: new Date().toISOString(),
        description: template.description,
        amount: amtVal,
        category: template.category,
        status: "cleared",
        realTimeSync: true
      };

      store.accounts = store.accounts.map((acc) => {
        if (acc.id === activeAcct.id) {
          return {
            ...acc,
            status: "connected" as const,
            balance: Number((acc.balance + amtVal).toFixed(2)),
            lastSynced: new Date().toISOString()
          };
        }
        return { ...acc, status: "connected" as const };
      });

      store.transactions.unshift(syncedTx);
      saveDB(store);

      broadcastToClients("new-transaction", { transaction: syncedTx, accounts: store.accounts });
    }, 1500);

    res.json({ success: true, message: "Sync initialized" });
  });

  // API: Real-Time SSE Stream Endpoint
  app.get("/api/events", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    // Ensure CORS isn't blocked and connection remains open
    res.flushHeaders();

    const clientId = `client-${Date.now()}`;
    const newClient = { id: clientId, res };
    clients.push(newClient);

    // Send initial keep-alive
    res.write(`data: ${JSON.stringify({ connected: true, clientId })}\n\n`);

    req.on("close", () => {
      clients = clients.filter((c) => c.id !== clientId);
    });
  });

  // Periodically generate simulated live transactions to make the real-time element authentic and alive!
  const liveSyncInterval = setInterval(() => {
    if (store.accounts.length === 0 || clients.length === 0) return;

    // 25% chance every 20 seconds to receive a random live charge from connected bank accounts!
    if (Math.random() < 0.25) {
      const eligibleAccs = store.accounts.filter(a => a.status === "connected");
      if (eligibleAccs.length === 0) return;

      const randomAcc = eligibleAccs[Math.floor(Math.random() * eligibleAccs.length)];
      const template = EXPENSE_TEMPLATES[Math.floor(Math.random() * EXPENSE_TEMPLATES.length)];
      const transactionAmount = -Number((Math.random() * (template.max - template.min) + template.min).toFixed(2));

      const incomingTx: Transaction = {
        id: `tx-live-${Date.now()}`,
        bankAccountId: randomAcc.id,
        bankName: randomAcc.institution,
        date: new Date().toISOString(),
        description: `${template.description} (POS Swipe)`,
        amount: transactionAmount,
        category: template.category,
        status: "cleared",
        realTimeSync: true
      };

      // Apply to store state
      randomAcc.balance = Number((randomAcc.balance + transactionAmount).toFixed(2));
      randomAcc.lastSynced = new Date().toISOString();
      store.transactions.unshift(incomingTx);
      saveDB(store);

      // Broadcast back immediately via SSE
      broadcastToClients("new-transaction", { transaction: incomingTx, accounts: store.accounts });
      console.log(`Live Stream synced: ${template.description} of ${transactionAmount}`);
    }
  }, 20000);

  // Mount Vite development midddleware or static builds
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server fully operational on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Critical error firing up custom budget-tracker server:", error);
});
