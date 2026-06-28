'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '../../components/Navbar';

export default function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'Connect Your Wallet',
      description: 'Connect Freighter or Albedo wallet directly. The platform will automatically load your testnet balance and active key credentials.',
      icon: '🚢',
    },
    {
      num: '02',
      title: 'Explore & Back Projects',
      description: 'Browse active syndicate campaigns, inspect the funding goal, and pledge USDC stablecoins directly into the secure milestone-gated escrow.',
      icon: '🔍',
    },
    {
      num: '03',
      title: 'Gated Milestone Escrows',
      description: 'Project funds are locked in the syndicate smart contract escrow. Founders cannot withdraw all funds at once. They must build and request payouts in sequential blocks.',
      icon: '🔒',
    },
    {
      num: '04',
      title: 'Governance Voting',
      description: 'Investors vote on-chain with weights proportional to their pledge size to approve or reject milestone release requests. Majority approval releases funds.',
      icon: '🗳️',
    },
    {
      num: '05',
      title: 'Escrow Refund Safeguard',
      description: 'If a project founder defaults or fails to deliver, investors can vote to trigger a syndicate-wide refund, instantly reclaiming their remaining unreleased USDC from the contract.',
      icon: '🛡️',
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#030712] text-slate-200 transition-colors overflow-hidden">
      {/* Ambient spotlights */}
      <div className="spotlight-purple -top-40 -left-40" />
      <div className="spotlight-cyan top-[500px] -right-40" />

      <Navbar />

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 text-center">
        {/* Title Header */}
        <div className="space-y-4 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/5 text-indigo-400 border border-indigo-500/20">
            📖 Core Architecture Guide
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            How <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400 font-black">SeedChain</span> Works
          </h1>
          <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
            SeedChain eliminates founder defaults and builds investor trust using smart contracts that lock project funds in escrows, released only when milestones are verified by backer consensus.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left max-w-4xl mx-auto">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="web3-card rounded-2xl p-6 relative overflow-hidden group hover:translate-y-[-2px] transition-all duration-300"
            >
              {/* Giant background step number */}
              <div className="absolute right-4 bottom-2 text-7xl font-black text-slate-900/40 select-none font-mono">
                {step.num}
              </div>

              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-2xl shadow-inner border border-indigo-500/15">
                  {step.icon}
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed relative z-10">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="pt-6">
          <div className="bg-[#090d16]/40 border border-slate-800 rounded-2xl p-8 max-w-2xl mx-auto space-y-6 backdrop-blur-md">
            <h3 className="text-xl font-bold text-white">Ready to explore active investment syndicates?</h3>
            <p className="text-sm text-slate-400">
              Browse campaign benchmarks, invest safely in milestone escrows, or launch your own project on the Stellar Testnet.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/campaigns"
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-bold rounded-xl shadow-lg transition-all hover:scale-[1.01]"
              >
                Explore Campaigns
              </Link>
              <Link
                href="/dashboard"
                className="px-6 py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-white text-xs font-bold rounded-xl transition-all hover:scale-[1.01]"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
