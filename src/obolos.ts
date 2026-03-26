import { createWalletClient, createPublicClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

const OBOLOS_API = process.env.OBOLOS_API_URL || "https://obolos.tech";

// ERC-8183 escrow ABI (minimal — complete and reject)
const ESCROW_ABI = parseAbi([
  "function complete(uint256 jobId) external",
  "function reject(uint256 jobId) external",
  "function jobs(uint256 jobId) external view returns (address client, address agent, address evaluator, uint256 budget, uint8 status, string description, string deliverableUri)",
]);

export interface ObolosJob {
  id: string;
  description: string;
  deliverableUri: string;
  contractAddress: string;
  status: string;
}

export async function fetchSubmittedJobs(courtAddress: string): Promise<ObolosJob[]> {
  try {
    const url = `${OBOLOS_API}/api/jobs?evaluator=${courtAddress}&status=submitted`;
    const res = await fetch(url, {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      console.log(`Obolos API returned ${res.status} — no jobs this cycle`);
      return [];
    }

    const data = await res.json() as { jobs?: ObolosJob[] } | ObolosJob[];
    if (Array.isArray(data)) return data;
    if (data && "jobs" in data && Array.isArray(data.jobs)) return data.jobs;
    return [];
  } catch (err) {
    console.log(`Obolos API unreachable: ${(err as Error).message}`);
    return [];
  }
}

export async function fetchDeliverable(uri: string): Promise<string | null> {
  try {
    const res = await fetch(uri, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const text = await res.text();
    return text;
  } catch {
    return null;
  }
}

export async function submitVerdict(
  decision: "complete" | "reject",
  jobId: string,
  contractAddress: string,
  privateKey: `0x${string}`
): Promise<string> {
  const account = privateKeyToAccount(privateKey);

  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(process.env.RPC_URL || "https://mainnet.base.org"),
  });

  const publicClient = createPublicClient({
    chain: base,
    transport: http(process.env.RPC_URL || "https://mainnet.base.org"),
  });

  const functionName = decision === "complete" ? "complete" : "reject";

  const { request } = await publicClient.simulateContract({
    address: contractAddress as `0x${string}`,
    abi: ESCROW_ABI,
    functionName,
    args: [BigInt(jobId)],
    account,
  });

  const hash = await walletClient.writeContract(request);
  return hash;
}
