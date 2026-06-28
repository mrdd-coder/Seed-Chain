import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Campaigns from '../app/campaigns/page';
import { useWalletStore } from '../state/wallet';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/campaigns',
}));

// Mock @stellar/stellar-sdk and other services to avoid actual API calls
vi.mock('@stellar/stellar-sdk', () => ({
  nativeToScVal: vi.fn(),
  Address: {
    fromString: vi.fn(),
  },
  Contract: function() {
    return {
      call: vi.fn(),
    };
  },
  TransactionBuilder: function() {
    return {
      addOperation: vi.fn().mockReturnThis(),
      setTimeout: vi.fn().mockReturnThis(),
      build: vi.fn().mockReturnValue({}),
    };
  },
  Networks: {
    TESTNET: 'TESTNET',
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
        simulateTransaction: vi.fn().mockRejectedValue(new Error("Simulated network failure")),
      };
    },
    Api: {
      isSimulationSuccess: vi.fn().mockReturnValue(false),
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

describe('Campaigns Component UI', () => {
  beforeEach(() => {
    // Connect the wallet by default for interactive controls testing
    useWalletStore.getState().connect('freighter', 'GFounderAddressExample123456789');
    window.alert = vi.fn();
  });

  it('should render simplified UI by default', () => {
    render(<Campaigns />);
    
    // The main tabs should be present
    expect(screen.getByText('Browse Campaigns')).toBeInTheDocument();
    expect(screen.getByText('Launch Campaign')).toBeInTheDocument();
  });

  it('should simplify Campaign Launch Form and support Advanced settings collapsible toggle', () => {
    render(<Campaigns />);
    
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

  it('should render Request Payout button for pending milestones if user is founder/sandbox', async () => {
    render(<Campaigns />);
    
    // Select SolarGrid Protocol to open its details (wait for it to load from simulator fallback)
    const campaignCard = await screen.findByText('SolarGrid Protocol');
    fireEvent.click(campaignCard);
    
    // SolarGrid has Milestone 2 as Pending (since Milestone 1 is Paid)
    // Because it is a simulated campaign, the user should be treated as a founder and see "Request Payout"
    const requestButtons = await screen.findAllByRole('button', { name: /Request Payout/i });
    expect(requestButtons.length).toBeGreaterThan(0);
  });
});
