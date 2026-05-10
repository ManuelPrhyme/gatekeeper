/**
 * GateKeeper SDK - On-chain gated content platform
 *
 * Interacts with the deployed Solana program for:
 * - Registering articles with USDC prices
 * - Unlocking articles via USDC payment (CPI)
 * - Checking reader access
 * - Updating article prices
 */

import { BN, Program, Provider } from '@coral-xyz/anchor';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from '@solana/web3.js';
import IDL from '../idl/workspaceIDL.json';
import { configAddress } from './configAddress';

// --- Type Definitions (from IDL) ---

export interface ConfigData {
  bump: number;
  authority: PublicKey;
  isActive: boolean;
  isPaused: boolean;
  feeBps: number;
  usdcMint: PublicKey;
  version: number;
  totalArticles: number;
  totalUnlocks: number;
}

export interface ArticleData {
  isInitialized: boolean;
  bump: number;
  author: PublicKey;
  priceUsdc: BN;
  articleId: number[];
  unlockCount: number;
}

export interface AccessRecordData {
  bump: number;
  reader: PublicKey;
  article: PublicKey;
  unlockedAt: BN;
  pricePaid: BN;
}

export interface SDKResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Convert a string article ID to a 32-byte array for on-chain usage.
 * Pads with zeros or truncates to exactly 32 bytes.
 */
export function articleIdToBytes(id: string): number[] {
  const bytes = new Array(32).fill(0);
  const encoded = new TextEncoder().encode(id);
  for (let i = 0; i < Math.min(encoded.length, 32); i++) {
    bytes[i] = encoded[i];
  }
  return bytes;
}

/**
 * Convert a 32-byte array back to a string article ID.
 */
export function bytesToArticleId(bytes: number[]): string {
  const nonZero = bytes.filter((b) => b !== 0);
  return new TextDecoder().decode(new Uint8Array(nonZero));
}

// --- Main SDK ---

export class GateKeeperSDK {
  private readonly provider: Provider;
  private readonly program: Program<any>;
  private readonly configAddress: PublicKey;

  constructor(provider: Provider) {
    this.provider = provider;
    this.program = new Program(IDL as any, this.provider);
    this.configAddress = new PublicKey(configAddress);
  }

  // --- Helpers ---

  private safeBN(value: any, defaultValue: number | string = 0): BN {
    if (value === null || value === undefined) return new BN(defaultValue);
    if (typeof value === 'number') {
      if (isNaN(value) || !isFinite(value)) return new BN(defaultValue);
      return new BN(Math.floor(value).toString());
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      const num = parseFloat(trimmed);
      if (isNaN(num)) return new BN(defaultValue);
      return new BN(Math.floor(num).toString());
    }
    if (value instanceof BN) return value;
    return new BN(defaultValue);
  }

  private safeBNToNumber(value: any, defaultValue: number = 0): number {
    try {
      return value && typeof value.toNumber === 'function'
        ? value.toNumber()
        : defaultValue;
    } catch {
      if (value && typeof value.toString === 'function') {
        const parsed = parseInt(value.toString());
        if (!isNaN(parsed)) return parsed;
      }
      return defaultValue;
    }
  }

  private async getPDA(
    seeds: (string | PublicKey | Buffer | Uint8Array)[],
    programId?: PublicKey
  ): Promise<[PublicKey, number]> {
    const seedBuffers = seeds.map((seed) => {
      if (typeof seed === 'string') return Buffer.from(seed, 'utf8');
      if (seed instanceof PublicKey) return seed.toBuffer();
      if (seed instanceof Uint8Array) return Buffer.from(seed);
      return seed;
    });
    return PublicKey.findProgramAddressSync(
      seedBuffers,
      programId || this.program.programId
    );
  }

  private async testConnection(): Promise<boolean> {
    try {
      if (!this.provider?.connection) return false;
      const { value } = await this.provider.connection.getLatestBlockhashAndContext('finalized');
      return !!(value && value.blockhash);
    } catch {
      return false;
    }
  }

  // --- Config ---

