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
  const { address, walletId, network, isConnected, connect, disconnect, setNetwork } = useWalletStore();
  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    { href: '/activity', label: 'Live Activity' },
    { href: '/transactions', label: 'Tx Center' },
    { href: '/analytics', label: 'Analytics' },
    { href: '/settings', label: 'Settings' },
  ];

  if (!mounted) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-slate-900 dark:text-white">
            <span className="h-6 w-6 rounded-full bg-orange-600 flex items-center justify-center text-white text-xs">SC</span>
            <span>Seed<span className="text-orange-600">Chain</span></span>
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
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-100 text-orange-600 dark:bg-slate-800 dark:text-orange-500'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/50'
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
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 tracking-wide uppercase">
                {network}
              </span>
            </div>
          )}

          {/* Wallet Button */}
          {isConnected && address ? (
            <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-800 rounded-lg p-1 pr-3 bg-slate-50 dark:bg-slate-900">
              <div className="h-7 w-7 rounded-md bg-orange-100 dark:bg-orange-950 flex items-center justify-center text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase">
                {walletId ? walletId[0] : 'W'}
              </div>
              <span className="text-xs font-medium font-mono text-slate-600 dark:text-slate-300">
                {address.substring(0, 5)}...{address.substring(address.length - 4)}
              </span>
              <button
                onClick={disconnect}
                className="ml-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>

      {/* Connection Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white">Select Wallet</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-3">
              <button
                onClick={() => handleConnectWallet('freighter')}
                className="w-full flex items-center justify-between p-3.5 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-orange-100 dark:bg-orange-950 flex items-center justify-center text-lg">
                    🚢
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-orange-600 dark:group-hover:text-orange-400">
                      Freighter Wallet
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Stellar official extension
                    </div>
                  </div>
                </div>
                <span className="text-slate-300 group-hover:translate-x-1 transition-transform">→</span>
              </button>

              <button
                onClick={() => handleConnectWallet('albedo')}
                className="w-full flex items-center justify-between p-3.5 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-lg">
                    🌌
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-orange-600 dark:group-hover:text-orange-400">
                      Albedo
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Web-based browser key manager
                    </div>
                  </div>
                </div>
                <span className="text-slate-300 group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
