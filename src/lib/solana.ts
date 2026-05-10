import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
  getAccount,
} from '@solana/spl-token';

// Devnet USDC mint (use the real USDC mint for mainnet)
// For devnet testing, we use a known USDC-dev mint
export const USDC_MINT = new PublicKey(
  'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr' // Devnet USDC
);

export const USDC_DECIMALS = 6;

/**
 * Get USDC balance for a wallet
 */
export async function getUsdcBalance(
  connection: Connection,
  wallet: PublicKey
): Promise<number> {
  try {
    const ata = await getAssociatedTokenAddress(USDC_MINT, wallet);
    const account = await getAccount(connection, ata);
    return Number(account.amount);
  } catch {
    return 0;
  }
}

/**
 * Get SOL balance for a wallet
 */
export async function getSolBalance(
  connection: Connection,
  wallet: PublicKey
): Promise<number> {
  try {
    const balance = await connection.getBalance(wallet);
    return balance / LAMPORTS_PER_SOL;
  } catch {
    return 0;
  }
}

/**
 * Create a USDC transfer transaction from reader to author.
 * This simulates what the on-chain program would validate via CPI.
 * In production, this would be wrapped in a program instruction
 * that atomically validates payment and records access on-chain.
 */
export async function createUnlockTransaction(
  connection: Connection,
  reader: PublicKey,
  author: PublicKey,
  amountLamports: number
): Promise<Transaction> {
  const readerAta = await getAssociatedTokenAddress(USDC_MINT, reader);
  const authorAta = await getAssociatedTokenAddress(USDC_MINT, author);

  const tx = new Transaction();

  // SPL Token transfer (simulates CPI in native program)
  const transferIx = createTransferInstruction(
    readerAta,
    authorAta,
    reader,
    amountLamports,
    [],
    TOKEN_PROGRAM_ID
  );

  tx.add(transferIx);

  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = reader;

  return tx;
}

/**
 * Shorten a public key for display
 */
export function shortenPubkey(pubkey: string, chars = 4): string {
  return `${pubkey.slice(0, chars)}...${pubkey.slice(-chars)}`;
}
