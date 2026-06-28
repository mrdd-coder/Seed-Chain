'use client';

import React, { useState } from 'react';
import Navbar from '../../components/Navbar';
import { useWalletStore } from '../../state/wallet';
import { useTransactionStore } from '../../state/transactions';
import { Account } from '@stellar/stellar-sdk';

export default function TransactionCenter() {
  const { address, isConnected, network } = useWalletStore();
  const { transactions, consoleLogs, clearHistory, addTransaction, addConsoleLog } = useTransactionStore();

  // XLM Transfer States
  const [xlmDest, setXlmDest] = useState('');
  const [xlmAmt, setXlmAmt] = useState('5');
  const [xlmSending, setXlmSending] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400';
      case 'failed':
        return 'bg-red-500/10 border-red-500/20 text-red-400';
      case 'processing':
      case 'pending':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse';
      default:
        return 'bg-slate-900 border-slate-800 text-slate-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'success': return 'Confirmed';
      case 'failed': return 'Failed';
      case 'processing':
      case 'pending':
        return 'Processing...';
      default: return 'Pending';
    }
  };

  const handleXlmTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !address) {
      alert('Please connect your Freighter or Albedo wallet first.');
      return;
    }
    if (!xlmDest.startsWith('G') || xlmDest.length !== 56) {
      alert('Please enter a valid Stellar public G-address (56 characters).');
      return;
    }

    setXlmSending(true);
    const txId = Math.random().toString(36).substring(7);
    addTransaction({
      id: txId,
      operation: `Send ${xlmAmt} XLM to ${xlmDest.substring(0, 8)}...`,
      status: 'pending',
    });
    addConsoleLog(`[XLM TRANSFER] Initiating transfer of ${xlmAmt} XLM to ${xlmDest}...`);

    try {
      // 1. Fetch account sequence using Horizon
      addConsoleLog('Connecting to Horizon Testnet to load account sequence...');
      const response = await fetch(`https://horizon-testnet.stellar.org/accounts/${address}`);
      if (!response.ok) {
        throw new Error('Failed to load sender account details from Horizon.');
      }
      const accountData = await response.json();
      
      // 2. Build the XLM Payment Transaction
      const { TransactionBuilder, Operation, Asset, Networks } = await import('@stellar/stellar-sdk');
      const senderAccount = new Account(address, accountData.sequence);
      
      addConsoleLog('Building native XLM payment operation...');
      const tx = new TransactionBuilder(senderAccount, {
        fee: '1000',
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          Operation.payment({
            destination: xlmDest,
            asset: Asset.native(),
            amount: xlmAmt,
          })
        )
        .setTimeout(30)
        .build();

      // 3. Request signature from Freighter via kit
      const { StellarWalletsKit } = await import('@creit.tech/stellar-wallets-kit');
      addConsoleLog('Requesting wallet signature...');
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(tx.toXDR(), {
        address: address,
        networkPassphrase: Networks.TESTNET,
      });

      // 4. Submit signed XDR to Horizon Testnet
      addConsoleLog('Submitting signed transaction to Horizon Testnet...');
      const submitBody = new URLSearchParams();
      submitBody.append('tx', signedTxXdr);

      const submitRes = await fetch('https://horizon-testnet.stellar.org/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: submitBody,
      });

      const submitData = await submitRes.json();
      if (!submitRes.ok) {
        const detail = submitData.extras?.result_codes?.operations?.[0] || submitData.detail || 'Submission failed';
        throw new Error(detail);
      }

      const txHash = submitData.hash;
      const explorer = `https://stellar.expert/explorer/testnet/tx/${txHash}`;
      addConsoleLog(`[SUCCESS] XLM transfer successful! Hash: ${txHash}`);
      
      useTransactionStore.getState().updateTransaction(txId, {
        status: 'success',
        hash: txHash,
        explorerLink: explorer,
      });
      
      alert(`XLM Transfer Succeeded!\nHash: ${txHash}`);
      setXlmDest('');
    } catch (error: any) {
      console.error(error);
      const errMsg = error.message || 'Transaction rejected/failed';
      addConsoleLog(`[ERROR] XLM transfer failed: ${errMsg}`);
      useTransactionStore.getState().updateTransaction(txId, {
        status: 'failed',
        error: errMsg,
      });
      alert(`XLM Transfer Failed: ${errMsg}`);
    } finally {
      setXlmSending(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#030712] text-slate-200 transition-colors overflow-hidden">
      {/* Ambient spotlights */}
      <div className="spotlight-purple -top-40 -left-40" />
      <div className="spotlight-cyan top-[500px] -right-40" />

      <Navbar />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Transactions List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-white">Transaction Center</h1>
              <p className="text-sm text-slate-400 mt-1">
                Track transaction status, execution logs, and blockchain explorer details.
              </p>
            </div>
            {transactions.length > 0 && (
              <button
                onClick={clearHistory}
                className="px-3 py-1.5 border border-slate-800 text-xs font-bold text-slate-400 hover:text-red-400 hover:bg-slate-900 rounded-lg cursor-pointer transition-colors"
              >
                Clear History
              </button>
            )}
          </div>

          <div className="space-y-4">
            {transactions.length === 0 ? (
              <div className="py-20 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-950/20 backdrop-blur-md">
                No transactions tracked yet. Transactions you run will show up here.
              </div>
            ) : (
              transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="web3-card rounded-xl p-5 shadow-sm space-y-4 text-left"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left">
                    <div>
                      <h3 className="font-bold text-white text-sm sm:text-base">{tx.operation}</h3>
                      <span className="text-[10px] text-slate-500 block font-mono mt-1">
                        Track ID: {tx.id} | Timestamp: {new Date(tx.timestamp).toLocaleString()}
                      </span>
                    </div>
                    
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border max-w-max self-start sm:self-center ${getStatusColor(tx.status)}`}>
                      {getStatusLabel(tx.status)}
                    </span>
                  </div>

                  {tx.hash && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 border-t border-slate-800/50 pt-3 text-xs">
                      <span className="text-slate-400 font-medium">Stellar Tx Hash:</span>
                      <span className="font-mono text-slate-300 truncate max-w-[200px] sm:max-w-md">
                        {tx.hash}
                      </span>
                      {tx.explorerLink && (
                        <a
                          href={tx.explorerLink}
                          target="_blank"
                          rel="noreferrer"
                          className="sm:ml-auto text-indigo-400 hover:text-indigo-300 font-bold hover:underline"
                        >
                          View in Block Explorer ↗
                        </a>
                      )}
                    </div>
                  )}

                  {tx.error && (
                    <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-lg text-xs text-red-400 text-left">
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

        {/* Right Side: Send XLM Form + Logging Debug Console */}
        <div className="space-y-6">
          {/* Send XLM Widget */}
          <div className="bg-[#090d16]/40 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 backdrop-blur-md">
            <div>
              <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
                <span className="text-indigo-400">🚀</span> Send Stellar XLM
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Easily transfer native XLM directly on the Stellar Testnet.
              </p>
            </div>

            <form onSubmit={handleXlmTransfer} className="space-y-4">
              <div className="space-y-1 text-left">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Recipient Stellar Address (G...)</label>
                <input
                  type="text"
                  value={xlmDest}
                  onChange={(e) => setXlmDest(e.target.value)}
                  className="bg-black/40 border border-slate-800 text-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono focus:outline-none focus:border-indigo-500 w-full"
                  placeholder="e.g. GC3..."
                  required
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Amount (XLM)</label>
                <input
                  type="number"
                  value={xlmAmt}
                  onChange={(e) => setXlmAmt(e.target.value)}
                  className="bg-black/40 border border-slate-800 text-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-indigo-500 w-full"
                  placeholder="e.g. 10"
                  min="1"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={xlmSending}
                className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold rounded-xl text-xs transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:bg-slate-700"
              >
                {xlmSending ? 'Transferring XLM...' : 'Send XLM'}
              </button>
            </form>
          </div>

          {/* Dev Console */}
          <div className="bg-slate-900 border border-slate-850 rounded-2xl shadow-xl overflow-hidden flex flex-col h-[350px]">
            <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
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
                <div className="text-slate-600 text-center py-20">Console idle. Subscriptions and RPC calls print logs here...</div>
              ) : (
                consoleLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed border-b border-slate-850/50 pb-1.5 text-slate-300">
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
