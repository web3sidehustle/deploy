import TelegramBot from "node-telegram-bot-api";
import { kaiaDeFAIAgent } from "../agents/kaiaDefaiAgent";

export class TelegramIntegration {
  private bot: TelegramBot;
  private readonly MAX_MESSAGE_LENGTH = 400;
  private readonly MAX_RESULT_LENGTH = 100;

  constructor(token: string) {
    this.bot = new TelegramBot(token, { polling: true });
    this.bot.on("message", this.handleMessage.bind(this));
  }

  private escapeMarkdown(text: string): string {
    return text.replace(/[_*[\]()~`>#+=|{}.!]/g, "\\$&");
  }

  private truncateString(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + "... [truncated]";
  }

  private formatToolResult(result: any): string {
    try {
      const jsonString = JSON.stringify(result, null, 2);
      return this.escapeMarkdown(this.truncateString(jsonString, this.MAX_RESULT_LENGTH));
    } catch (error) {
      return `[Complex data structure - ${typeof result}]`;
    }
  }

  private suggestCommand(cmd: string): string {
    return `👉 Try this: \`${this.escapeMarkdown(cmd)}\``;
  }

  private async updateOrSplitMessage(
    chatId: number,
    messageId: number | undefined,
    text: string
  ): Promise<number> {
    if (text.length <= this.MAX_MESSAGE_LENGTH && messageId) {
      try {
        await this.bot.editMessageText(text, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: "MarkdownV2",
        });
        return messageId;
      } catch (error) {
        console.error("Error updating message:", error);
      }
    }

    try {
      const newMessage = await this.bot.sendMessage(chatId, text, {
        parse_mode: "MarkdownV2",
      });
      return newMessage.message_id;
    } catch (error) {
      console.error("Error sending message:", error);
      const truncated =
        text.substring(0, this.MAX_MESSAGE_LENGTH - 100) +
        "\n\n... [Message truncated due to length]";
      const fallbackMsg = await this.bot.sendMessage(chatId, truncated, {
        parse_mode: "MarkdownV2",
      });
      return fallbackMsg.message_id;
    }
  }

  private async handleMessage(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const text = msg.text;
    const username = msg.from?.username || "unknown";
    const firstName = msg.from?.first_name || "unknown";
    const userId = msg.from?.id.toString() || `anonymous-${chatId}`;

    if (!text) {
      await this.bot.sendMessage(chatId, "Sorry, I can only process text messages.");
      return;
    }

    if (text.startsWith("/")) {
      const command = text.trim().split(" ")[0];

      switch (command) {
        case "/start":
          await this.bot.sendMessage(chatId, 
            `@KaiaDeFAI_bot, a DeFi assistant for the Kaia blockchain on Telegram.

    💼 You can:
    • Get test tokens
    • Send and receive USDT or KAIA
    • Buy airtime
    • Check balances
    • More features coming soon...

Try a command:
👉 /faucet — Get test KAIA

Need help?
👉 /help

`);
        return;

        case "/balance": {
          const { balanceCommand } = await import("../../commands/balanceCommand");
          await balanceCommand(this.bot, msg);
          return;
        }

        case "/help": {
          const { helpCommand } = await import("../../commands/help");
          await helpCommand(this.bot, msg);
          return;
        }

        case "/mywallet": {
          const { myWalletCommand } = await import("../../commands/myWallet");
          await myWalletCommand(this.bot, msg);
          return;
        }

        case "/airtime": {
          const { airtimeCommand } = await import("../../commands/airtime");
          await airtimeCommand(this.bot, msg);
          return;
        }

        case "/claim": {
          const { claimUSDTCommand1 } = await import("../../commands/claimForUSDT");
          await claimUSDTCommand1(this.bot, msg);
          return;
        }

        case "/transferusdt": {
          const { transferUSDTCommand } = await import("../../commands/transferkUSDT");
          await transferUSDTCommand(this.bot, msg);
          return;
        }

        case "/transferkaia": {
          const { transferKAIACommand } = await import("../../commands/transferKAIA");
          await transferKAIACommand(this.bot, msg);
          return;
        }

        case "/faucet": {
          const { faucetCommand } = await import("../../commands/faucet");
          await faucetCommand(this.bot, msg);
          return;
        }

        case "/claimuser": {
          const { claimUSDTCommand } = await import("../../commands/claimUSDT");
          await claimUSDTCommand(this.bot, msg);
          return;
        }

        default:
          await this.bot.sendMessage(chatId, "Unknown command.");
          return;
      }
    }

    // 🧠 AI Response (cleaned version)
    try {
      const sentMessage = await this.bot.sendMessage(chatId, "Thinking...");
      console.log(`[AI Request] User (${userId}): ${text}`);

      let finalResponse = "";
      let toolResultText = "";

      const stream = await kaiaDeFAIAgent.stream(text, {
        threadId: `telegram-${chatId}`,
        resourceId: userId,
        context: [
          { role: "system", content: `User: ${firstName} (${username})` },
        ],
      });

      for await (const chunk of stream.fullStream) {
        switch (chunk.type) {
          case "text-delta":
            finalResponse += this.escapeMarkdown(chunk.textDelta);
            break;

          case "tool-result":
            toolResultText = this.formatToolResult(chunk.result);
            console.log("Tool result:", chunk.result);
            break;

          case "error":
            finalResponse += `\n❌ ${this.escapeMarkdown(String(chunk.error))}`;
            break;

          // Skip reasoning, tool-call for user chat
          default:
            break;
        }
      }

      let output = finalResponse.trim();
      if (toolResultText) {
        output += `\n\n✨ Result:\n\`\`\`\n${toolResultText}\n\`\`\``;
      }

      // Example: suggest /airtime command if relevant
      if (output.toLowerCase().includes("airtime")) {
        output += `\n\n${this.suggestCommand("/airtime 08012345678 1500 NGN")}`;
      }

      await this.updateOrSplitMessage(chatId, sentMessage.message_id, output);
      console.log("[AI Response] ✅ Sent.");
    } catch (error) {
      console.error("Error processing message:", error);
      await this.bot.sendMessage(
        chatId,
        "Sorry, I encountered an error processing your message. Please try again."
      );
    }
  }
}
