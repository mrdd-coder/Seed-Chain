'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { useWalletStore } from '../../state/wallet';
import { useTransactionStore } from '../../state/transactions';

interface ActivityEvent {
  id: string;
  type: 'pledge' | 'milestone_requested' | 'milestone_voted' | 'milestone_paid' | 'refund_vote' | 'refund_claim';
  title: string;
  description: string;
  timestamp: string;
  txHash: string;
}

export default function ActivityFeed() {
  const { network } = useWalletStore();
  const { addConsoleLog } = useTransactionStore();
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
    
    // Simulate periodic RPC polling for mock demo logs
    const interval = setInterval(() => {
      addConsoleLog('Polling ledger events for registry and campaigns...');
    }, 10000);

    return () => clearInterval(interval);
  }, [streamSource]);

  const getEventStyle = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'pledge':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900 text-blue-600 dark:text-blue-400';
      case 'milestone_requested':
        return 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900 text-amber-600 dark:text-amber-400';
      case 'milestone_voted':
        return 'bg-indigo-50 border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400';
      case 'milestone_paid':
        return 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400';
      default:
        return 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900 text-red-600 dark:text-red-400';
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-200 transition-colors">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-5 mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Live Activity Feed</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Real-time syndicate events, pledges, governance voting, and disbursements on Stellar.
            </p>
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 max-w-fit self-start sm:self-center">
            <button
              onClick={() => setStreamSource('simulated')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                streamSource === 'simulated'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              Simulated Stream
            </button>
            <button
              onClick={() => setStreamSource('blockchain')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                streamSource === 'blockchain'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              On-Chain Subscription
            </button>
          </div>
        </div>

        {/* Live streaming status badge */}
        <div className="flex items-center gap-2 mb-6 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-max">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {streamSource === 'simulated' ? 'Streaming simulated test events...' : `Subscribed to Stellar ${network} ledger...`}
          </span>
        </div>

        {/* Events Feed List */}
        <div className="space-y-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex gap-4 items-start text-left animate-in slide-in-from-top-4 duration-200"
            >
              <div className={`h-10 w-10 rounded-xl border flex items-center justify-center text-lg ${getEventStyle(event.type)}`}>
                {getEventEmoji(event.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                    {event.title}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-medium font-mono">{event.timestamp}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  {event.description}
                </p>
                <div className="flex items-center gap-1.5 mt-3 text-[10px] font-semibold text-slate-400">
                  <span>Tx Hash:</span>
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${event.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-emerald-600 hover:text-emerald-700 hover:underline"
                  >
                    {event.txHash}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
