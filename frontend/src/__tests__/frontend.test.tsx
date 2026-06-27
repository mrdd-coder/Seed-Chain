import { describe, it, expect, beforeEach } from 'vitest';
import { useWalletStore, NetworkId } from '../state/wallet';
import { useTransactionStore } from '../state/transactions';

describe('Zustand Wallet Store', () => {
  beforeEach(() => {
    useWalletStore.getState().disconnect();
    useWalletStore.getState().setNetwork(NetworkId.TESTNET);
  });

  it('should initialize with disconnected state', () => {
    const state = useWalletStore.getState();
    expect(state.isConnected).toBe(false);
    expect(state.address).toBeNull();
    expect(state.walletId).toBeNull();
  });

  it('should connect user address and persist wallet type', () => {
    const store = useWalletStore.getState();
    store.connect('freighter', 'GD1234567890FreighterTestAddress');
    
    const updatedState = useWalletStore.getState();
    expect(updatedState.isConnected).toBe(true);
    expect(updatedState.address).toBe('GD1234567890FreighterTestAddress');
    expect(updatedState.walletId).toBe('freighter');
  });

  it('should handle disconnection cleanup', () => {
    const store = useWalletStore.getState();
    store.connect('albedo', 'GD9876543210AlbedoTestAddress');
    store.disconnect();

    const updatedState = useWalletStore.getState();
    expect(updatedState.isConnected).toBe(false);
    expect(updatedState.address).toBeNull();
  });
});

describe('Zustand Transaction Store', () => {
  beforeEach(() => {
    useTransactionStore.getState().clearHistory();
  });

  it('should register a new pending transaction', () => {
    const store = useTransactionStore.getState();
    store.addTransaction({
      id: 'tx-test-1',
      operation: 'Pledge 500 USDC',
      status: 'pending',
    });

    const list = useTransactionStore.getState().transactions;
    expect(list.length).toBe(1);
    expect(list[0].id).toBe('tx-test-1');
    expect(list[0].status).toBe('pending');
    expect(list[0].hash).toBeNull();
  });

  it('should update transaction status and store hashes', () => {
    const store = useTransactionStore.getState();
    store.addTransaction({
      id: 'tx-test-2',
      operation: 'Vote Milestone 1',
      status: 'pending',
    });

    store.updateTransaction('tx-test-2', {
      status: 'success',
      hash: '0xhash12345',
      explorerLink: 'https://stellar.expert/explorer/testnet/tx/0xhash12345',
    });

    const list = useTransactionStore.getState().transactions;
    expect(list[0].status).toBe('success');
    expect(list[0].hash).toBe('0xhash12345');
    expect(list[0].explorerLink).toContain('stellar.expert');
  });
});
