import * as dotenv from "dotenv";
dotenv.config();

import { initWallet } from "./wallet";
import { startPoller } from "./poller";
import { startServer } from "./server";

function main() {
  const { address, privateKey } = initWallet();

  console.log(`\n==============================`);
  console.log(`  Agent Court`);
  console.log(`  Wallet: ${address}`);
  console.log(`==============================\n`);

  const port = parseInt(process.env.PORT || "3000", 10);
  startServer(address, port);
  startPoller(address, privateKey);
}

main();
