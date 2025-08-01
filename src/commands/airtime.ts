// src/commands/airtime.ts
import TelegramBot from "node-telegram-bot-api";
import { getOrCreateWallet } from "./utils/walletManager";
import { getUSDTPriceInNGN } from "../lib/conversion";
import { sendUSDT } from "../lib/sendUSDT";
import { topUpAirtime } from "../lib/reloadly";
import { createInvoice } from "../lib/invoice";

const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS as `0x${string}`;

export async function airtimeCommand(bot: TelegramBot, msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();

  if (!telegramId) {
    await bot.sendMessage(chatId, "❌ Could not identify your Telegram account.");
    return;
  }

  const parts = msg.text?.trim().split(" ");
  const phone = parts?.[1];
  const amountStr = parts?.[2];
  const countryCode = parts?.[3];

  if (!phone || !amountStr || !countryCode || isNaN(Number(amountStr))) {
    await bot.sendMessage(
      chatId,
      "❌ Usage: /airtime <phone> <amountNGN> <countryCode>\n\nExample: /airtime 2348012345678 1000 NG"
    );
    return;
  }

  const amountNGN = Number(amountStr);

  try {
    const { privateKey, address: sender } = await getOrCreateWallet(telegramId);

    // 1. Convert NGN → USDT
    const usdtAmount = await getUSDTPriceInNGN(amountNGN);

    // 2. Charge user in USDT → Send to Treasury
    const transferHash = await sendUSDT({
      fromPrivateKey: privateKey,
      toAddress: TREASURY_ADDRESS,
      amount: usdtAmount,
    });


    if (!transferHash) {
      await bot.sendMessage(chatId, "❌ Failed to transfer USDT for airtime. Please try again.");
      return;
    }

    // 3. Proceed with airtime top-up via Reloadly
    const reloadlyResult = await topUpAirtime({
      phoneNumber: phone,
      amount: amountNGN,
      operatorId: 341,
    });

    if (!reloadlyResult || !reloadlyResult.transactionId) {
      await bot.sendMessage(chatId, "⚠️ Airtime top-up failed. Refunding USDT...");
      // Optional: Refund user (out of scope)
       try {
        const refundTx = await sendUSDT({
        fromPrivateKey: process.env.WALLET_PRIVATE_KEY!, // Add this to .env
        toAddress: sender,
        amount: usdtAmount,
        });

        if (refundTx) {
        await bot.sendMessage(
            chatId,
            `💸 Refund successful.\n🔁 Sent back ${usdtAmount} kUSDT to your wallet.\n🔗 https://kairos.kaiascan.io/tx/${refundTx}`
        );
        } else {
        await bot.sendMessage(chatId, "❌ Refund failed. Please contact support.",
            { parse_mode: "HTML",
            reply_markup: {
            inline_keyboard: [
            [{ text: "✅ Satisfied", callback_data: "satisfied" }],
            [{ text: "💬 Talk to a live agent", callback_data: "live_agent", url: "https://t.me/+TpTPlZOWPpUxZWE0" }],
            ],
            },
            }
        );
        }
    } catch (refundError) {
        console.error("Refund error:", refundError);
        await bot.sendMessage(chatId, "❌ Refund failed due to an internal error. Please contact support.",
            { parse_mode: "HTML",
            reply_markup: {
            inline_keyboard: [
            [{ text: "✅ Satisfied", callback_data: "satisfied" }],
            [{ text: "💬 Talk to a live agent", callback_data: "live_agent", url: "https://t.me/+TpTPlZOWPpUxZWE0" }],
            ],
        },
        }
        );
    }
      return;
    }

    // 4. Send invoice and confirmation
    const invoice = await createInvoice({
        type: "airtime",
        from: sender,
        to: phone, // use phone here
        value: amountNGN,
        token: "NGN",
        txHash: transferHash,
    });


    const explorerUrl = `https://kairos.kaiascan.io/tx/${transferHash}`;
    await bot.sendMessage(
      chatId,
      `✅ <b>Airtime Purchase Successful</b>\n\n📱 Phone: <code>${phone}</code>\n💵 Amount: <b>₦${amountNGN}</b>\n🔗 <a href="${explorerUrl}">View transaction</a>\n\n🧾 Invoice:\n${invoice}`,
        { parse_mode: "HTML",
            reply_markup: {
            inline_keyboard: [
            [{ text: "✅ Satisfied", callback_data: "satisfied" }],
            [{ text: "💬 Talk to a live agent", callback_data: "live_agent", url: "https://t.me/+TpTPlZOWPpUxZWE0" }],
            ],
        },
        }
    );
  } catch (err) {
    console.error("Airtime command error:", err);
    await bot.sendMessage(chatId, "❌ Something went wrong while processing your airtime purchase.",
        { parse_mode: "HTML",
            reply_markup: {
            inline_keyboard: [
            [{ text: "✅ Satisfied", callback_data: "satisfied" }],
            [{ text: "💬 Talk to a live agent", callback_data: "live_agent", url: "https://t.me/+TpTPlZOWPpUxZWE0" }],
            ],
        },
        }
    );
  }
}