use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("4GSjD1XGSzXDt1qYneSH3mZNm2juye7fKdthwm1AjAem");

pub const ARTICLE_SEED: &[u8] = b"article";
pub const ACCESS_SEED: &[u8] = b"access";

#[program]
pub mod workspace {
    use super::*;

    // fee_bps: u16, Platform fee in basis points, 0 = no fee
    // usdc_mint: Pubkey, USDC mint address for the platform, Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr
    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        fee_bps: u16,
        usdc_mint: Pubkey,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.bump = ctx.bumps.config;
        config.authority = ctx.accounts.authority.key();
        config.is_active = true;
        config.is_paused = false;
        config.fee_bps = fee_bps;
        config.usdc_mint = usdc_mint;
        config.version = 1;
        config.total_articles = 0;
        config.total_unlocks = 0;
        Ok(())
    }

    pub fn register_article(
        ctx: Context<RegisterArticle>,
        article_id: [u8; 32],
        price_usdc: u64,
    ) -> Result<()> {
        require!(price_usdc > 0, ErrorCode::InvalidAmount);

        let article = &mut ctx.accounts.article;
        article.is_initialized = true;
        article.bump = ctx.bumps.article;
        article.author = ctx.accounts.author.key();
        article.price_usdc = price_usdc;
        article.article_id = article_id;
        article.unlock_count = 0;

        let config = &mut ctx.accounts.config;
        config.total_articles = config
            .total_articles
            .checked_add(1)
            .ok_or(ErrorCode::MathOverflow)?;

        msg!(
            "Article registered by {} with price {} USDC units",
            ctx.accounts.author.key(),
            price_usdc
        );
        Ok(())
    }

    pub fn unlock_article(
        ctx: Context<UnlockArticle>,
        _article_id: [u8; 32],
    ) -> Result<()> {
        let article = &ctx.accounts.article;
        require!(article.is_initialized, ErrorCode::ArticleNotInitialized);
        require!(
            ctx.accounts.reader.key() != article.author,
            ErrorCode::AuthorCannotUnlock
        );

        let price = article.price_usdc;

        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.reader_usdc_ata.to_account_info(),
                to: ctx.accounts.author_usdc_ata.to_account_info(),
                authority: ctx.accounts.reader.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, price)?;

        let access = &mut ctx.accounts.access_record;
        access.bump = ctx.bumps.access_record;
        access.reader = ctx.accounts.reader.key();
        access.article = ctx.accounts.article.key();
        access.unlocked_at = Clock::get()?.unix_timestamp;
        access.price_paid = price;

        let article = &mut ctx.accounts.article;
        article.unlock_count = article
            .unlock_count
            .checked_add(1)
            .ok_or(ErrorCode::MathOverflow)?;

        let config = &mut ctx.accounts.config;
        config.total_unlocks = config
            .total_unlocks
            .checked_add(1)
            .ok_or(ErrorCode::MathOverflow)?;

        msg!(
            "Article unlocked by {}. Total unlocks: {}",
            ctx.accounts.reader.key(),
            article.unlock_count
        );
        Ok(())
    }

    pub fn check_access(
        ctx: Context<CheckAccess>,
        _article_id: [u8; 32],
    ) -> Result<()> {
        let article = &ctx.accounts.article;
        require!(article.is_initialized, ErrorCode::ArticleNotInitialized);

        let reader_key = ctx.accounts.reader.key();

        if reader_key == article.author {
            msg!("Access GRANTED (author) for {}", reader_key);
            return Ok(());
        }

        let access = &ctx.accounts.access_record;
        require!(
            access.reader == reader_key,
            ErrorCode::AccessDenied
        );

        msg!("Access GRANTED for reader {}", reader_key);
        Ok(())
    }

    pub fn update_price(
        ctx: Context<UpdatePrice>,
        _article_id: [u8; 32],
        new_price_usdc: u64,
    ) -> Result<()> {
        require!(new_price_usdc > 0, ErrorCode::InvalidAmount);

        let old_price = ctx.accounts.article.price_usdc;
        let article = &mut ctx.accounts.article;
        article.price_usdc = new_price_usdc;

        msg!(
            "Price updated from {} to {} USDC units",
            old_price,
            new_price_usdc
        );
        Ok(())
    }
}

