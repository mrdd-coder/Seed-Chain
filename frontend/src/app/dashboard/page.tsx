'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import { useWalletStore } from '../../state/wallet';

export default function Dashboard() {
  const { address, isConnected, xlmBalance } = useWalletStore();

  const portfolioStats = [
    { label: 'Total Invested', value: '7,000 USDC', icon: '💰' },
    { label: 'Active Campaigns', value: '2', icon: '📊' },
    { label: 'Pending Milestones', value: '3', icon: '⏳' },
  ];

  const investments = [
    {
      name: 'SolarGrid Protocol',
      pledged: '2,000 USDC',
      progress: 70,
      status: 'Active',
      milestoneStatus: '1 of 2 paid',
    },
    {
      name: 'StellarPay Mobile',
      pledged: '5,000 USDC',
      progress: 100,
      status: 'Active',
      milestoneStatus: 'Payout requested',
    },
  ];

  const recentActivity = [
    { action: 'Invested 5,000 USDC', project: 'StellarPay Mobile', time: '2 hours ago' },
    { action: 'Milestone 1 approved', project: 'SolarGrid Protocol', time: '1 day ago' },
    { action: 'Campaign launched', project: 'SolarGrid Protocol', time: '3 days ago' },
  ];

  return (
    <div className="relative min-h-screen bg-[#030712] text-slate-200 transition-colors overflow-hidden">
      {/* Ambient spotlights */}
      <div className="spotlight-purple -top-40 -left-40" />
      <div className="spotlight-cyan top-[500px] -right-40" />

      <Navbar />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white">
              {isConnected ? `Welcome back` : 'Dashboard'}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {isConnected
                ? `Connected as ${address?.substring(0, 6)}...${address?.substring(address.length - 4)}`
                : 'Connect your wallet to view your portfolio and activity.'}
            </p>
          </div>
          {isConnected && xlmBalance && (
            <div className="web3-card rounded-xl px-5 py-3 flex items-center gap-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Wallet Balance</span>
              <span className="text-lg font-extrabold text-indigo-400">{xlmBalance} XLM</span>
            </div>
          )}
        </div>

        {/* Portfolio Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {portfolioStats.map((stat, idx) => (
            <div key={idx} className="web3-card rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</span>
                <span className="text-xl">{stat.icon}</span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Your Investments */}
        <div className="web3-card rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-white">Your Investments</h2>
            <Link href="/campaigns" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 hover:underline">
              View all campaigns →
            </Link>
          </div>

          {!isConnected ? (
            <div className="py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
              Connect your wallet to see your investments.
            </div>
          ) : investments.length === 0 ? (
            <div className="py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
              You haven&apos;t invested in any campaigns yet.
            </div>
          ) : (
            <div className="space-y-4">
              {investments.map((inv, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-slate-800/60 rounded-xl bg-slate-950/40 hover:border-indigo-500/20 transition-all">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-white text-sm">{inv.name}</h3>
                      <span className="text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                        {inv.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>Pledged: <strong className="text-slate-200">{inv.pledged}</strong></span>
                      <span>Milestones: <strong className="text-slate-200">{inv.milestoneStatus}</strong></span>
                    </div>
                    <div className="w-full bg-slate-900 border border-slate-800/60 h-1.5 rounded-full overflow-hidden max-w-xs">
                      <div className="bg-gradient-to-r from-indigo-500 to-violet-600 h-full rounded-full" style={{ width: `${inv.progress}%` }}></div>
                    </div>
                  </div>
                  <Link
                    href="/campaigns"
                    className="px-4 py-2 border border-slate-800 hover:border-indigo-500/30 text-xs font-bold text-slate-300 hover:text-indigo-400 rounded-xl transition-all"
                  >
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Row: Recent Activity + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2 web3-card rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-extrabold text-white">Recent Activity</h2>
            {recentActivity.length === 0 ? (
              <div className="py-8 text-center text-slate-500">No recent activity.</div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((event, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border border-slate-800/50 rounded-xl bg-slate-950/30">
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-slate-200">{event.action}</p>
                      <p className="text-xs text-slate-500">{event.project}</p>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">{event.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="web3-card rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-extrabold text-white">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                href="/campaigns"
                className="w-full flex items-center gap-3 p-4 border border-slate-800 rounded-xl hover:border-indigo-500/30 hover:bg-slate-900/40 transition-all group"
              >
                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-lg">🔍</div>
                <div>
                  <div className="text-sm font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">Explore Campaigns</div>
                  <div className="text-xs text-slate-500">Browse active projects</div>
                </div>
              </Link>
              <Link
                href="/campaigns?tab=create"
                className="w-full flex items-center gap-3 p-4 border border-slate-800 rounded-xl hover:border-indigo-500/30 hover:bg-slate-900/40 transition-all group"
              >
                <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-lg">🚀</div>
                <div>
                  <div className="text-sm font-bold text-slate-200 group-hover:text-violet-400 transition-colors">Launch a Campaign</div>
                  <div className="text-xs text-slate-500">Create a new syndicate</div>
                </div>
              </Link>
              <Link
                href="/how-it-works"
                className="w-full flex items-center gap-3 p-4 border border-slate-800 rounded-xl hover:border-indigo-500/30 hover:bg-slate-900/40 transition-all group"
              >
                <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-lg">📖</div>
                <div>
                  <div className="text-sm font-bold text-slate-200 group-hover:text-cyan-400 transition-colors">How It Works</div>
                  <div className="text-xs text-slate-500">Learn the platform</div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
