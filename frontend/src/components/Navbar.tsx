'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWalletStore, NetworkId } from '../state/wallet';
import { StellarWalletsKit, Networks } from '@creit.tech/stellar-wallets-kit';
import { FreighterModule } from '@creit.tech/stellar-wallets-kit/modules/freighter';
import SeedChainLogo from './SeedChainLogo';

export default function Navbar() {
  const pathname = usePathname();
  const { address, walletId, network, isConnected, xlmBalance, connect, disconnect, setNetwork, setXlmBalance } = useWalletStore();
  const [mounted, setMounted] = useState(false);
  const [connecting, setConnecting] = useState(false);

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
    // Initialize the StellarWalletsKit on mount with Freighter only
    StellarWalletsKit.init({
      network: Networks.TESTNET,
      modules: [
        new FreighterModule(),
      ],
    });
  }, []);

  const handleConnectWallet = async () => {
    try {
      setConnecting(true);
      StellarWalletsKit.setWallet('freighter');
      const { address: connectedAddress } = await StellarWalletsKit.fetchAddress();
      connect('freighter', connectedAddress);
    } catch (error) {
      console.error('Wallet connection failed:', error);
      alert('Failed to connect. Make sure the Freighter browser extension is installed.');
    } finally {
      setConnecting(false);
    }
  };

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/campaigns', label: 'Campaigns' },
    { href: '/transactions', label: 'Tx Center' },
    { href: '/settings', label: 'Settings' },
  ];

  if (!mounted) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/40 bg-slate-950/75 backdrop-blur-lg transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight text-white group">
            <SeedChainLogo size={34} className="shadow-lg shadow-indigo-500/15 group-hover:shadow-indigo-500/25 transition-shadow duration-300" />
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

        {/* Wallet Connection */}
        <div className="flex items-center gap-2.5">
          {isConnected && address ? (
            <>
              {/* Network indicator */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-500/5 border border-indigo-500/15">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                <span className="text-[10px] font-bold text-indigo-400 tracking-wider uppercase">
                  {network}
                </span>
              </div>

              {/* Wallet info pill */}
              <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2">
                <div className="h-6 w-6 rounded-md bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400">
                    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold font-mono text-slate-300">
                  {address.substring(0, 4)}...{address.substring(address.length - 4)}
                </span>
                <span className="text-[11px] font-bold text-indigo-400 bg-indigo-950/50 px-2 py-0.5 rounded-md border border-indigo-900/30">
                  {xlmBalance !== null ? `${xlmBalance} XLM` : '...'}
                </span>
              </div>

              {/* Disconnect */}
              <button
                onClick={disconnect}
                className="px-3 py-2 text-xs font-bold text-slate-400 hover:text-red-400 bg-slate-950/60 border border-slate-800 hover:border-red-500/30 rounded-xl transition-all cursor-pointer"
              >
                ✕
              </button>
            </>
          ) : (
            <button
              onClick={handleConnectWallet}
              disabled={connecting}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-60"
            >
              {connecting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Connecting...
                </span>
              ) : (
                'Connect Freighter'
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
