'use client';

import React from 'react';
import Navbar from '../../components/Navbar';
import { useTransactionStore } from '../../state/transactions';

export default function TransactionCenter() {
  const { transactions, consoleLogs, clearHistory } = useTransactionStore();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400';
      case 'failed':
        return 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-900 dark:text-red-400';
      case 'processing':
        return 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950/20 dark:border-orange-900 dark:text-orange-400 animate-pulse';
      default:
        return 'bg-slate-100 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'success': return 'Confirmed';
      case 'failed': return 'Failed';
      case 'processing': return 'Processing...';
      default: return 'Pending';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Transactions List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Transaction Center</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Track transaction status, execution logs, and blockchain explorer details.
              </p>
            </div>
            {transactions.length > 0 && (
              <button
                onClick={clearHistory}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg cursor-pointer"
              >
                Clear History
              </button>
            )}
          </div>

          <div className="space-y-4">
            {transactions.length === 0 ? (
              <div className="py-20 text-center text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900">
                No transactions tracked yet. Transactions you run will show up here.
              </div>
            ) : (
              transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{tx.operation}</h3>
                      <span className="text-[10px] text-slate-400 block font-mono mt-1">
                        Track ID: {tx.id} | Timestamp: {new Date(tx.timestamp).toLocaleString()}
                      </span>
                    </div>
                    
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border max-w-max self-start sm:self-center ${getStatusColor(tx.status)}`}>
                      {getStatusLabel(tx.status)}
                    </span>
                  </div>

                  {tx.hash && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 border-t border-slate-50 dark:border-slate-800/80 pt-3 text-xs">
                      <span className="text-slate-400 font-medium">Stellar Tx Hash:</span>
                      <span className="font-mono text-slate-600 dark:text-slate-300 truncate max-w-[200px] sm:max-w-md">
                        {tx.hash}
                      </span>
                      {tx.explorerLink && (
                        <a
                          href={tx.explorerLink}
                          target="_blank"
                          rel="noreferrer"
                          className="sm:ml-auto text-orange-600 hover:text-orange-700 font-bold hover:underline"
                        >
                          View in Block Explorer ↗
                        </a>
                      )}
                    </div>
                  )}

                  {tx.error && (
                    <div className="p-3 bg-red-50 border border-red-150 rounded-lg text-xs text-red-600 dark:bg-red-950/20 dark:border-red-900 dark:text-red-400 text-left">
                      <strong>Execution Error:</strong> {tx.error}
                      <button
                        onClick={() => {
                          alert(`Retrying operation: ${tx.operation}. Opening setup details...`);
                        }}
                        className="mt-2 block px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-md text-[10px] uppercase transition-all"
                      >
                        Retry Transaction
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Logging Debug Console */}
        <div className="space-y-6">
          <div className="bg-slate-900 text-slate-200 border border-slate-850 rounded-2xl shadow-xl overflow-hidden flex flex-col h-[500px]">
            <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Developer Log Console</span>
              </div>
              <button
                onClick={clearHistory}
                className="text-[10px] text-slate-500 hover:text-white hover:underline cursor-pointer"
              >
                Clear Logs
              </button>
            </div>
            
            <div className="p-5 font-mono text-[11px] space-y-2 overflow-y-auto flex-1 text-left scrollbar-thin scrollbar-thumb-slate-800">
              {consoleLogs.length === 0 ? (
                <div className="text-slate-600 text-center py-20">Console idle. Subscriptions and RPC calls prints output logs here...</div>
              ) : (
                consoleLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed border-b border-slate-850/50 pb-1.5">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
