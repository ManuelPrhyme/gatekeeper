import type { Article } from './types';
import { getArticles, saveArticle } from './storage';

const SEED_KEY = 'gatekeeper_seeded';

const DEMO_ARTICLES: Article[] = [
  {
    id: 'demo-solana-101',
    title: 'Solana Architecture Deep Dive',
    description:
      'A comprehensive guide to understanding Solana\'s runtime, accounts model, and how programs process instructions. Essential reading for any Solana developer.',
    body: `# Solana Architecture Deep Dive

## The Accounts Model

Solana uses a unique **accounts model** that differs fundamentally from Ethereum's contract storage. Every piece of state on Solana lives inside an **account** — a buffer of bytes with an owner program.

\`\`\`rust
pub struct AccountInfo {
    pub key: Pubkey,
    pub lamports: u64,
    pub data: Vec<u8>,
    pub owner: Pubkey,
    pub executable: bool,
}
\`\`\`

### Key Concepts

1. **Programs are stateless** — they don't store data themselves
2. **Accounts hold all state** — programs read/write to accounts passed into instructions
3. **Each account has exactly one owner** — only the owner program can modify its data

## The Runtime

Solana's runtime processes transactions in parallel using **Sealevel**. This is possible because each transaction declares upfront which accounts it will read and write.

### Transaction Processing

A transaction contains:
- One or more **instructions**
- Each instruction targets a specific **program**
- Each instruction includes a list of **accounts** it needs

\`\`\`
Transaction
├── Instruction 1
│   ├── Program ID: TokenProgram
│   ├── Accounts: [source, destination, authority]
│   └── Data: Transfer { amount: 1000000 }
└── Instruction 2
    ├── Program ID: YourProgram
    ├── Accounts: [article_account, reader_account]
    └── Data: UnlockArticle { article_id: ... }
\`\`\`

## Cross-Program Invocation (CPI)

CPI allows one program to call another. This is how our gated content program interacts with the SPL Token program:

\`\`\`rust
// Our program invokes the Token program to transfer USDC
invoke(
    &spl_token::instruction::transfer(
        &spl_token::id(),
        reader_token_account,
        author_token_account,
        reader_authority,
        &[],
        amount,
    )?,
    &[reader_ata, author_ata, reader, token_program],
)?;
\`\`\`

> **Important**: The reader must sign the transaction, authorizing both the payment and the unlock in a single atomic operation.

## Program Derived Addresses (PDAs)

PDAs are deterministic addresses derived from seeds. We use them to create article state accounts:

\`\`\`rust
let (article_pda, bump) = Pubkey::find_program_address(
    &[b"article", article_id.as_bytes()],
    &program_id,
);
\`\`\`

This ensures each article has a unique, predictable address that only our program can sign for.

## Summary

Understanding these fundamentals is critical for building on Solana. The accounts model, parallel execution, CPI, and PDAs form the backbone of every Solana application.`,
    price_usdc: 2_000_000,
    author: '11111111111111111111111111111111',
    author_name: 'Solana Academy',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    category: 'Solana',
    cover_emoji: '⚡',
    read_time: 12,
  },
  {
    id: 'demo-defi-yield',
    title: 'DeFi Yield Strategies on Solana',
    description:
      'Explore proven yield farming strategies, liquidity provision techniques, and risk management frameworks for DeFi protocols on Solana.',
    body: `# DeFi Yield Strategies on Solana

## Understanding Yield Sources

Yield in DeFi comes from several fundamental sources:

### 1. Lending Interest
When you deposit assets into lending protocols like **Solend** or **MarginFi**, borrowers pay interest that gets distributed to lenders.

- **APY Range**: 2-15% depending on utilization
- **Risk Level**: Low to Medium
- **Key Metric**: Utilization rate

### 2. Liquidity Provision
Providing liquidity to DEXs like **Raydium** or **Orca** earns you trading fees.

\`\`\`
LP Position Value = Token A + Token B + Accumulated Fees
Effective Yield = (Fees / Initial Value) × (365 / Days)
\`\`\`

### 3. Staking Rewards
Liquid staking through **Marinade** or **Jito** provides:
- Native staking yield (~7% APY)
- MEV rewards (Jito)
- DeFi composability with mSOL/jitoSOL

## Risk Management Framework

Every yield strategy must account for:

| Risk Type | Description | Mitigation |
|-----------|-------------|------------|
| Smart Contract | Bug in protocol code | Use audited protocols |
| Impermanent Loss | Price divergence in LP | Use concentrated liquidity |
| Liquidation | Collateral drops below threshold | Maintain health factor > 1.5 |
| Oracle | Price feed manipulation | Use protocols with multiple oracles |

## Advanced Strategy: Looping

1. Deposit SOL as collateral
2. Borrow stablecoin against it
3. Swap stablecoin for more SOL
4. Repeat

> **Warning**: Looping amplifies both gains AND losses. Only attempt with thorough understanding of liquidation risks.

## Conclusion

The Solana DeFi ecosystem offers compelling yield opportunities, but always **understand the risks** before deploying capital. Start small, diversify across protocols, and never invest more than you can afford to lose.`,
    price_usdc: 3_000_000,
    author: '11111111111111111111111111111111',
    author_name: 'DeFi Strategist',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    category: 'DeFi',
    cover_emoji: '🏦',
    read_time: 8,
  },
  {
    id: 'demo-nft-marketplace',
    title: 'Building an NFT Marketplace from Scratch',
    description:
      'Learn how to build a fully functional NFT marketplace on Solana using Metaplex, including minting, listing, and trading mechanics.',
    body: `# Building an NFT Marketplace from Scratch

## Architecture Overview

A Solana NFT marketplace consists of three layers:

1. **On-chain Program** — Handles escrow, listings, and settlements
2. **Indexer** — Tracks NFT transfers and marketplace events
3. **Frontend** — User interface for browsing, listing, and buying

## Metaplex Token Metadata

Every NFT on Solana follows the Metaplex standard:

\`\`\`json
{
  "name": "Cool NFT #1234",
  "symbol": "COOL",
  "uri": "https://arweave.net/metadata.json",
  "seller_fee_basis_points": 500,
  "creators": [
    {
      "address": "Creator1...",
      "share": 100,
      "verified": true
    }
  ]
}
\`\`\`

## Listing Flow

\`\`\`
Seller lists NFT
    ↓
NFT transferred to escrow PDA
    ↓
Listing account created with price
    ↓
Buyer sends purchase transaction
    ↓
Program validates payment
    ↓
NFT transferred to buyer
SOL transferred to seller
Royalties distributed to creators
\`\`\`

## Escrow Pattern

The marketplace program uses a PDA as an escrow:

\`\`\`rust
// Derive escrow authority
let (escrow, bump) = Pubkey::find_program_address(
    &[b"escrow", listing_id.as_bytes()],
    &program_id,
);

// Transfer NFT to escrow during listing
spl_token::transfer(nft_account, escrow_account, seller, amount)?;
\`\`\`

## Frontend Integration

Connect your React frontend using:

- **@solana/wallet-adapter** for wallet connection
- **@metaplex-foundation/js** for NFT operations
- **Helius** or **Shyft** for indexed NFT data

## Key Takeaways

Building a marketplace teaches you escrow patterns, CPI, PDA management, and frontend integration — the core skills for any Solana developer.`,
    price_usdc: 5_000_000,
    author: '11111111111111111111111111111111',
    author_name: 'NFT Builder',
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    category: 'NFTs',
    cover_emoji: '🎨',
    read_time: 15,
  },
  {
    id: 'demo-security-audit',
    title: 'Smart Contract Security: Common Vulnerabilities',
    description:
      'A security researcher\'s guide to the most common vulnerabilities in Solana programs, with real exploit examples and prevention techniques.',
    body: `# Smart Contract Security: Common Vulnerabilities

## Why Security Matters

In 2023 alone, over **$1.7 billion** was lost to smart contract exploits. Understanding vulnerabilities is not optional — it's essential.

## Top Vulnerabilities

### 1. Missing Signer Checks

The most basic yet common vulnerability:

\`\`\`rust
// VULNERABLE - anyone can call this
pub fn withdraw(accounts: &[AccountInfo], amount: u64) -> ProgramResult {
    let vault = &accounts[0];
    // Missing: verify accounts[1] is the authorized signer
    transfer(vault, destination, amount)?;
    Ok(())
}

// SECURE
pub fn withdraw(accounts: &[AccountInfo], amount: u64) -> ProgramResult {
    let authority = &accounts[1];
    if !authority.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    // Verify authority matches expected
    if authority.key != &expected_authority {
        return Err(ProgramError::InvalidAccountData);
    }
    transfer(vault, destination, amount)?;
    Ok(())
}
\`\`\`

### 2. Account Confusion

Passing wrong accounts that the program doesn't validate:

- Always verify account **owner**
- Always verify account **discriminator** or expected data layout
- Use PDAs for deterministic account addresses

### 3. Integer Overflow/Underflow

\`\`\`rust
// VULNERABLE
let new_balance = balance + deposit_amount; // can overflow

// SECURE  
let new_balance = balance.checked_add(deposit_amount)
    .ok_or(ProgramError::ArithmeticOverflow)?;
\`\`\`

### 4. Reinitialization Attacks

\`\`\`rust
// VULNERABLE - can be reinitialized
pub fn initialize(account: &AccountInfo) -> ProgramResult {
    let mut data = account.data.borrow_mut();
    data[0] = 1; // set initialized flag
    Ok(())
}

// SECURE - check if already initialized
pub fn initialize(account: &AccountInfo) -> ProgramResult {
    let data = account.data.borrow();
    if data[0] == 1 {
        return Err(ProgramError::AccountAlreadyInitialized);
    }
    drop(data);
    let mut data = account.data.borrow_mut();
    data[0] = 1;
    Ok(())
}
\`\`\`

## Security Checklist

- [ ] All accounts validated (owner, signer, address)
- [ ] No arithmetic overflow possible
- [ ] Initialization guards in place
- [ ] PDA bumps stored and verified
- [ ] CPI targets verified (not arbitrary programs)
- [ ] Rent-exempt checks for new accounts

## Conclusion

Security is a mindset, not a checklist. Always think adversarially about your code.`,
    price_usdc: 1_500_000,
    author: '11111111111111111111111111111111',
    author_name: 'Security Researcher',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    category: 'Security',
    cover_emoji: '🔒',
    read_time: 10,
  },
];

export function seedDemoArticles(): void {
  if (localStorage.getItem(SEED_KEY)) return;

  const existing = getArticles();
  if (existing.length > 0) {
    localStorage.setItem(SEED_KEY, 'true');
    return;
  }

  DEMO_ARTICLES.forEach((article) => saveArticle(article));
  localStorage.setItem(SEED_KEY, 'true');
}
