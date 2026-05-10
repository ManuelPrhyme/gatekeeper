import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Workspace } from "../target/types/workspace";
import { expect } from "chai";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  MINT_SIZE,
  createInitializeMintInstruction,
  createMintToInstruction,
  createAssociatedTokenAccountInstruction,
  getMinimumBalanceForRentExemptMint,
  getAssociatedTokenAddress,
  getAccount,
} from "@solana/spl-token";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  Keypair,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

describe("workspace - Gated Content Platform", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.workspace as Program<Workspace>;

  let authority: Keypair;
  let author: Keypair;
  let reader: Keypair;
  let reader2: Keypair;
  let configPDA: PublicKey;
  let usdcMint: Keypair;
  let articleId: number[];
  let articleId2: number[];
  let articlePDA: PublicKey;
  let articlePDA2: PublicKey;
  let authorUsdcAta: PublicKey;
  let readerUsdcAta: PublicKey;
  let reader2UsdcAta: PublicKey;

  const USDC_DECIMALS = 6;
  const ARTICLE_PRICE = 5_000_000; // 5 USDC
  const MINT_AMOUNT = 100_000_000; // 100 USDC

  function generateArticleId(str: string): number[] {
    const buf = Buffer.alloc(32);
    buf.write(str, "utf-8");
    return Array.from(buf);
  }

  before(async () => {
    authority = Keypair.generate();
    author = Keypair.generate();
    reader = Keypair.generate();
    reader2 = Keypair.generate();
    usdcMint = Keypair.generate();

    // Fund all accounts
    const fundTxs = await Promise.all([
      provider.connection.requestAirdrop(authority.publicKey, 100 * LAMPORTS_PER_SOL),
      provider.connection.requestAirdrop(author.publicKey, 100 * LAMPORTS_PER_SOL),
      provider.connection.requestAirdrop(reader.publicKey, 100 * LAMPORTS_PER_SOL),
      provider.connection.requestAirdrop(reader2.publicKey, 100 * LAMPORTS_PER_SOL),
    ]);
    for (const sig of fundTxs) {
      await provider.connection.confirmTransaction(sig);
    }

    // Create mock USDC mint
    const lamports = await getMinimumBalanceForRentExemptMint(provider.connection);
    const createMintTx = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: authority.publicKey,
        newAccountPubkey: usdcMint.publicKey,
        space: MINT_SIZE,
        lamports,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeMintInstruction(
        usdcMint.publicKey,
        USDC_DECIMALS,
        authority.publicKey,
        null
      )
    );
    await provider.sendAndConfirm(createMintTx, [authority, usdcMint]);

    // Create ATAs
    authorUsdcAta = await getAssociatedTokenAddress(usdcMint.publicKey, author.publicKey);
    readerUsdcAta = await getAssociatedTokenAddress(usdcMint.publicKey, reader.publicKey);
    reader2UsdcAta = await getAssociatedTokenAddress(usdcMint.publicKey, reader2.publicKey);

    const createAtasTx = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        authority.publicKey,
        authorUsdcAta,
        author.publicKey,
        usdcMint.publicKey
      ),
      createAssociatedTokenAccountInstruction(
        authority.publicKey,
        readerUsdcAta,
        reader.publicKey,
        usdcMint.publicKey
      ),
      createAssociatedTokenAccountInstruction(
        authority.publicKey,
        reader2UsdcAta,
        reader2.publicKey,
        usdcMint.publicKey
      )
    );
    await provider.sendAndConfirm(createAtasTx, [authority]);

    // Mint USDC to readers
    const mintToTx = new Transaction().add(
      createMintToInstruction(
        usdcMint.publicKey,
        readerUsdcAta,
        authority.publicKey,
        MINT_AMOUNT
      ),
      createMintToInstruction(
        usdcMint.publicKey,
        reader2UsdcAta,
        authority.publicKey,
        MINT_AMOUNT
      )
    );
    await provider.sendAndConfirm(mintToTx, [authority]);

    // Derive PDAs
    [configPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("config"), authority.publicKey.toBuffer()],
      program.programId
    );

    articleId = generateArticleId("my-first-article-001");
    articleId2 = generateArticleId("my-second-article-002");

    [articlePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("article"), Buffer.from(articleId)],
      program.programId
    );

    [articlePDA2] = PublicKey.findProgramAddressSync(
      [Buffer.from("article"), Buffer.from(articleId2)],
      program.programId
    );
  });

  // ── Test 1: Initialize Config ──
  it("1. Initialize Config", async () => {
    const tx = await program.methods
      .initializeConfig(0, usdcMint.publicKey)
      .accounts({
        config: configPDA,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    const config = await program.account.config.fetch(configPDA);
    expect(config.isActive).to.be.true;
    expect(config.isPaused).to.be.false;
    expect(config.authority.toBase58()).to.equal(authority.publicKey.toBase58());
    expect(config.usdcMint.toBase58()).to.equal(usdcMint.publicKey.toBase58());
    expect(Number(config.feeBps)).to.equal(0);
    expect(Number(config.version)).to.equal(1);
    expect(Number(config.totalArticles.toString())).to.equal(0);
    expect(Number(config.totalUnlocks.toString())).to.equal(0);
  });

  // ── Test 2: Register Article ──
  it("2. Register Article with valid price", async () => {
    const tx = await program.methods
      .registerArticle(articleId, new BN(ARTICLE_PRICE))
      .accounts({
        author: author.publicKey,
        article: articlePDA,
        config: configPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([author])
      .rpc();

    const article = await program.account.article.fetch(articlePDA);
    expect(article.isInitialized).to.be.true;
    expect(article.author.toBase58()).to.equal(author.publicKey.toBase58());
    expect(Number(article.priceUsdc.toString())).to.equal(ARTICLE_PRICE);
    expect(Number(article.unlockCount)).to.equal(0);

    const config = await program.account.config.fetch(configPDA);
    expect(Number(config.totalArticles.toString())).to.equal(1);
  });

  // ── Test 3: Register second article ──
  it("3. Register a second article", async () => {
    const tx = await program.methods
      .registerArticle(articleId2, new BN(10_000_000))
      .accounts({
        author: author.publicKey,
        article: articlePDA2,
        config: configPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([author])
      .rpc();

    const article = await program.account.article.fetch(articlePDA2);
    expect(article.isInitialized).to.be.true;
    expect(Number(article.priceUsdc.toString())).to.equal(10_000_000);

    const config = await program.account.config.fetch(configPDA);
    expect(Number(config.totalArticles.toString())).to.equal(2);
  });

  // ── Test 4: Fail register with zero price ──
  it("4. Fail to register article with zero price", async () => {
    const badId = generateArticleId("bad-article-zero-price");
    const [badPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("article"), Buffer.from(badId)],
      program.programId
    );

    try {
      await program.methods
        .registerArticle(badId, new BN(0))
        .accounts({
          author: author.publicKey,
          article: badPDA,
          config: configPDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([author])
        .rpc();
      expect.fail("Should have thrown");
    } catch (error: any) {
      expect(error.message).to.include("InvalidAmount");
    }
  });

  // ── Test 5: Unlock Article (reader pays USDC) ──
  it("5. Unlock article - reader pays USDC to author", async () => {
    const readerBalBefore = await getAccount(provider.connection, readerUsdcAta);
    const authorBalBefore = await getAccount(provider.connection, authorUsdcAta);

    const [accessPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("access"), articlePDA.toBuffer(), reader.publicKey.toBuffer()],
      program.programId
    );

    const tx = await program.methods
      .unlockArticle(articleId)
      .accounts({
        reader: reader.publicKey,
        readerUsdcAta: readerUsdcAta,
        authorUsdcAta: authorUsdcAta,
        article: articlePDA,
        accessRecord: accessPDA,
        config: configPDA,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([reader])
      .rpc();

    const readerBalAfter = await getAccount(provider.connection, readerUsdcAta);
    const authorBalAfter = await getAccount(provider.connection, authorUsdcAta);

    expect(Number(readerBalBefore.amount) - Number(readerBalAfter.amount)).to.equal(ARTICLE_PRICE);
    expect(Number(authorBalAfter.amount) - Number(authorBalBefore.amount)).to.equal(ARTICLE_PRICE);

    const article = await program.account.article.fetch(articlePDA);
    expect(Number(article.unlockCount)).to.equal(1);

    const access = await program.account.accessRecord.fetch(accessPDA);
    expect(access.reader.toBase58()).to.equal(reader.publicKey.toBase58());
    expect(access.article.toBase58()).to.equal(articlePDA.toBase58());
    expect(Number(access.pricePaid.toString())).to.equal(ARTICLE_PRICE);

    const config = await program.account.config.fetch(configPDA);
    expect(Number(config.totalUnlocks.toString())).to.equal(1);
  });

  // ── Test 6: Second reader unlocks same article ──
  it("6. Second reader unlocks same article", async () => {
    const [accessPDA2] = PublicKey.findProgramAddressSync(
      [Buffer.from("access"), articlePDA.toBuffer(), reader2.publicKey.toBuffer()],
      program.programId
    );

    const tx = await program.methods
      .unlockArticle(articleId)
      .accounts({
        reader: reader2.publicKey,
        readerUsdcAta: reader2UsdcAta,
        authorUsdcAta: authorUsdcAta,
        article: articlePDA,
        accessRecord: accessPDA2,
        config: configPDA,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([reader2])
      .rpc();

    const article = await program.account.article.fetch(articlePDA);
    expect(Number(article.unlockCount)).to.equal(2);

    const config = await program.account.config.fetch(configPDA);
    expect(Number(config.totalUnlocks.toString())).to.equal(2);
  });

  // ── Test 7: Fail duplicate unlock ──
  it("7. Fail to unlock article twice by same reader", async () => {
    const [accessPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("access"), articlePDA.toBuffer(), reader.publicKey.toBuffer()],
      program.programId
    );

    try {
      await program.methods
        .unlockArticle(articleId)
        .accounts({
          reader: reader.publicKey,
          readerUsdcAta: readerUsdcAta,
          authorUsdcAta: authorUsdcAta,
          article: articlePDA,
          accessRecord: accessPDA,
          config: configPDA,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([reader])
        .rpc();
      expect.fail("Should have thrown");
    } catch (error: any) {
      // PDA already exists, so init will fail
      expect(error).to.exist;
    }
  });

  // ── Test 8: Author cannot unlock own article ──
  it("8. Author cannot unlock own article", async () => {
    // Author needs USDC ATA and some USDC for this test
    const [accessPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("access"), articlePDA.toBuffer(), author.publicKey.toBuffer()],
      program.programId
    );

    try {
      await program.methods
        .unlockArticle(articleId)
        .accounts({
          reader: author.publicKey,
          readerUsdcAta: authorUsdcAta,
          authorUsdcAta: authorUsdcAta,
          article: articlePDA,
          accessRecord: accessPDA,
          config: configPDA,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([author])
        .rpc();
      expect.fail("Should have thrown");
    } catch (error: any) {
      expect(error.message).to.include("AuthorCannotUnlock");
    }
  });

  // ── Test 9: Check access for unlocked reader ──
  it("9. Check access - reader has access", async () => {
    const [accessPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("access"), articlePDA.toBuffer(), reader.publicKey.toBuffer()],
      program.programId
    );

    const tx = await program.methods
      .checkAccess(articleId)
      .accounts({
        reader: reader.publicKey,
        article: articlePDA,
        accessRecord: accessPDA,
      })
      .signers([reader])
      .rpc();

    expect(tx).to.be.a("string");
  });

  // ── Test 10: Update article price ──
  it("10. Author updates article price", async () => {
    const newPrice = 8_000_000; // 8 USDC

    const tx = await program.methods
      .updatePrice(articleId, new BN(newPrice))
      .accounts({
        author: author.publicKey,
        article: articlePDA,
      })
      .signers([author])
      .rpc();

    const article = await program.account.article.fetch(articlePDA);
    expect(Number(article.priceUsdc.toString())).to.equal(newPrice);
  });

  // ── Test 11: Non-author cannot update price ──
  it("11. Non-author cannot update article price", async () => {
    try {
      await program.methods
        .updatePrice(articleId, new BN(1_000_000))
        .accounts({
          author: reader.publicKey,
          article: articlePDA,
        })
        .signers([reader])
        .rpc();
      expect.fail("Should have thrown");
    } catch (error: any) {
      expect(error).to.exist;
    }
  });

  // ── Test 12: Fail update price to zero ──
  it("12. Fail to update price to zero", async () => {
    try {
      await program.methods
        .updatePrice(articleId, new BN(0))
        .accounts({
          author: author.publicKey,
          article: articlePDA,
        })
        .signers([author])
        .rpc();
      expect.fail("Should have thrown");
    } catch (error: any) {
      expect(error.message).to.include("InvalidAmount");
    }
  });

  // ── Test 13: Verify article data integrity after multiple operations ──
  it("13. Verify article data integrity after operations", async () => {
    const article = await program.account.article.fetch(articlePDA);
    expect(article.isInitialized).to.be.true;
    expect(article.author.toBase58()).to.equal(author.publicKey.toBase58());
    expect(Number(article.priceUsdc.toString())).to.equal(8_000_000); // Updated price
    expect(Number(article.unlockCount)).to.equal(2); // Two readers unlocked
  });

  // ── Test 14: Verify config totals ──
  it("14. Verify config totals are correct", async () => {
    const config = await program.account.config.fetch(configPDA);
    expect(Number(config.totalArticles.toString())).to.equal(2);
    expect(Number(config.totalUnlocks.toString())).to.equal(2);
    expect(config.isActive).to.be.true;
    expect(config.isPaused).to.be.false;
  });
});
