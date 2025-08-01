## 📘 Project Overview: KaiaDeFAI

**KaiaDeFAI** is a **DeFi-inspired AI assistant** that helps users seamlessly interact with the **Kaia blockchain** via **Telegram**. It combines the accessibility of chat interfaces with the power of decentralized finance tools — making Web3 more approachable for everyone.

### 🧩 What Problem Are We Solving?

Interacting with DeFi platforms often requires:

* Deep technical knowledge
* Manual wallet operations
* Navigation across multiple dApps

**KaiaDeFAI** solves this by letting users **chat their way through DeFi actions** like:

* Claiming test tokens
* Sending USDT or KAIA
* Topping up phone airtime
* Checking balances
* Viewing wallet addresses
* (Coming soon) Swapping tokens or requesting airdrops

All of this is done through simple Telegram commands, powered by **Mastra AI** and the **Kaia Agent Kit**.

---

### 🔐 Custody Model: A Transitional Hybrid

This version of KaiaDeFAI uses a **custodial model**, where user wallets are managed server-side. This:

* Makes onboarding easy for non-technical users
* Enables smooth AI execution of blockchain actions

However, it is **not fully decentralized**. In the spirit of DeFi, **future versions** will:

* Allow users to connect their own wallets (via WalletConnect, Kaia Wallet, or local key storage)
* Ensure full **non-custodial control**

> ⚠️ **Note:** As such, we position this tool as "DeFi-inspired" rather than a strict DeFAI implementation.

---

Here’s a complete **"How to Set Up the Project Locally"** section you can add to your `README.md` for the **KaiaDeFAI** Telegram bot:

---

## 🛠️ Local Setup

Follow these steps to run the KaiaDeFAI Telegram bot locally:

### 📦 Prerequisites

Ensure you have the following installed:

* Node.js `>=18`
* `pnpm` (recommended) or `npm`
* SQLite (or just use LibSQL with file storage)
* A Telegram bot token from [@BotFather](https://t.me/BotFather)
* Reloadly account (for airtime)
* Kaia wallet and RPC access

---

### 🔑 1. Clone the repo

```bash
git clone https://github.com/your-username/kaia-defai-bot.git
cd kaia-defai-bot
```

---

### 📁 2. Install dependencies

```bash
pnpm install
# or
npm install
```

---

### 🔐 3. Configure environment variables

Create a `.env` file in the root with the following variables:

```env
TELEGRAM_BOT_TOKEN=your_telegram_token
FAUCET_PRIVATE_KEY=your_faucet_wallet_private_key
TREASURY_ADDRESS=your_treasury_wallet_address
TREASURY_PK=

RELOADLY_CLIENT_ID=your_reloadly_client_id
RELOADLY_CLIENT_SECRET=your_reloadly_client_secret
RELOADLY_OPERATOR_ID=your_reloadly_operator_id

OPENROUTER_API_KEY=

WALLET_SECRET_KEY=
USDT_CONTRACT_ADDRESS=
KAIA_USDT_PRIVATE_KEY=
KUSDT_CLAIM_CONTRACT=
KUSDT_CLAIM_SIGNER=
WALLET_PRIVATE_KEY=
KAIROS_FAUCET_WALLET=

RPC_PROVIDER_URL=
KAIASCAN_API_KEY=

WALLET_PRIVATE_KEY=your_default_wallet_for_bot  # optional
```

---

### 💽 4. Start the bot locally

```bash
pnpm run dev
# or
npm run dev
```

The bot will start and respond to messages on Telegram.

---

### 🧠 Optional: Use with Ollama or Mastra locally

* If you're running **Mastra AI tools**, make sure `mastra.db` is present or automatically created.
* Ollama can be used to run local LLMs. Update your LLM config in `openrouterLLM.ts` or use Mastra’s `ollamaLLM()` adapter.



---

## 🚀 Usage Guide

All actions are performed via AI-guided conversations or Telegram slash commands.

### `/start`

Displays a brief intro and available features.

---

### `/faucet`

Get 1 KAIA test token from the faucet.
🔁 Can only be used once per account/address every 24 hours.

> AI Output Example:

```
Here's how to get test KAIA tokens:
✅ Type: /faucet
```

---

### `/claim`

Claim 1000 kUSDT from the claim faucet contract.
Useful for testing transfers or airtime topups.

> AI Output Example:

```
You can claim 1000 kUSDT once every 24 hours:
✅ Type: /claim
```

---

### `/balance`

Check the current balance of your wallet (KAIA + kUSDT).

> AI Output Example:

```
Your wallet balance is:
- 1.00 KAIA
- 1000.00 kUSDT
✅ Use: /balance
```

---

### `/mywallet`

Displays your wallet address for receiving tokens or cross-chain tests.

> AI Output Example:

```
Here’s your wallet address:
0x1234...abcd
✅ Use: /mywallet
```

---

### `/transferusdt <receiver> <amount>`

Send USDT (kUSDT) to another wallet or user.
You can use either a wallet address or @Telegram username.

> Example:

```
/transferusdt 0xabc...123 500
/transferusdt @joe 100
```

> AI Output Example:

```
To send USDT, type:
✅ /transferusdt @username 100
```

---

### `/transferkaia <receiver> <amount>`

Send KAIA (native token) to any wallet or user.

> Example:

```
/transferkaia 0xabc...123 1.5
/transferkaia @joe 2.0
```

> AI Output Example:

```
To transfer KAIA, type:
✅ /transferkaia 0xWalletAddress 1.5
```

---

### `/airtime <phone> <amount> NGN`

Buy Nigerian airtime with USDT from your wallet.
Supported via Reloadly API and treasury wallet.

> Example:

```
/airtime 08012345678 1500 NGN
```

> AI Output Example:

```
To recharge your line, try:
✅ /airtime 08123456789 1000 NGN
```

---

### `/swap <amount> <fromToken> <toToken>` *(Coming soon)*

Swap one token to another (e.g., kUSDT → KAIA).
Will route via Kaia DEX or supported aggregator.

> Example:

```
/swap 1000 kUSDT KAIA
```

> AI Output Example:

```
To swap tokens, type:
✅ /swap 1000 kUSDT KAIA
```

---

### `/airdrop` *(Coming soon)*

Get test airdrops from supported testnet campaigns.

> AI Output Example:

```
Airdrop is coming soon. Stay tuned! 🚀
```

---

## 💡 How It Works

The bot uses the [Mastra AI Framework](https://github.com/mastra-ai/mastra) and [Kaia Agent Kit](https://www.npmjs.com/package/@kaiachain/kaia-agent-kit) to:

* Parse natural language requests
* Map them to Web3 actions
* Execute smart contract calls
* Return clean, Telegram-friendly responses

Each feature is implemented as a **Mastra Tool**, with consistent output patterns and fallback handling.

---

## 📦 Tech Stack

* **Telegram Bot API**
* **Mastra AI Framework**
* **Kaia Agent Kit** (ERC20/KIP7/KAIASCAN/NATIVE TOKEN tools)
* **Reloadly API** (airtime)
* **SQLite + LibSQLStore** (for memory & state)
* **Node.js + TypeScript**

---

## 🛡️ Security Notice

This early version **manages user private keys server-side** for simplicity. Users should **not treat these wallets as secure** for holding real assets. This tool is meant for:

* Testnet
* Hackathons
* Learning
* Fast DeFi prototyping


