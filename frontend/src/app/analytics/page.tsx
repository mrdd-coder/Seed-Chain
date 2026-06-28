'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

export default function Analytics() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const tvlGrowthData = [
    { month: 'Jan', TVL: 1200000 },
    { month: 'Feb', TVL: 2100000 },
    { month: 'Mar', TVL: 4500000 },
    { month: 'Apr', TVL: 6200000 },
    { month: 'May', TVL: 9800000 },
    { month: 'Jun', TVL: 12400000 },
  ];

  const categoryDistribution = [
    { category: 'CleanTech', Campaigns: 12, Pledged: 4500000 },
    { category: 'Fintech', Campaigns: 18, Pledged: 5800000 },
    { category: 'DeepTech', Campaigns: 6, Pledged: 1200000 },
    { category: 'AI/ML', Campaigns: 4, Pledged: 700000 },
    { category: 'Biotech', Campaigns: 2, Pledged: 200000 },
  ];

  const syndicateStats = [
    { label: 'Syndicate TVL', value: '$12,400,000', change: '+24.5% vs last month' },
    { label: 'Average Investment', value: '4,250 USDC', change: '+12.1% growth rate' },
    { label: 'Voter Turnout', value: '78.5%', change: '+3.4% participation' },
    { label: 'Milestones Passed', value: '112 / 114', change: '98.24% success rate' },
  ];

  return (
    <div className="relative min-h-screen bg-[#030712] text-slate-200 transition-colors overflow-hidden">
      {/* Ambient spotlights */}
      <div className="spotlight-purple -top-40 -left-40" />
      <div className="spotlight-cyan top-[500px] -right-40" />

      <Navbar />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        
        {/* Title */}
        <div>
          <h1 className="text-3xl font-extrabold text-white">Platform Analytics</h1>
          <p className="text-sm text-slate-400 mt-1">
            Global performance metrics, venture category allocation, and milestone governance statistics.
          </p>
        </div>

        {/* Global Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {syndicateStats.map((stat, idx) => (
            <div
              key={idx}
              className="web3-card rounded-2xl p-5 space-y-2 text-left"
            >
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</div>
              <div className="text-2xl sm:text-3xl font-black text-white">{stat.value}</div>
              <div className="text-[10px] font-semibold text-indigo-400">{stat.change}</div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        {mounted ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* TVL Growth Line Chart */}
            <div className="web3-card rounded-2xl p-6 space-y-4">
              <div className="text-left">
                <h3 className="font-bold text-lg text-white">Syndicate TVL Growth (USDC)</h3>
                <p className="text-xs text-slate-400">Monthly cumulative value locked inside milestone escrows</p>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={tvlGrowthData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip
                      contentStyle={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                      formatter={(value: any) => [`$${value.toLocaleString()} USDC`, 'TVL']}
                    />
                    <Line type="monotone" dataKey="TVL" stroke="#6366f1" strokeWidth={3} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Distribution Bar Chart */}
            <div className="web3-card rounded-2xl p-6 space-y-4">
              <div className="text-left">
                <h3 className="font-bold text-lg text-white">Campaign Funds Allocation</h3>
                <p className="text-xs text-slate-400">Total pledge amounts distributed across industry sectors</p>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryDistribution} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                    <XAxis dataKey="category" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip
                      contentStyle={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                      formatter={(value: any) => [`$${value.toLocaleString()} USDC`, 'Total Pledged']}
                    />
                    <Bar dataKey="Pledged" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        ) : (
          <div className="py-20 text-center text-slate-500">Initializing analytics engine...</div>
        )}

        {/* Governance Metrics Summary */}
        <div className="web3-card rounded-2xl p-6 text-left space-y-4">
          <h3 className="font-bold text-lg text-white">Escrow Audit Log</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm text-slate-355">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase text-[10px] tracking-wider text-left">
                  <th className="pb-3">Project Title</th>
                  <th className="pb-3">Milestone Code</th>
                  <th className="pb-3">Approval Ratio</th>
                  <th className="pb-3">Disbursed Amt</th>
                  <th className="pb-3">Release Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                <tr className="hover:bg-slate-950/40">
                  <td className="py-3 font-semibold text-slate-200">SolarGrid Protocol</td>
                  <td className="py-3 text-slate-400">MS-1: Hardware Delivery</td>
                  <td className="py-3 font-mono text-indigo-400">84.5% Approval (Passed)</td>
                  <td className="py-3 text-slate-300">14,000 USDC</td>
                  <td className="py-3 text-slate-500">June 25, 2026</td>
                </tr>
                <tr className="hover:bg-slate-950/40">
                  <td className="py-3 font-semibold text-slate-200">SolarGrid Protocol</td>
                  <td className="py-3 text-slate-400">MS-2: Local Grid Deploy</td>
                  <td className="py-3 font-mono text-indigo-400">92.0% Approval (Passed)</td>
                  <td className="py-3 text-slate-300">21,000 USDC</td>
                  <td className="py-3 text-slate-500">June 18, 2026</td>
                </tr>
                <tr className="hover:bg-slate-950/40">
                  <td className="py-3 font-semibold text-slate-200">StellarPay Mobile</td>
                  <td className="py-3 text-slate-400">MS-1: Wallet SDK Setup</td>
                  <td className="py-3 font-mono text-indigo-400">76.3% Approval (Passed)</td>
                  <td className="py-3 text-slate-300">30,000 USDC</td>
                  <td className="py-3 text-slate-500">June 02, 2026</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
