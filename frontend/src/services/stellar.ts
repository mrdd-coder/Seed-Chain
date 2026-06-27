import {
  rpc,
  Contract,
  TransactionBuilder,
  Networks,
  nativeToScVal,
  scValToNative,
  xdr,
  Address,
  Account,
} from '@stellar/stellar-sdk';
import { useTransactionStore } from '../state/transactions';

// Polling interval for transaction status
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 30;

export interface Milestone {
  id: number;
  description: string;
  amount_pct: number;
  status: 'Pending' | 'PayoutRequested' | 'Approved' | 'Paid';
}

export interface CampaignInfo {
  founder: string;
  token: string;
  goal: string;
  deadline: number;
  totalPledged: string;
  isClosed: boolean;
  refundActive: boolean;
  address: string;
}

/**
 * Fetch list of campaign addresses from registry contract
 */
export async function getCampaigns(rpcUrl: string, registryAddress: string): Promise<string[]> {
  const server = new rpc.Server(rpcUrl);
  const contract = new Contract(registryAddress);
  
  // Call registry method `get_campaigns`
  const tx = new TransactionBuilder(
    new Account('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', '0'),
    {
      fee: '100',
      networkPassphrase: Networks.TESTNET,
    }
  )
    .addOperation(contract.call('get_campaigns'))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationSuccess(sim)) {
    const resultVal = sim.result!.retval;
    const array = scValToNative(resultVal) as string[];
    return array.map((addr) => addr.toString());
  }
  return [];
}

/**
 * Fetch detailed campaign details
 */
export async function getCampaignInfo(rpcUrl: string, campaignAddress: string): Promise<CampaignInfo> {
  const server = new rpc.Server(rpcUrl);
  const contract = new Contract(campaignAddress);

  const tx = new TransactionBuilder(
    new Account('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', '0'),
    {
      fee: '100',
      networkPassphrase: Networks.TESTNET,
    }
  )
    .addOperation(contract.call('get_campaign_info'))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationSuccess(sim)) {
    const result = scValToNative(sim.result!.retval);
    // Returns (founder, token, goal, deadline, total_pledged, is_closed, refund_active)
    return {
      founder: result[0].toString(),
      token: result[1].toString(),
      goal: result[2].toString(),
      deadline: Number(result[3]),
      totalPledged: result[4].toString(),
      isClosed: Boolean(result[5]),
      refundActive: Boolean(result[6]),
      address: campaignAddress,
    };
  }
  throw new Error('Failed to fetch campaign info');
}

/**
 * Fetch campaign milestones
 */
export async function getCampaignMilestones(rpcUrl: string, campaignAddress: string): Promise<Milestone[]> {
  const server = new rpc.Server(rpcUrl);
  const contract = new Contract(campaignAddress);

  const tx = new TransactionBuilder(
    new Account('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', '0'),
    {
      fee: '100',
      networkPassphrase: Networks.TESTNET,
    }
  )
    .addOperation(contract.call('get_milestones'))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationSuccess(sim)) {
    const result = scValToNative(sim.result!.retval) as any[];
    // Maps milestone structs from Rust contract
    // Struct: { id, description, amount_pct, status }
    // Rust enum mapping: MilestoneStatus is returned as object with variant keys
    return result.map((m) => {
      let statusStr: 'Pending' | 'PayoutRequested' | 'Approved' | 'Paid' = 'Pending';
      if (m.status) {
        if (typeof m.status === 'string') {
          statusStr = m.status as any;
        } else if (typeof m.status === 'object') {
          // Soroban enum with values: e.g. { Pending: [] } or just the key
          statusStr = Object.keys(m.status)[0] as any;
        }
      }
      return {
        id: Number(m.id),
        description: m.description.toString(),
        amount_pct: Number(m.amount_pct),
        status: statusStr,
      };
    });
  }
  return [];
}

/**
 * Fetch voter pledge weight
 */
export async function getPledgeAmount(rpcUrl: string, campaignAddress: string, investorAddress: string): Promise<string> {
  const server = new rpc.Server(rpcUrl);
  const contract = new Contract(campaignAddress);

  const tx = new TransactionBuilder(
    new Account('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', '0'),
    {
      fee: '100',
      networkPassphrase: Networks.TESTNET,
    }
  )
    .addOperation(contract.call('get_pledge', nativeToScVal(Address.fromString(investorAddress))))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationSuccess(sim)) {
    return scValToNative(sim.result!.retval).toString();
  }
  return '0';
}

