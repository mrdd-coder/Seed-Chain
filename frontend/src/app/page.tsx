import React from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';

export default function Home() {
  const stats = [
    { value: '$12.4M', label: 'Total Value Locked (TVL)' },
    { value: '42', label: 'Active Syndicate Campaigns' },
    { value: '98.2%', label: 'Milestone Completion Rate' },
    { value: '14.5K', label: 'Active Web3 Investors' },
  ];

  const features = [
    {
      icon: '🛡️',
      title: 'Milestone Escrow Assurance',
      description: 'Investor funds are locked in smart contracts and only released incrementally upon verifiable milestone deliveries.',
    },
    {
      icon: '🗳️',
      title: 'Decentralized Governance Voting',
      description: 'Syndicate members vote on-chain with weights proportional to their pledge size to approve or reject payouts.',
    },
    {
      icon: '⚡',
      title: 'Built on Stellar & Soroban',
      description: 'Leverage fast settlement times, sub-cent transaction fees, and advanced WASM smart contract security.',
    },
  ];

  const featuredCampaigns = [
    {
      title: 'SolarGrid Protocol',
      category: 'CleanTech',
      description: 'Decentralized micro-grid energy sharing on Stellar, providing tokenized clean energy assets to developing regions.',
      raised: '75,000',
      goal: '100,000',
      progress: 75,
      milestones: '3 of 4 completed',
      badgeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    },
    {
      title: 'StellarPay Mobile',
      category: 'Fintech',
      description: 'A mobile POS system utilizing SEP-24 anchors to enable instant retail payments in local fiat stablecoins.',
      raised: '120,000',
      goal: '150,000',
      progress: 80,
      milestones: '1 of 3 completed',
      badgeColor: 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900',
    },
    {
      title: 'AeroDrone Logistics',
      category: 'DeepTech',
      description: 'Milestone-based supply chain delivery networks governed by decentralized drone navigation validation.',
      raised: '30,000',
      goal: '200,000',
      progress: 15,
      milestones: '0 of 5 completed',
      badgeColor: 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900',
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#030712] text-slate-200 transition-colors overflow-hidden">
      {/* Ambient spotlights */}
      <div className="spotlight-purple -top-40 -left-40" />
      <div className="spotlight-cyan top-[500px] -right-40" />

      <Navbar />

      {/* Hero Section */}
      <section className="relative py-20 lg:py-28 overflow-hidden z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">

          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-none max-w-4xl mx-auto">
            Decentralized Startup Funding with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">On-Chain Escrows</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto font-medium">
            SeedChain eliminates founder defaults and builds investor trust. Raise capital from global syndicates with funds gated by milestone approval voting.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/dashboard"
              className="px-6 py-3.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              Explore Campaigns
            </Link>
            <Link
              href="/how-it-works"
              className="px-6 py-3.5 bg-slate-950 hover:bg-slate-900 text-white border border-slate-800 rounded-xl font-bold transition-all hover:scale-[1.01] flex items-center gap-2"
            >
              <span>🎥</span> Watch Walkthrough
            </Link>
            <Link
              href="/dashboard?tab=create"
              className="px-6 py-3.5 bg-slate-950 hover:bg-slate-900 text-white border border-slate-800 rounded-xl font-bold transition-all hover:scale-[1.01]"
            >
              Launch Your Campaign
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 border-t border-b border-slate-800/60 bg-slate-950/40 backdrop-blur-md py-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {stats.map((stat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="text-3xl sm:text-4xl font-extrabold text-white">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm font-medium text-slate-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              A Safer Framework for Venture Crowdfunding
            </h2>
            <p className="mt-4 text-slate-400">
              Unlike traditional platforms where founders receive 100% of funds upfront, SeedChain secures and releases capital in blocks only after progress is validated.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="web3-card rounded-2xl p-6"
              >
                <div className="h-12 w-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-2xl mb-5 shadow-inner">
                  {feature.icon}
                </div>
                <h3 className="font-bold text-lg text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="relative z-10 py-16 bg-slate-950/10 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                Featured Syndicate Campaigns
              </h2>
              <p className="mt-2 text-slate-400">
                Support transparent, milestone-gated Web3 initiatives building real utility.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="hidden sm:inline-block text-sm font-bold text-indigo-400 hover:text-indigo-300"
            >
              View all campaigns →
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {featuredCampaigns.map((project, idx) => (
              <div
                key={idx}
                className="web3-card rounded-2xl overflow-hidden flex flex-col"
              >
                <div className="p-6 flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold tracking-wider uppercase bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-md text-slate-400">
                      {project.category}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${project.badgeColor}`}>
                      {project.milestones}
                    </span>
                  </div>
                  <h3 className="font-bold text-xl text-white mb-2">
                    {project.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed mb-6">
                    {project.description}
                  </p>
                  
                  {/* Progress Tracker */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-400">Progress</span>
                      <span className="text-white">
                        {project.progress}% ({project.raised} / {project.goal} USDC)
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 border border-slate-850 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-violet-600 h-full rounded-full transition-all"
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800/50 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Escrow Managed</span>
                  <Link
                    href={`/dashboard?campaign=${project.title}`}
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 hover:underline"
                  >
                    Invest Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-12 text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="font-bold text-white text-lg">
            Seed<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400 font-extrabold">Chain</span>
          </div>
          <p className="text-sm max-w-md mx-auto text-slate-400">
            A decentralized investment platform with milestone-based escrows. Secure, transparent crowdfunding for modern startups.
          </p>
          <div className="text-xs text-slate-600">
            &copy; {new Date().getFullYear()} SeedChain Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
