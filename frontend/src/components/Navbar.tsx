'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWalletStore, NetworkId } from '../state/wallet';
import { StellarWalletsKit, Networks } from '@creit.tech/stellar-wallets-kit';
import { FreighterModule } from '@creit.tech/stellar-wallets-kit/modules/freighter';
import { AlbedoModule } from '@creit.tech/stellar-wallets-kit/modules/albedo';

export default function Navbar() {
  const pathname = usePathname();
  const { address, walletId, network, isConnected, xlmBalance, connect, disconnect, setNetwork, setXlmBalance } = useWalletStore();
  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch XLM balance from Horizon Testnet
  const fetchBalance = async (addr: string) => {
    try {
      const res = await fetch(`https://horizon-testnet.stellar.org/accounts/${addr}`);
      if (res.ok) {
        const data = await res.json();
        const nativeBalance = data.balances.find((b: any) => b.asset_type === 'native');
        if (nativeBalance) {
          setXlmBalance(Number(nativeBalance.balance).toFixed(2));
        }
      } else {
        setXlmBalance('0.00');
      }
    } catch (error) {
      console.error('Failed to fetch XLM balance:', error);
      setXlmBalance('0.00');
    }
  };

  // Poll balance when connected
  useEffect(() => {
    if (isConnected && address) {
      fetchBalance(address);
      const interval = setInterval(() => {
        fetchBalance(address);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [isConnected, address]);

  // Avoid hydration mismatch by checking mounting state
  useEffect(() => {
    setMounted(true);
    // Initialize the StellarWalletsKit on mount
    StellarWalletsKit.init({
      network: Networks.TESTNET,
      modules: [
        new FreighterModule(),
        new AlbedoModule(),
      ],
    });
  }, []);

  const handleConnectWallet = async (selectedWallet: 'freighter' | 'albedo') => {
    try {
      // Set the active wallet module
      StellarWalletsKit.setWallet(selectedWallet);
      
      // Fetch the address from the wallet extension
      const { address: connectedAddress } = await StellarWalletsKit.fetchAddress();
      
      connect(selectedWallet, connectedAddress);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Wallet connection failed:', error);
      alert('Failed to connect wallet. Ensure Freighter or Albedo is installed.');
    }
  };

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/campaigns', label: 'Campaigns' },
    { href: '/activity', label: 'Live Activity' },
    { href: '/transactions', label: 'Tx Center' },
    { href: '/analytics', label: 'Analytics' },
    { href: '/settings', label: 'Settings' },
    { href: '/how-it-works', label: 'How It Works' },
  ];

  if (!mounted) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/40 bg-slate-950/75 backdrop-blur-lg transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-white">
            <span className="h-7 w-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-black shadow-md shadow-indigo-500/10">SC</span>
            <span>Seed<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400 font-extrabold">Chain</span></span>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex space-x-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Controls & Wallet Connection */}
        <div className="flex items-center gap-3">
          {/* Network Badge */}
          {isConnected && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/5 border border-indigo-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
              <span className="text-[10px] font-bold text-indigo-400 tracking-wider uppercase">
                {network}
              </span>
            </div>
          )}

          {/* Wallet Button */}
          {isConnected && address ? (
            <div className="flex items-center gap-2 border border-slate-800 rounded-xl p-1 pr-3 bg-slate-950/60">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center text-xs font-bold text-indigo-400 uppercase">
                {walletId ? walletId[0] : 'W'}
              </div>
              <span className="text-xs font-semibold font-mono text-slate-300">
                {address.substring(0, 5)}...{address.substring(address.length - 4)}
              </span>
              <span className="text-xs font-bold text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded-lg border border-indigo-900/40">
                {xlmBalance !== null ? `${xlmBalance} XLM` : '... XLM'}
              </span>
              <button
                onClick={disconnect}
                className="ml-2 text-xs font-bold text-red-400 hover:text-red-300 hover:underline cursor-pointer"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>

      {/* Connection Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-extrabold text-white text-sm">Select Stellar Wallet</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-3">
              <button
                onClick={() => handleConnectWallet('freighter')}
                className="w-full flex items-center justify-between p-3.5 border border-slate-800 rounded-xl hover:bg-slate-800/40 hover:border-indigo-500/30 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-lg shadow-inner">
                    🚢
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-200 group-hover:text-indigo-400 transition-colors">
                      Freighter Wallet
                    </div>
                    <div className="text-xs text-slate-500">
                      Stellar official extension
                    </div>
                  </div>
                </div>
                <span className="text-slate-500 group-hover:translate-x-1 transition-all">→</span>
              </button>

              <button
                onClick={() => handleConnectWallet('albedo')}
                className="w-full flex items-center justify-between p-3.5 border border-slate-800 rounded-xl hover:bg-slate-800/40 hover:border-indigo-500/30 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-cyan-500/10 flex items-center justify-center text-lg shadow-inner">
                    🌌
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-200 group-hover:text-cyan-400 transition-colors">
                      Albedo
                    </div>
                    <div className="text-xs text-slate-500">
                      Web-based browser key manager
                    </div>
                  </div>
                </div>
                <span className="text-slate-500 group-hover:translate-x-1 transition-all">→</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
