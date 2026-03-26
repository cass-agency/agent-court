import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

const ENV_PATH = path.join(process.cwd(), ".env");

export function initWallet(): { privateKey: `0x${string}`; address: string } {
  dotenv.config({ path: ENV_PATH });

  let privateKey = process.env.COURT_PRIVATE_KEY as `0x${string}` | undefined;

  if (!privateKey) {
    console.log("No wallet found — generating new Court wallet...");
    privateKey = generatePrivateKey();

    // Append to .env
    const envLine = `\nCOURT_PRIVATE_KEY=${privateKey}\n`;
    fs.appendFileSync(ENV_PATH, envLine, "utf8");
    console.log(`Wallet generated and saved to .env`);
  }

  const account = privateKeyToAccount(privateKey);
  return { privateKey, address: account.address };
}
