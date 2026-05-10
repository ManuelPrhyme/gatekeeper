/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/workspace.json`.
 */
export type Workspace = {
  "address": "4GSjD1XGSzXDt1qYneSH3mZNm2juye7fKdthwm1AjAem",
  "metadata": {
    "name": "workspace",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "checkAccess",
      "discriminator": [
        74,
        62,
        42,
        188,
        96,
        229,
        63,
        50
      ],
      "accounts": [
        {
          "name": "reader",
          "signer": true
        },
        {
          "name": "article",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  114,
                  116,
                  105,
                  99,
                  108,
                  101
                ]
              },
              {
                "kind": "arg",
                "path": "articleId"
              }
            ]
          }
        },
        {
          "name": "accessRecord",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  99,
                  99,
                  101,
                  115,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "article"
              },
              {
                "kind": "account",
                "path": "reader"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "articleId",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "initializeConfig",
      "discriminator": [
        208,
        127,
        21,
        1,
        194,
        190,
        196,
        70
      ],
      "accounts": [
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "feeBps",
          "type": "u16"
        },
        {
          "name": "usdcMint",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "registerArticle",
      "discriminator": [
        65,
        51,
        44,
        71,
        128,
        168,
        231,
        88
      ],
      "accounts": [
        {
          "name": "author",
          "writable": true,
          "signer": true
        },
        {
          "name": "article",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  114,
                  116,
                  105,
                  99,
                  108,
                  101
                ]
              },
              {
                "kind": "arg",
                "path": "articleId"
              }
            ]
          }
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "config.authority",
                "account": "config"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "articleId",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "priceUsdc",
          "type": "u64"
        }
      ]
    },
    {
      "name": "unlockArticle",
      "discriminator": [
        63,
        102,
        212,
        25,
        62,
        115,
        224,
        136
      ],
      "accounts": [
        {
          "name": "reader",
          "writable": true,
          "signer": true
        },
        {
          "name": "readerUsdcAta",
          "writable": true
        },
        {
          "name": "authorUsdcAta",
          "writable": true
        },
        {
          "name": "article",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  114,
                  116,
                  105,
                  99,
                  108,
                  101
                ]
              },
              {
                "kind": "arg",
                "path": "articleId"
              }
            ]
          }
        },
        {
          "name": "accessRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  99,
                  99,
                  101,
                  115,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "article"
              },
              {
                "kind": "account",
                "path": "reader"
              }
            ]
          }
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "config.authority",
                "account": "config"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "articleId",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "updatePrice",
      "discriminator": [
        61,
        34,
        117,
        155,
        75,
        34,
        123,
        208
      ],
      "accounts": [
        {
          "name": "author",
          "writable": true,
          "signer": true
        },
        {
          "name": "article",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  114,
                  116,
                  105,
                  99,
                  108,
                  101
                ]
              },
              {
                "kind": "arg",
                "path": "articleId"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "articleId",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "newPriceUsdc",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "accessRecord",
      "discriminator": [
        224,
        96,
        239,
        97,
        225,
        133,
        153,
        188
      ]
    },
    {
      "name": "article",
      "discriminator": [
        190,
        223,
        81,
        111,
        130,
        251,
        187,
        202
      ]
    },
    {
      "name": "config",
      "discriminator": [
        155,
        12,
        170,
        224,
        30,
        250,
        204,
        130
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "mathOverflow",
      "msg": "Math overflow occurred"
    },
    {
      "code": 6001,
      "name": "unauthorized",
      "msg": "Unauthorized access"
    },
    {
      "code": 6002,
      "name": "configInactive",
      "msg": "Config is inactive"
    },
    {
      "code": 6003,
      "name": "configPaused",
      "msg": "Config is paused"
    },
    {
      "code": 6004,
      "name": "invalidAmount",
      "msg": "Invalid amount"
    },
    {
      "code": 6005,
      "name": "articleNotInitialized",
      "msg": "Article not initialized"
    },
    {
      "code": 6006,
      "name": "authorCannotUnlock",
      "msg": "Author cannot unlock own article"
    },
    {
      "code": 6007,
      "name": "alreadyUnlocked",
      "msg": "Reader has already unlocked this article"
    },
    {
      "code": 6008,
      "name": "accessDenied",
      "msg": "Access denied - article not unlocked"
    }
  ],
  "types": [
    {
      "name": "accessRecord",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "reader",
            "type": "pubkey"
          },
          {
            "name": "article",
            "type": "pubkey"
          },
          {
            "name": "unlockedAt",
            "type": "i64"
          },
          {
            "name": "pricePaid",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "article",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "isInitialized",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "author",
            "type": "pubkey"
          },
          {
            "name": "priceUsdc",
            "type": "u64"
          },
          {
            "name": "articleId",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "unlockCount",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "config",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "isPaused",
            "type": "bool"
          },
          {
            "name": "feeBps",
            "type": "u16"
          },
          {
            "name": "usdcMint",
            "type": "pubkey"
          },
          {
            "name": "version",
            "type": "u8"
          },
          {
            "name": "totalArticles",
            "type": "u64"
          },
          {
            "name": "totalUnlocks",
            "type": "u64"
          }
        ]
      }
    }
  ]
};