// ── Account Structs ──

#[account]
pub struct Config {
    pub bump: u8,
    pub authority: Pubkey,
    pub is_active: bool,
    pub is_paused: bool,
    pub fee_bps: u16,
    pub usdc_mint: Pubkey,
    pub version: u8,
    pub total_articles: u64,
    pub total_unlocks: u64,
}

impl Config {
    pub const LEN: usize = 1 + 32 + 1 + 1 + 2 + 32 + 1 + 8 + 8;
}

#[account]
pub struct Article {
    pub is_initialized: bool,
    pub bump: u8,
    pub author: Pubkey,
    pub price_usdc: u64,
    pub article_id: [u8; 32],
    pub unlock_count: u32,
}

impl Article {
    pub const LEN: usize = 1 + 1 + 32 + 8 + 32 + 4;
}

#[account]
pub struct AccessRecord {
    pub bump: u8,
    pub reader: Pubkey,
    pub article: Pubkey,
    pub unlocked_at: i64,
    pub price_paid: u64,
}

impl AccessRecord {
    pub const LEN: usize = 1 + 32 + 32 + 8 + 8;
}

// ── Context Structs ──

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(
        init,
        seeds = [b"config", authority.key().as_ref()],
        bump,
        payer = authority,
        space = 8 + Config::LEN
    )]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(article_id: [u8; 32])]
pub struct RegisterArticle<'info> {
    #[account(mut)]
    pub author: Signer<'info>,
    #[account(
        init,
        seeds = [ARTICLE_SEED, &article_id],
        bump,
        payer = author,
        space = 8 + Article::LEN
    )]
    pub article: Account<'info, Article>,
    #[account(
        mut,
        seeds = [b"config", config.authority.as_ref()],
        bump = config.bump,
        constraint = config.is_active @ ErrorCode::ConfigInactive,
        constraint = !config.is_paused @ ErrorCode::ConfigPaused,
    )]
    pub config: Account<'info, Config>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(article_id: [u8; 32])]
pub struct UnlockArticle<'info> {
    #[account(mut)]
    pub reader: Signer<'info>,
    #[account(mut, token::authority = reader)]
    pub reader_usdc_ata: Account<'info, TokenAccount>,
    #[account(mut)]
    pub author_usdc_ata: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [ARTICLE_SEED, &article_id],
        bump = article.bump,
    )]
    pub article: Account<'info, Article>,
    #[account(
        init,
        seeds = [ACCESS_SEED, article.key().as_ref(), reader.key().as_ref()],
        bump,
        payer = reader,
        space = 8 + AccessRecord::LEN,
    )]
    pub access_record: Account<'info, AccessRecord>,
    #[account(
        mut,
        seeds = [b"config", config.authority.as_ref()],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(article_id: [u8; 32])]
pub struct CheckAccess<'info> {
    pub reader: Signer<'info>,
    #[account(
        seeds = [ARTICLE_SEED, &article_id],
        bump = article.bump,
    )]
    pub article: Account<'info, Article>,
    #[account(
        seeds = [ACCESS_SEED, article.key().as_ref(), reader.key().as_ref()],
        bump = access_record.bump,
    )]
    pub access_record: Account<'info, AccessRecord>,
}

#[derive(Accounts)]
#[instruction(article_id: [u8; 32])]
pub struct UpdatePrice<'info> {
    #[account(mut)]
    pub author: Signer<'info>,
    #[account(
        mut,
        seeds = [ARTICLE_SEED, &article_id],
        bump = article.bump,
        constraint = article.author == author.key() @ ErrorCode::Unauthorized,
    )]
    pub article: Account<'info, Article>,
}

// ── Error Codes ──

#[error_code]
pub enum ErrorCode {
    #[msg("Math overflow occurred")]
    MathOverflow,
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Config is inactive")]
    ConfigInactive,
    #[msg("Config is paused")]
    ConfigPaused,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Article not initialized")]
    ArticleNotInitialized,
    #[msg("Author cannot unlock own article")]
    AuthorCannotUnlock,
    #[msg("Reader has already unlocked this article")]
    AlreadyUnlocked,
    #[msg("Access denied - article not unlocked")]
    AccessDenied,
}