  /** Fetch platform config */
  async fetchConfig(): Promise<SDKResult<ConfigData>> {
    try {
      const account = await this.program.provider.connection.getAccountInfo(
        this.configAddress
      );
      if (!account) return { success: false, error: 'Config account not found' };
      const decoded = this.program.coder.accounts.decode('config', account.data);
      return {
        success: true,
        data: {
          bump: decoded.bump,
          authority: decoded.authority,
          isActive: decoded.isActive,
          isPaused: decoded.isPaused,
          feeBps: decoded.feeBps,
          usdcMint: decoded.usdcMint,
          version: decoded.version,
          totalArticles: decoded.totalArticles,
          totalUnlocks: decoded.totalUnlocks,
        },
      };
    } catch (error) {
      return { success: false, error: 'Failed to fetch config' };
    }
  }

  // --- Register Article ---

  /**
   * Register an article on-chain with a USDC price.
   * @param articleId String ID (will be converted to 32-byte array)
   * @param priceUsdc Price in raw USDC units (6 decimals, e.g. 1000000 = 1 USDC)
   */
  async registerArticle(
    articleId: string,
    priceUsdc: number
  ): Promise<SDKResult<{ signature: string; articlePda: string }>> {
    if (!this.provider.publicKey) return { success: false, error: 'Wallet not connected' };

    try {
      if (!(await this.testConnection()))
        return { success: false, error: 'Network unavailable' };

      if (priceUsdc <= 0) return { success: false, error: 'Price must be greater than 0' };

      const articleIdBytes = articleIdToBytes(articleId);
      const priceBN = this.safeBN(priceUsdc);

      const [articlePda] = await this.getPDA([
        'article',
        Buffer.from(articleIdBytes),
      ]);

      // Fetch config to get authority for config PDA derivation
      const configResult = await this.fetchConfig();
      if (!configResult.success || !configResult.data)
        return { success: false, error: configResult.error || 'Config fetch failed' };

      const tx = await this.program.methods
        .registerArticle(articleIdBytes, priceBN)
        .accounts({
          author: this.provider.publicKey,
          article: articlePda,
          config: this.configAddress,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return {
        success: true,
        data: { signature: tx, articlePda: articlePda.toBase58() },
      };
    } catch (error: any) {
      const msg = error?.message || 'Register article failed';
      if (msg.includes('already in use'))
        return { success: false, error: 'Article already registered on-chain' };
      return { success: false, error: msg };
    }
  }

  // --- Unlock Article ---

  /**
   * Pay USDC to unlock an article. The program validates payment via CPI
   * and creates an access record PDA.
   */
  async unlockArticle(
    articleId: string,
    authorPubkey: PublicKey
  ): Promise<SDKResult<{ signature: string }>> {
    if (!this.provider.publicKey) return { success: false, error: 'Wallet not connected' };

    try {
      if (!(await this.testConnection()))
        return { success: false, error: 'Network unavailable' };

      const configResult = await this.fetchConfig();
      if (!configResult.success || !configResult.data)
        return { success: false, error: configResult.error || 'Config fetch failed' };

      const usdcMint = configResult.data.usdcMint;

      const articleIdBytes = articleIdToBytes(articleId);

      const [articlePda] = await this.getPDA([
        'article',
        Buffer.from(articleIdBytes),
      ]);

      const [accessRecordPda] = await this.getPDA([
        'access',
        articlePda,
        this.provider.publicKey,
      ]);

      const readerAta = getAssociatedTokenAddressSync(
        usdcMint,
        this.provider.publicKey
      );
      const authorAta = getAssociatedTokenAddressSync(usdcMint, authorPubkey);

      const tx = await this.program.methods
        .unlockArticle(articleIdBytes)
        .accounts({
          reader: this.provider.publicKey,
          readerUsdcAta: readerAta,
          authorUsdcAta: authorAta,
          article: articlePda,
          accessRecord: accessRecordPda,
          config: this.configAddress,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return { success: true, data: { signature: tx } };
    } catch (error: any) {
      const msg = error?.message || 'Unlock failed';
      if (msg.includes('already in use') || msg.includes('AlreadyUnlocked'))
        return { success: false, error: 'You have already unlocked this article' };
      if (msg.includes('AuthorCannotUnlock'))
        return { success: false, error: 'Authors cannot unlock their own articles' };
      if (msg.includes('insufficient'))
        return { success: false, error: 'Insufficient USDC balance' };
      return { success: false, error: msg };
    }
  }

  // --- Check Access ---

  /**
   * Check if a reader has unlocked a given article on-chain.
   * Returns true if the AccessRecord PDA exists.
   */
  async checkAccess(
    articleId: string,
    readerPubkey?: PublicKey
  ): Promise<SDKResult<{ hasAccess: boolean }>> {
    const reader = readerPubkey || this.provider.publicKey;
    if (!reader) return { success: false, error: 'No reader pubkey' };

    try {
      const articleIdBytes = articleIdToBytes(articleId);

      const [articlePda] = await this.getPDA([
        'article',
        Buffer.from(articleIdBytes),
      ]);

      const [accessRecordPda] = await this.getPDA([
        'access',
        articlePda,
        reader,
      ]);

      // If the account exists, access was granted
      const account = await this.provider.connection.getAccountInfo(accessRecordPda);
      return { success: true, data: { hasAccess: !!account } };
    } catch {
      return { success: true, data: { hasAccess: false } };
    }
  }

  // --- Update Price ---

  /**
   * Author updates the price of their article.
   */
  async updatePrice(
    articleId: string,
    newPriceUsdc: number
  ): Promise<SDKResult<{ signature: string }>> {
    if (!this.provider.publicKey) return { success: false, error: 'Wallet not connected' };

    try {
      if (newPriceUsdc <= 0) return { success: false, error: 'Price must be greater than 0' };

      const articleIdBytes = articleIdToBytes(articleId);
      const priceBN = this.safeBN(newPriceUsdc);

      const [articlePda] = await this.getPDA([
        'article',
        Buffer.from(articleIdBytes),
      ]);

      const tx = await this.program.methods
        .updatePrice(articleIdBytes, priceBN)
        .accounts({
          author: this.provider.publicKey,
          article: articlePda,
        })
        .rpc();

      return { success: true, data: { signature: tx } };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Update price failed' };
    }
  }

  // --- Fetch Article On-Chain ---

  /**
   * Fetch an article's on-chain data from its PDA.
   */
  async fetchArticle(articleId: string): Promise<SDKResult<ArticleData>> {
    try {
      const articleIdBytes = articleIdToBytes(articleId);
      const [articlePda] = await this.getPDA([
        'article',
        Buffer.from(articleIdBytes),
      ]);

      const account = await this.provider.connection.getAccountInfo(articlePda);
      if (!account) return { success: true, data: undefined };

      const decoded = this.program.coder.accounts.decode('article', account.data);
      return {
        success: true,
        data: {
          isInitialized: decoded.isInitialized,
          bump: decoded.bump,
          author: decoded.author,
          priceUsdc: decoded.priceUsdc,
          articleId: decoded.articleId,
          unlockCount: decoded.unlockCount,
        },
      };
    } catch {
      return { success: true, data: undefined };
    }
  }

  // --- Fetch All Articles ---

  /**
   * Fetch all registered articles from the program.
   */
  async fetchAllArticles(): Promise<
    SDKResult<Array<{ publicKey: PublicKey; account: ArticleData }>>
  > {
    try {
      if (!(await this.testConnection()))
        return { success: false, error: 'Network unavailable' };

      const allArticles = await this.program.account.article.all();
      if (!allArticles?.length) return { success: true, data: [] };

      return {
        success: true,
        data: allArticles.map((a: any) => ({
          publicKey: a.publicKey,
          account: a.account,
        })),
      };
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('Account does not exist')
      ) {
        return { success: true, data: [] };
      }
      return { success: false, error: 'Failed to fetch articles' };
    }
  }

  // --- Utility ---

  /** Get SOL balance */
  async fetchSolBalance(account?: PublicKey): Promise<SDKResult<number>> {
    const target = account || this.provider.publicKey;
    if (!target) return { success: false, error: 'No account' };
    try {
      const balance = await this.provider.connection.getBalance(target);
      return { success: true, data: balance / LAMPORTS_PER_SOL };
    } catch {
      return { success: false, error: 'Failed to fetch SOL balance' };
    }
  }

  /** Get USDC balance (raw units) */
  async fetchUsdcBalance(account?: PublicKey): Promise<SDKResult<number>> {
    const target = account || this.provider.publicKey;
    if (!target) return { success: false, error: 'No account' };
    try {
      const configResult = await this.fetchConfig();
      if (!configResult.success || !configResult.data)
        return { success: true, data: 0 };

      const ata = getAssociatedTokenAddressSync(
        configResult.data.usdcMint,
        target
      );
      const balance = await this.provider.connection.getTokenAccountBalance(ata);
      return { success: true, data: Number(balance.value.amount) };
    } catch {
      return { success: true, data: 0 };
    }
  }

  /** Get program ID */
  get programId(): PublicKey {
    return this.program.programId;
  }
}
