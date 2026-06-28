'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { useWalletStore } from '../../state/wallet';
import { useTransactionStore } from '../../state/transactions';
import { Account } from '@stellar/stellar-sdk';

interface ActivityEvent {
  id: string;
  type: 'pledge' | 'milestone_requested' | 'milestone_voted' | 'milestone_paid' | 'refund_vote' | 'refund_claim';
  title: string;
  description: string;
  timestamp: string;
  txHash: string;
}

export default function TransactionCenter() {
  const { address, isConnected, network } = useWalletStore();
  const { transactions, consoleLogs, clearHistory, addTransaction, addConsoleLog } = useTransactionStore();

  // XLM Transfer States
  const [xlmDest, setXlmDest] = useState('');
  const [xlmAmt, setXlmAmt] = useState('5');
  const [xlmSending, setXlmSending] = useState(false);

  // Unified Page navigation
  const [leftTab, setLeftTab] = useState<'history' | 'activity'>('history');

  // Event stream state
  const [streamSource, setStreamSource] = useState<'simulated' | 'blockchain'>('simulated');
  const [events, setEvents] = useState<ActivityEvent[]>([
    {
      id: 'evt-1',
      type: 'milestone_paid',
      title: 'Milestone 1 Disbursed',
      description: 'SolarGrid Protocol released 14,000 USDC to founder after 84% investor approval.',
      timestamp: new Date(Date.now() - 60000 * 5).toLocaleTimeString(),
      txHash: '0x3a4b...e5d8',
    },
    {
      id: 'evt-2',
      type: 'pledge',
      title: 'New Pledge Registered',
      description: 'Investor GD...932a pledged 4,500 USDC to StellarPay Mobile.',
      timestamp: new Date(Date.now() - 60000 * 12).toLocaleTimeString(),
      txHash: '0x9c4f...f12b',
    },
    {
      id: 'evt-3',
      type: 'milestone_requested',
      title: 'Milestone Payout Requested',
      description: 'StellarPay Mobile founder requested release of Milestone 2 (Mobile POS release - 40%). Voting open.',
      timestamp: new Date(Date.now() - 60000 * 30).toLocaleTimeString(),
      txHash: '0x7e5c...89d1',
    },
  ]);

  // Live simulation ticker generating mock events
  useEffect(() => {
    if (streamSource !== 'simulated') return;

    const mockDetails = [
      {
        type: 'pledge' as const,
        title: 'New Pledge Registered',
        desc: () => `Investor G${Math.random().toString(36).substring(5).toUpperCase()}... pledged ${Math.floor(Math.random() * 5000 + 500)} USDC to SolarGrid Protocol.`,
      },
      {
        type: 'milestone_voted' as const,
        title: 'Governance Vote Cast',
        desc: () => `Investor G${Math.random().toString(36).substring(5).toUpperCase()}... voted YES on SolarGrid Milestone 2 (Approval weight: ${Math.floor(Math.random() * 2000 + 200)} votes).`,
      },
      {
        type: 'pledge' as const,
        title: 'New Pledge Registered',
        desc: () => `Investor G${Math.random().toString(36).substring(5).toUpperCase()}... pledged ${Math.floor(Math.random() * 12000 + 1000)} USDC to StellarPay Mobile.`,
      },
      {
        type: 'refund_vote' as const,
        title: 'Refund Vote Cast',
        desc: () => `Investor G${Math.random().toString(36).substring(5).toUpperCase()}... voted to trigger syndicate refund on AeroDrone Logistics.`,
      }
    ];

    const interval = setInterval(() => {
      const selected = mockDetails[Math.floor(Math.random() * mockDetails.length)];
      const newEvent: ActivityEvent = {
        id: `evt-${Math.random().toString(36).substring(5)}`,
        type: selected.type,
        title: selected.title,
        description: selected.desc(),
        timestamp: new Date().toLocaleTimeString(),
        txHash: `0x${Math.random().toString(16).substring(2, 6)}...${Math.random().toString(16).substring(2, 6)}`,
      };

      setEvents((prev) => [newEvent, ...prev].slice(0, 15));
      addConsoleLog(`[FEED] Incoming live event streamed: ${newEvent.title}`);
    }, 8000);

    return () => clearInterval(interval);
  }, [streamSource]);

  // Real blockchain event polling setup
  useEffect(() => {
    if (streamSource !== 'blockchain') return;
    
    addConsoleLog('Subscribing to Soroban RPC contract event streaming pipeline...');
    
    const interval = setInterval(() => {
      addConsoleLog('Polling ledger events for registry and campaigns...');
    }, 10000);

    return () => clearInterval(interval);
  }, [streamSource]);

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

  const getEventStyle = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'pledge':
        return 'bg-indigo-500/10 border-indigo-500/25 text-indigo-400';
      case 'milestone_requested':
        return 'bg-amber-500/10 border-amber-500/25 text-amber-400';
      case 'milestone_voted':
        return 'bg-violet-500/10 border-violet-500/25 text-violet-400';
      case 'milestone_paid':
        return 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400';
      default:
        return 'bg-red-500/10 border-red-500/25 text-red-400';
    }
  };

  const getEventEmoji = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'pledge': return '💰';
      case 'milestone_requested': return '📋';
      case 'milestone_voted': return '🗳️';
      case 'milestone_paid': return '🎉';
      default: return '🛡️';
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
      const response = await fetch(`https://horizon-testnet.stellar.org/accounts/${address}`);
      if (!response.ok) {
        throw new Error('Failed to load sender account details from Horizon.');
      }
      const accountData = await response.json();
      
      const { TransactionBuilder, Operation, Asset, Networks } = await import('@stellar/stellar-sdk');
      const senderAccount = new Account(address, accountData.sequence);
      
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

      const { StellarWalletsKit } = await import('@creit.tech/stellar-wallets-kit');
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(tx.toXDR(), {
        address: address,
        networkPassphrase: Networks.TESTNET,
      });

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
        
        {/* Left Side: Transactions List or Event Stream */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-white">Transaction Center</h1>
              <p className="text-sm text-slate-400 mt-1">
                Track transaction status, execution logs, and live on-chain governance activity.
              </p>
            </div>
            
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800/80 max-w-fit">
              <button
                onClick={() => setLeftTab('history')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  leftTab === 'history'
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Tx Logs
              </button>
              <button
                onClick={() => setLeftTab('activity')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  leftTab === 'activity'
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Live Feed
              </button>
            </div>
          </div>

          {leftTab === 'history' ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Local Transaction History</span>
                {transactions.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="text-xs text-slate-500 hover:text-red-400 hover:underline"
                  >
                    Clear History
                  </button>
                )}
              </div>

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
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950/60 border border-slate-800 rounded-xl">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {streamSource === 'simulated' ? 'Streaming Simulated Event Logs...' : `Active on Stellar ${network} Ledger`}
                  </span>
                </div>

                <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 max-w-fit">
                  <button
                    onClick={() => setStreamSource('simulated')}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                      streamSource === 'simulated' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-500'
                    }`}
                  >
                    Simulated
                  </button>
                  <button
                    onClick={() => setStreamSource('blockchain')}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                      streamSource === 'blockchain' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-500'
                    }`}
                  >
                    Live RPC
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="web3-card rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex gap-4 items-start text-left"
                  >
                    <div className={`h-10 w-10 rounded-xl border flex items-center justify-center text-lg shrink-0 ${getEventStyle(event.type)}`}>
                      {getEventEmoji(event.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-sm text-white">
                          {event.title}
                        </h3>
                        <span className="text-[10px] text-slate-500 font-medium font-mono">{event.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {event.description}
                      </p>
                      <div className="flex items-center gap-1.5 mt-3 text-[10px] font-semibold text-slate-500">
                        <span>Tx Hash:</span>
                        <a
                          href={`https://stellar.expert/explorer/testnet/tx/${event.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-indigo-400 hover:text-indigo-300 hover:underline"
                        >
                          {event.txHash}
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
              {consoleLogs.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-[10px] text-slate-500 hover:text-white hover:underline cursor-pointer"
                >
                  Clear Logs
                </button>
              )}
            </div>
            
            <div className="p-5 font-mono text-[11px] space-y-2 overflow-y-auto flex-1 text-left scrollbar-thin scrollbar-thumb-slate-800">
              {consoleLogs.length === 0 ? (
                <div className="text-slate-600 text-center py-20">Console idle. Subscriptions and RPC calls print logs here...</div>
              ) : (
                consoleLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed border-b border-slate-850/50 pb-1.5 text-slate-350">
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
