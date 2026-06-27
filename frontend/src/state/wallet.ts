import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export enum NetworkId {
  TESTNET = 'TESTNET',
  LOCAL = 'LOCAL',
}

interface WalletState {
  address: string | null;
  walletId: string | null;
  network: NetworkId;
  isConnected: boolean;
  rpcUrl: string;
  connect: (walletId: string, address: string) => void;
  disconnect: () => void;
  setNetwork: (network: NetworkId) => void;
  setRpcUrl: (rpcUrl: string) => void;
}

const DEFAULT_RPC_TESTNET = 'https://soroban-testnet.stellar.org';
const DEFAULT_RPC_LOCAL = 'http://localhost:8000';

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      address: null,
      walletId: null,
      network: NetworkId.TESTNET,
      isConnected: false,
      rpcUrl: DEFAULT_RPC_TESTNET,
      connect: (walletId, address) => set({ walletId, address, isConnected: true }),
      disconnect: () => set({ walletId: null, address: null, isConnected: false }),
      setNetwork: (network) => set((state) => ({
        network,
        rpcUrl: network === NetworkId.TESTNET ? DEFAULT_RPC_TESTNET : DEFAULT_RPC_LOCAL,
      })),
      setRpcUrl: (rpcUrl) => set({ rpcUrl }),
    }),
    {
      name: 'seedchain-wallet-session',
    }
  )
);
