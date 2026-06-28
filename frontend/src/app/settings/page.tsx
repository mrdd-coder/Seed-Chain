'use client';

import React, { useState } from 'react';
import Navbar from '../../components/Navbar';
import { useWalletStore, NetworkId } from '../../state/wallet';
import { useTransactionStore } from '../../state/transactions';

export default function Settings() {
  const { network, rpcUrl, setNetwork, setRpcUrl, isConnected, address, walletId } = useWalletStore();
  const { addConsoleLog } = useTransactionStore();

  const [customRpc, setCustomRpc] = useState(rpcUrl);
  const [gasLimit, setGasLimit] = useState('1000000'); // mock gas
  
  // Developer Registry Settings
  const [registryAddress, setRegistryAddress] = useState('CBRegistryAddressExample1234567890Testnet');
  const [showAdvancedRegistry, setShowAdvancedRegistry] = useState(true);

  const handleNetworkChange = (netId: NetworkId) => {
    setNetwork(netId);
    setCustomRpc(netId === NetworkId.TESTNET ? 'https://soroban-testnet.stellar.org' : 'http://localhost:8000');
    addConsoleLog(`[SETTINGS] Network switched to: ${netId}`);
  };

  const handleSaveRpc = (e: React.FormEvent) => {
    e.preventDefault();
    setRpcUrl(customRpc);
    addConsoleLog(`[SETTINGS] Updated RPC URL: ${customRpc}`);
    alert('RPC configuration successfully updated!');
  };

  const handleSaveRegistry = (e: React.FormEvent) => {
    e.preventDefault();
    addConsoleLog(`[SETTINGS] Updated Syndicate Registry Contract Address: ${registryAddress}`);
    alert('Syndicate Registry address successfully updated!');
  };

  return (
    <div className="relative min-h-screen bg-[#030712] text-slate-200 transition-colors overflow-hidden">
      {/* Ambient spotlights */}
      <div className="spotlight-purple -top-40 -left-40" />
      <div className="spotlight-cyan top-[500px] -right-40" />

      <Navbar />

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Settings</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your network connections, wallet preferences, and global contract registries.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Navigation panel */}
          <div className="md:col-span-1 space-y-1">
            <button className="w-full text-left px-3 py-2 bg-indigo-500/10 border border-indigo-500/25 text-xs sm:text-sm font-bold text-indigo-400 rounded-lg shadow-sm">
              🌐 Network & RPC
            </button>
            <button
              onClick={() => alert('Feature mock-implemented. Session storage cleared.')}
              className="w-full text-left px-3 py-2 text-xs sm:text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-900/40 rounded-lg transition-colors"
            >
              🧹 Clear Data Cache
            </button>
          </div>

          {/* Configuration Forms */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Wallet Info Panel */}
            <div className="web3-card rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-lg text-white">Connected Wallet</h3>
              {isConnected && address ? (
                <div className="space-y-2 text-left">
                  <div className="grid grid-cols-3 text-xs">
                    <span className="text-slate-400 font-bold">Provider:</span>
                    <span className="col-span-2 font-semibold text-slate-200 capitalize">{walletId}</span>
                  </div>
                  <div className="grid grid-cols-3 text-xs">
                    <span className="text-slate-400 font-bold">Address:</span>
                    <span className="col-span-2 font-mono text-slate-200 break-all">{address}</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 text-left">No wallet connected. Use the top navbar to connect Freighter or Albedo.</div>
              )}
            </div>

            {/* Advanced Syndicate Registry Settings */}
            <div className="web3-card rounded-2xl p-6 space-y-6">
              <h3 className="font-bold text-lg text-white">Advanced Developer Settings</h3>
              <form onSubmit={handleSaveRegistry} className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Syndicate Registry Contract Address</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={registryAddress}
                      onChange={(e) => setRegistryAddress(e.target.value)}
                      className="bg-black/40 border border-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 w-full font-mono text-slate-200"
                      required
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold rounded-xl text-xs tracking-wide transition-all cursor-pointer whitespace-nowrap"
                    >
                      Update Registry
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Network Switching Form */}
            <div className="web3-card rounded-2xl p-6 space-y-6">
              <h3 className="font-bold text-lg text-white">Active Network</h3>
              
              <div className="flex gap-4">
                <button
                  onClick={() => handleNetworkChange(NetworkId.TESTNET)}
                  className={`flex-1 p-4 border rounded-xl font-bold text-sm text-center transition-all cursor-pointer ${
                    network === NetworkId.TESTNET
                      ? 'border-indigo-500/40 bg-indigo-500/5 text-indigo-400'
                      : 'border-slate-800 text-slate-500 hover:bg-slate-900/40'
                  }`}
                >
                  Stellar Testnet
                </button>

                <button
                  onClick={() => handleNetworkChange(NetworkId.LOCAL)}
                  className={`flex-1 p-4 border rounded-xl font-bold text-sm text-center transition-all cursor-pointer ${
                    network === NetworkId.LOCAL
                      ? 'border-indigo-500/40 bg-indigo-500/5 text-indigo-400'
                      : 'border-slate-800 text-slate-500 hover:bg-slate-900/40'
                  }`}
                >
                  Local Standalone
                </button>
              </div>

              {/* Custom RPC form */}
              <form onSubmit={handleSaveRpc} className="space-y-4 pt-4 border-t border-slate-800 text-left">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">RPC Server Endpoint</label>
                  <input
                    type="url"
                    value={customRpc}
                    onChange={(e) => setCustomRpc(e.target.value)}
                    className="bg-black/40 border border-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 w-full font-mono text-slate-200"
                    required
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Simulated Resource Fee Limit (Stroops)</label>
                  <input
                    type="number"
                    value={gasLimit}
                    onChange={(e) => setGasLimit(e.target.value)}
                    className="bg-black/40 border border-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 w-full font-mono text-slate-200"
                  />
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold rounded-xl text-xs tracking-wide transition-all cursor-pointer"
                >
                  Save RPC Settings
                </button>
              </form>
            </div>

            {/* Platform Details Panel */}
            <div className="web3-card rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-lg text-white">Syndicate Parameters</h3>
              <div className="space-y-2 text-xs text-left">
                <div className="grid grid-cols-3">
                  <span className="text-slate-400 font-bold">Platform Fee:</span>
                  <span className="col-span-2 font-semibold">2.00% (escrow audit fee)</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-slate-400 font-bold">Audit Address:</span>
                  <span className="col-span-2 font-mono break-all text-slate-400">GTreasuryWalletAddressExample123456</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-slate-400 font-bold">WASM Upgrade Mode:</span>
                  <span className="col-span-2 font-semibold text-indigo-400">Deterministic Multi-Sig Factory (V1.2.0)</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
