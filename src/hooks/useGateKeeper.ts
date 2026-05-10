import { useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { AnchorProvider } from '@coral-xyz/anchor';
import { GateKeeperSDK } from '@/lib/gatekeeper';

/**
 * Hook to create a GateKeeperSDK instance connected to the current wallet.
 * Returns null if wallet is not connected.
 */
export function useGateKeeper(): GateKeeperSDK | null {
  const { connection } = useConnection();
  const { publicKey, signTransaction, signAllTransactions } = useWallet();

  const sdk = useMemo(() => {
    if (!publicKey || !signTransaction || !signAllTransactions) return null;

    const provider = new AnchorProvider(
      connection,
      { publicKey, signTransaction, signAllTransactions } as any,
      { commitment: 'confirmed' }
    );

    return new GateKeeperSDK(provider);
  }, [connection, publicKey, signTransaction, signAllTransactions]);

  return sdk;
}
