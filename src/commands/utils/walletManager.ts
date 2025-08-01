import { PrismaClient } from "@prisma/client";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import crypto from "crypto";

const prisma = new PrismaClient();
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // Must be 64 hex chars
const IV_LENGTH = 16;

function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY, "hex"), iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

function decrypt(encryptedData: string): string {
  const [ivHex, encryptedHex] = encryptedData.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const encryptedText = Buffer.from(encryptedHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY, "hex"), iv);
  const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
  return decrypted.toString();
}

export async function getOrCreateWallet(telegramId: string, username?: string) {
  let wallet = await prisma.wallet.findUnique({ where: { telegramId } });

  if (!wallet) {
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);

    wallet = await prisma.wallet.create({
      data: {
        telegramId,
        username,
        address: account.address,
        privateKey: encrypt(privateKey),
      },
    });
  } else if (username && wallet.username !== username) {
    // Update username if changed
    wallet = await prisma.wallet.update({
      where: { telegramId },
      data: { username },
    });
  }

  return {
    address: wallet.address,
    privateKey: decrypt(wallet.privateKey),
  };
}