import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code, ChevronDown, ChevronUp, FileCode, Database, ArrowRightLeft, ExternalLink } from 'lucide-react';

const sections = [
  {
    id: 'entrypoint',
    icon: Code,
    title: 'process_instruction Entrypoint',
    description: 'The native Rust entrypoint that deserializes instruction data and routes to handlers.',
    code: `use solana_program::{
    account_info::AccountInfo,
    entrypoint,
    entrypoint::ProgramResult,
    pubkey::Pubkey,
    msg,
};

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let instruction = instruction_data[0];
    match instruction {
        0 => register_article(program_id, accounts, &instruction_data[1..]),
        1 => unlock_article(program_id, accounts, &instruction_data[1..]),
        _ => Err(ProgramError::InvalidInstructionData),
    }
}`,
  },
  {
    id: 'accounts',
    icon: Database,
    title: 'Account Definitions',
    description: 'On-chain data structures for articles and access records, stored as raw bytes in PDAs.',
    code: `/// Article account layout (stored in PDA)
/// Seeds: ["article", article_id]
pub struct ArticleAccount {
    pub is_initialized: bool,       // 1 byte
    pub author: Pubkey,             // 32 bytes
    pub price_usdc: u64,            // 8 bytes  (in 6-decimal units)
    pub article_id: [u8; 32],       // 32 bytes
    pub unlock_count: u32,          // 4 bytes
    pub readers: Vec<Pubkey>,       // dynamic  (max ~50 readers per account)
}

/// Total fixed size: 77 bytes + dynamic reader list

fn register_article(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    data: &[u8],
) -> ProgramResult {
    let author = &accounts[0]; // signer
    let article_pda = &accounts[1];
    let system_program = &accounts[2];

    // Verify signer
    if !author.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Derive and verify PDA
    let article_id = &data[0..32];
    let price = u64::from_le_bytes(data[32..40].try_into().unwrap());
    let (expected_pda, bump) = Pubkey::find_program_address(
        &[b"article", article_id],
        program_id,
    );

    // Create account via CPI to System Program
    // ... account creation logic ...

    // Write article data
    let mut account_data = article_pda.data.borrow_mut();
    account_data[0] = 1; // is_initialized
    account_data[1..33].copy_from_slice(author.key.as_ref());
    account_data[33..41].copy_from_slice(&price.to_le_bytes());
    account_data[41..73].copy_from_slice(article_id);

    msg!("Article registered: price={} USDC-lamports", price);
    Ok(())
}`,
  },
  {
    id: 'cpi',
    icon: ArrowRightLeft,
    title: 'CPI Payment & Access Recording',
    description: 'Cross-program invocation to SPL Token Program for USDC transfer, then records reader access.',
    code: `use spl_token;
use solana_program::program::invoke;

fn unlock_article(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    data: &[u8],
) -> ProgramResult {
    let reader = &accounts[0];          // signer
    let reader_ata = &accounts[1];      // reader's USDC ATA
    let author_ata = &accounts[2];      // author's USDC ATA
    let article_pda = &accounts[3];     // article state PDA
    let token_program = &accounts[4];   // SPL Token Program

    // 1. Verify reader is signer
    if !reader.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // 2. Read article price from PDA
    let account_data = article_pda.data.borrow();
    if account_data[0] != 1 {
        return Err(ProgramError::UninitializedAccount);
    }
    let price = u64::from_le_bytes(
        account_data[33..41].try_into().unwrap()
    );

    // 3. CPI: Transfer USDC from reader to author
    let transfer_ix = spl_token::instruction::transfer(
        &spl_token::id(),
        reader_ata.key,
        author_ata.key,
        reader.key,
        &[],
        price,
    )?;

    invoke(
        &transfer_ix,
        &[
            reader_ata.clone(),
            author_ata.clone(),
            reader.clone(),
            token_program.clone(),
        ],
    )?;

    // 4. Record reader's pubkey in article account
    drop(account_data);
    let mut account_data = article_pda.data.borrow_mut();
    let unlock_count = u32::from_le_bytes(
        account_data[73..77].try_into().unwrap()
    );
    let new_count = unlock_count + 1;
    account_data[73..77].copy_from_slice(&new_count.to_le_bytes());

    // Write reader pubkey at offset 77 + (unlock_count * 32)
    let offset = 77 + (unlock_count as usize * 32);
    account_data[offset..offset+32]
        .copy_from_slice(reader.key.as_ref());

    msg!("Article unlocked by {}", reader.key);
    Ok(())
}`,
  },
];

const ProgramArchitecture: React.FC = () => {
  const [expanded, setExpanded] = useState<string | null>('entrypoint');

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 border-t border-border/30">
      <div className="mb-10 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5">
          <FileCode className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium text-primary">Deployed on Devnet</span>
        </div>
        <h2 className="text-2xl font-bold text-foreground">Program Architecture</h2>
        <p className="mt-1.5 text-sm text-muted-foreground max-w-lg mx-auto">
          Solana program with RegisterArticle, UnlockArticle, CheckAccess, and UpdatePrice instructions,
          using CPI for USDC payments.
        </p>
        <a
          href="https://explorer.solana.com/address/4GSjD1XGSzXDt1qYneSH3mZNm2juye7fKdthwm1AjAem?cluster=devnet"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          View on Solana Explorer: 4GSjD1...AjAem
        </a>
      </div>

      <div className="space-y-3 max-w-3xl mx-auto">
        {sections.map((section) => {
          const Icon = section.icon;
          const isOpen = expanded === section.id;

          return (
            <div
              key={section.id}
              className={`rounded-xl border transition-colors ${
                isOpen ? 'border-primary/30 bg-card' : 'border-border/60 bg-card/50'
              }`}
            >
              <button
                onClick={() => setExpanded(isOpen ? null : section.id)}
                className="w-full flex items-center gap-3 p-4 text-left"
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                  isOpen ? 'bg-primary/10 border-primary/20' : 'bg-secondary border-border'
                }`}>
                  <Icon className={`h-4 w-4 ${isOpen ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm font-semibold ${isOpen ? 'text-foreground' : 'text-secondary-foreground'}`}>
                    {section.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {section.description}
                  </p>
                </div>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4">
                      <pre className="rounded-lg bg-secondary border border-border p-4 overflow-x-auto text-xs font-mono text-secondary-foreground leading-relaxed">
                        <code>{section.code}</code>
                      </pre>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ProgramArchitecture;