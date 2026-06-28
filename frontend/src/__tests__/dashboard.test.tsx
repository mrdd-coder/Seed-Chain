import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Dashboard from '../app/dashboard/page';
import { useWalletStore } from '../state/wallet';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

// Mock @stellar/stellar-sdk and other services to avoid actual API calls
vi.mock('@stellar/stellar-sdk', () => ({
  nativeToScVal: vi.fn(),
  Address: {
    fromString: vi.fn(),
  },
  xdr: {
    ScVal: {
      scvVec: vi.fn(),
      scvMap: vi.fn(),
      scvSymbol: vi.fn(),
      scvString: vi.fn(),
      scvU32: vi.fn(),
    },
    ScMapEntry: vi.fn(),
  },
  Account: vi.fn(),
  rpc: {
    Server: function() {
      return {
        getLedgers: vi.fn(),
      };
    },
  },
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

describe('Dashboard Component UI', () => {
  beforeEach(() => {
    // Connect the wallet by default for interactive controls testing
    useWalletStore.getState().connect('freighter', 'GFounderAddressExample123456789');
  });

  it('should render simplified UI by default', () => {
    render(<Dashboard />);
    
    // The main tabs should be present
    expect(screen.getByText('Browse Campaigns')).toBeInTheDocument();
    expect(screen.getByText('Launch Campaign')).toBeInTheDocument();
    
    // Advanced developer settings should be collapsed and invisible by default
    expect(screen.queryByPlaceholderText('Registry Address')).not.toBeInTheDocument();
  });

  it('should show Registry Address inputs when Advanced Settings toggle is clicked', async () => {
    render(<Dashboard />);
    
    const toggleButton = screen.getByText(/Advanced Developer Settings/i);
    expect(toggleButton).toBeInTheDocument();
    
    // Click toggle to expand
    fireEvent.click(toggleButton);
    
    // Now Registry Address input and Reload button should be visible
    expect(screen.getByPlaceholderText('Registry Address')).toBeInTheDocument();
    expect(screen.getByText('Reload')).toBeInTheDocument();
    
    // Click toggle again to collapse
    fireEvent.click(toggleButton);
    expect(screen.queryByPlaceholderText('Registry Address')).not.toBeInTheDocument();
  });

  it('should simplify Campaign Launch Form and support Advanced settings collapsible toggle', () => {
    render(<Dashboard />);
    
    const launchTabButton = screen.getByText('Launch Campaign');
    fireEvent.click(launchTabButton);
    
    // Goal should be visible directly
    expect(screen.getByText('Funding Goal (USDC)')).toBeInTheDocument();
    
    // Salt, Deadline, Asset Address should be hidden by default
    expect(screen.queryByText('Unique Deployment Salt')).not.toBeInTheDocument();
    expect(screen.queryByText('Deadline (Ledgers, e.g. 10000)')).not.toBeInTheDocument();
    
    // Find and click the advanced toggle inside campaign form
    const formAdvancedToggle = screen.getByText(/Advanced Settings \(optional\)/i);
    fireEvent.click(formAdvancedToggle);
    
    // Now they should be visible
    expect(screen.getByText('Unique Deployment Salt')).toBeInTheDocument();
    expect(screen.getByText('Deadline (Ledgers, e.g. 10000)')).toBeInTheDocument();
    expect(screen.getByText('Payment Asset Address')).toBeInTheDocument();
    
    // Submit button should have simplified text
    expect(screen.getByRole('button', { name: /Launch Project Campaign/i })).toBeInTheDocument();
  });
});
