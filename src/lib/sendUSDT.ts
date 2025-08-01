// lib/sendUSDT.ts
import { createWalletClient, http, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { kairos } from "viem/chains";

import ERC20_ABI from "../abi/usdt_abi.json";

const USDT_CONTRACT_ADDRESS = process.env.USDT_CONTRACT_ADDRESS!;

export async function sendUSDT({
  fromPrivateKey,
  toAddress,
  amount,
}: {
  fromPrivateKey: string;
  toAddress: string;
  amount: number;
}): Promise<string> {
  const account = privateKeyToAccount(fromPrivateKey as `0x${string}`);

  const walletClient = createWalletClient({
    account,
    chain: kairos,
    transport: http(kairos.rpcUrls.default.http[0]),
  });

  const contract = {
    abi: ERC20_ABI,
    address: USDT_CONTRACT_ADDRESS as `0x${string}`,
  };

  const amountInUnits = parseUnits(amount.toString(), 18); // assumes 18 decimals

  const hash = await walletClient.writeContract({
    ...contract,
    functionName: "transfer",
    args: [toAddress as `0x${string}`, amountInUnits],
  });

  return hash;
}