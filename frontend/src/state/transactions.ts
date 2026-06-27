import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Transaction {
  id: string; // Internal unique tracking ID
  hash: string | null; // Stellar transaction hash
  operation: string; // Description of action (e.g., "Pledge", "Vote")
  status: 'pending' | 'processing' | 'success' | 'failed';
  timestamp: number;
  error: string | null;
  explorerLink: string | null;
  retryAction?: string; // Identifier for retry action
}

interface TransactionState {
  transactions: Transaction[];
  consoleLogs: string[];
  addTransaction: (tx: Omit<Transaction, 'timestamp' | 'hash' | 'error' | 'explorerLink'>) => void;
  updateTransaction: (id: string, updates: Partial<Pick<Transaction, 'hash' | 'status' | 'error' | 'explorerLink'>>) => void;
  addConsoleLog: (message: string) => void;
  clearHistory: () => void;
}

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set) => ({
      transactions: [],
      consoleLogs: [],
      addTransaction: (tx) => set((state) => ({
        transactions: [
          {
            ...tx,
            hash: null,
            error: null,
            explorerLink: null,
            timestamp: Date.now(),
          },
          ...state.transactions,
        ],
      })),
      updateTransaction: (id, updates) => set((state) => ({
        transactions: state.transactions.map((tx) =>
          tx.id === id ? { ...tx, ...updates } : tx
        ),
      })),
      addConsoleLog: (message) => set((state) => ({
        consoleLogs: [`[${new Date().toLocaleTimeString()}] ${message}`, ...state.consoleLogs].slice(0, 100),
      })),
      clearHistory: () => set({ transactions: [], consoleLogs: [] }),
    }),
    {
      name: 'seedchain-transactions',
    }
  )
);
