import { getOrCreateWallet } from "./utils/walletManager";
import TelegramBot from "node-telegram-bot-api";

export async function myWalletCommand(bot: TelegramBot, msg: TelegramBot.Message) {
  const telegramId = msg.from?.id.toString();
  const username = msg.from?.username || undefined;
  const chatId = msg.chat.id;

  if (!telegramId) {
    await bot.sendMessage(chatId, "❌ Could not identify your Telegram account.");
    return;
  }

  const { privateKey, address } = await getOrCreateWallet(telegramId, username);

  await bot.sendMessage(chatId, `🪪 Your wallet address:\n<code>${address}</code>`, {
    parse_mode: "HTML",
  });
}