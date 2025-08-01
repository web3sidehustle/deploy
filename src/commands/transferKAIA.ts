// src/commands/transferKAIACommand.ts

import TelegramBot from "node-telegram-bot-api";
import { getOrCreateWallet } from "./utils/walletManager";
import { createWalletClient, parseEther, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { kairos } from "viem/chains";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function transferKAIACommand(bot: TelegramBot, msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();
  const username = msg.from?.username || undefined;

  if (!telegramId) {
    await bot.sendMessage(chatId, "❌ Unable to identify your Telegram account.");
    return;
  }

  const parts = msg.text?.split(" ");
  const rawRecipient = parts?.[1];
  const amountStr = parts?.[2];

  if (!rawRecipient || !amountStr || isNaN(Number(amountStr))) {
    await bot.sendMessage(chatId, "❌ Usage: /transferkaia <@username|0xAddress> <amount>");
    return;
  }

  let recipientAddress: `0x${string}` | null = null;

  // Resolve alias or raw address
  if (rawRecipient.startsWith("@")) {
    const username = rawRecipient.slice(1);
    const wallet = await prisma.wallet.findUnique({ where: { username } });

    if (!wallet) {
      await bot.sendMessage(chatId, `❌ Alias @${username} not found.`);
      return;
    }
    recipientAddress = wallet.address as `0x${string}`;
  } else if (rawRecipient.startsWith("0x") && rawRecipient.length === 42) {
    recipientAddress = rawRecipient as `0x${string}`;
  } else {
    await bot.sendMessage(chatId, "❌ Invalid recipient address or alias.");
    return;
  }

  try {
    const { privateKey, address: sender } = await getOrCreateWallet(telegramId, username);
    const account = privateKeyToAccount(privateKey as `0x${string}`);

    const walletClient = createWalletClient({
      account,
      chain: kairos,
      transport: http(kairos.rpcUrls.default.http[0]),
    });

    const value = parseEther(amountStr); // amount in KAIA

    const hash = await walletClient.sendTransaction({
      to: recipientAddress,
      value,
    });

    const explorerUrl = `https://kairos.kaiascan.io/tx/${hash}`;
    await bot.sendMessage(
      chatId,
      `✅ <b>Transfer successful</b>\n\n💸 <code>${amountStr} KAIA</code> sent to <code>${recipientAddress}</code>\n\n🔗 <a href="${explorerUrl}">View on Kaiascan</a>`,
      { parse_mode: "HTML" }
    );
  } catch (err) {
    console.error("KAIA Transfer failed:", err);
    await bot.sendMessage(chatId, "❌ Transfer failed. Please try again.");
  }
}