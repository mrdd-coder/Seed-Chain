import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Dashboard from '../app/dashboard/page';
import { useWalletStore } from '../state/wallet';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

// Mock stellar-wallets-kit and submodules to prevent loading commonjs freighter-api
vi.mock('@creit.tech/stellar-wallets-kit', () => ({
  StellarWalletsKit: {
    init: vi.fn(),
    setWallet: vi.fn(),
    fetchAddress: vi.fn(),
    signTransaction: vi.fn(),
  },
  Networks: {
    TESTNET: 'TESTNET',
  },
}));

vi.mock('@creit.tech/stellar-wallets-kit/modules/freighter', () => ({
  FreighterModule: vi.fn(),
}));

vi.mock('@creit.tech/stellar-wallets-kit/modules/albedo', () => ({
  AlbedoModule: vi.fn(),
}));

describe('Personal Dashboard Component UI', () => {
  beforeEach(() => {
    // Connect the wallet by default
    useWalletStore.getState().connect('freighter', 'GFounderAddressExample123456789');
  });

  it('should render welcome back banner and connected address info', () => {
    render(<Dashboard />);
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByText(/Connected as GFound...6789/i)).toBeInTheDocument();
  });

  it('should render portfolio stats widgets', () => {
    render(<Dashboard />);
    expect(screen.getByText('Total Invested')).toBeInTheDocument();
    expect(screen.getByText('7,000 USDC')).toBeInTheDocument();
    expect(screen.getByText('Active Campaigns')).toBeInTheDocument();
    expect(screen.getByText('Pending Milestones')).toBeInTheDocument();
  });

  it('should render your active investments list', () => {
    render(<Dashboard />);
    expect(screen.getAllByText('SolarGrid Protocol')[0]).toBeInTheDocument();
    expect(screen.getAllByText('StellarPay Mobile')[0]).toBeInTheDocument();
    expect(screen.getByText('1 of 2 paid')).toBeInTheDocument();
    expect(screen.getByText('Payout requested')).toBeInTheDocument();
  });

  it('should render quick action buttons and links', () => {
    render(<Dashboard />);
    expect(screen.getByText('Explore Campaigns')).toBeInTheDocument();
    expect(screen.getByText('Launch a Campaign')).toBeInTheDocument();
    expect(screen.getAllByText('How It Works')[0]).toBeInTheDocument();
  });
});
