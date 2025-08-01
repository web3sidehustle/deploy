import TelegramBot from "node-telegram-bot-api";
import { getOrCreateWallet } from "./utils/walletManager";
import { Packages } from "@kaiachain/kaia-agent-kit";
import { createPublicClient, http, formatUnits } from "viem";
import { kairos } from "viem/chains";
import { Abi } from "viem";
import kUSDTAbi from "../abi/usdt_abi.json";
import "dotenv/config";

// 👇 Define token contract address and ABI (KIP7/ERC20 ABI)
const KUSDT_ADDRESS = "0xYourKusdtTokenAddressHere"; // Replace with actual token address
const KIP7_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

export async function balanceCommand(bot: TelegramBot, msg: TelegramBot.Message) {
  const telegramId = msg.from?.id.toString();
  const username = msg.from?.username || undefined;
  const chatId = msg.chat.id;

  if (!telegramId) {
    await bot.sendMessage(chatId, "❌ Could not identify your Telegram account.");
    return;
  }

  try {
    const { privateKey, address } = await getOrCreateWallet(telegramId, username);
    if (!address) {
      await bot.sendMessage(chatId, "❌ Could not retrieve your wallet address.");
      return;
    }

    const publicClient = createPublicClient({
      chain: kairos,
      transport: http(),
    });

    // 🟡 Get native KAIA balance
    const kaiaBalance = await publicClient.getBalance({ address: address as `0x${string}` });
    const formattedKaia = formatUnits(kaiaBalance, 18);

    const kusdtBalance = await publicClient.readContract({
      address: process.env.USDT_CONTRACT_ADDRESS! as `0x${string}`,
      abi: kUSDTAbi as Abi,
      functionName: "balanceOf",
      args: [address as `0x${string}`],
    });

    const formattedKusdt = formatUnits(kusdtBalance as bigint, 18);

    const explorerUrl = `https://kairos.kaia.io/address/${address}?tabId=txList&page=1`;

    await bot.sendMessage(chatId, 
  `💰 <b>Your KAIA Wallet Balance</b>\n\n` +
  `📍 <b>Address:</b> <code>${address}</code>\n\n` +
  `💠 <b>KAIA:</b> ${formattedKaia} KAIA\n` +
  `🪙 <b>kUSDT:</b> ${formattedKusdt} kUSDT\n\n` +
  `🔗 <a href="${explorerUrl}">View on Kaiascan</a>`,  {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "✅ Satisfied", callback_data: "satisfied" }],
          [{ text: "💬 Talk to a live agent", callback_data: "live_agent", url: "https://t.me/+TpTPlZOWPpUxZWE0" }],
        ],
      },
    });

  } catch (error) {
    console.error("Balance error:", error);
    await bot.sendMessage(chatId, "❌ Failed to fetch balance. Please try again later.");
  }
}