/**
 * Poll transaction status until confirmed or failed
 */
async function pollTransaction(server: rpc.Server, txHash: string, consoleLog: (m: string) => void): Promise<any> {
  let attempts = 0;
  while (attempts < MAX_POLL_ATTEMPTS) {
    attempts++;
    consoleLog(`Polling transaction status (Attempt ${attempts}/${MAX_POLL_ATTEMPTS})...`);
    const statusResponse = await server.getTransaction(txHash);

    if (statusResponse.status === rpc.Api.GetTransactionStatus.SUCCESS) {
      consoleLog('Transaction succeeded on-chain!');
      return statusResponse;
    } else if (statusResponse.status === rpc.Api.GetTransactionStatus.FAILED) {
      consoleLog(`Transaction failed on-chain: ${statusResponse.resultXdr}`);
      throw new Error(`Transaction failed: ${statusResponse.resultXdr}`);
    } else if (statusResponse.status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
      consoleLog('Transaction not found yet, polling...');
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  throw new Error('Transaction polling timed out.');
}

/**
 * Execute contract invocation lifecycle
 */
export async function executeContractCall(
  walletKit: any,
  rpcUrl: string,
  network: 'TESTNET' | 'LOCAL',
  userAddress: string,
  contractAddress: string,
  method: string,
  params: xdr.ScVal[],
  operationName: string,
  txStoreId: string
): Promise<string> {
  const server = new rpc.Server(rpcUrl);
  const contract = new Contract(contractAddress);
  const { updateTransaction, addConsoleLog } = useTransactionStore.getState();

  try {
    addConsoleLog(`Initiating: ${operationName}`);
    updateTransaction(txStoreId, { status: 'processing' });

    // 1. Fetch source account details
    addConsoleLog(`Fetching account details for ${userAddress}...`);
    const account = await server.getAccount(userAddress);

    // 2. Build preliminary transaction
    addConsoleLog('Building transaction...');
    const passphrase = network === 'TESTNET' ? Networks.TESTNET : Networks.STANDALONE;
    const tx = new TransactionBuilder(account, {
      fee: '1000',
      networkPassphrase: passphrase,
    })
      .addOperation(contract.call(method, ...params))
      .setTimeout(60)
      .build();

    // 3. Simulate transaction to find footprint/fees
    addConsoleLog('Simulating transaction on-chain...');
    const sim = await server.simulateTransaction(tx);
    
    if (rpc.Api.isSimulationError(sim)) {
      addConsoleLog(`Simulation failed: ${sim.error}`);
      throw new Error(`Simulation failed: ${sim.error}`);
    }

    // 4. Assemble transaction with simulation results
    addConsoleLog('Assembling transaction footprints and resources...');
    const assembledTx = (server as any).assembleTransaction(tx, sim);

    // 5. Sign transaction via Wallet Kit
    addConsoleLog('Requesting signature from wallet...');
    const { signedTxXdr } = await walletKit.signTransaction(assembledTx.toXDR(), {
      address: userAddress,
      networkPassphrase: passphrase,
    });

    // 6. Reconstruct signed transaction and submit
    addConsoleLog('Submitting transaction to Stellar network...');
    const signedTx = TransactionBuilder.fromXDR(signedTxXdr, passphrase);
    const submission = await server.sendTransaction(signedTx);

    if (submission.status === 'ERROR') {
      addConsoleLog(`Submission failed: ${submission.errorResult}`);
      throw new Error(`Submission failed: ${submission.errorResult}`);
    }

    const txHash = submission.hash;
    const explorer = `https://stellar.expert/explorer/testnet/tx/${txHash}`;
    addConsoleLog(`Submitted successfully. Hash: ${txHash}`);
    updateTransaction(txStoreId, { hash: txHash, explorerLink: explorer });

    // 7. Poll status
    await pollTransaction(server, txHash, addConsoleLog);

    updateTransaction(txStoreId, { status: 'success' });
    addConsoleLog(`Completed: ${operationName} succeeded!`);
    return txHash;

  } catch (error: any) {
    const errorMsg = error.message || 'Unknown error occurred';
    addConsoleLog(`Error in ${operationName}: ${errorMsg}`);
    updateTransaction(txStoreId, { status: 'failed', error: errorMsg });
    throw error;
  }
}
