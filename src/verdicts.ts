import * as fs from "fs";
import * as path from "path";

const VERDICTS_PATH = path.join(process.cwd(), "verdicts.json");

export interface Verdict {
  jobId: string;
  decision: "complete" | "reject";
  reasoning: string;
  timestamp: string;
  deliverableUri: string;
  jobDescription: string;
}

export function loadVerdicts(): Record<string, Verdict> {
  if (!fs.existsSync(VERDICTS_PATH)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(VERDICTS_PATH, "utf8"));
  } catch {
    return {};
  }
}

export function saveVerdict(verdict: Verdict): void {
  const verdicts = loadVerdicts();
  if (verdicts[verdict.jobId]) {
    // Immutable — never overwrite an existing verdict
    console.log(`Verdict for job ${verdict.jobId} already exists — skipping`);
    return;
  }
  verdicts[verdict.jobId] = verdict;
  fs.writeFileSync(VERDICTS_PATH, JSON.stringify(verdicts, null, 2), "utf8");
  console.log(`Verdict saved for job ${verdict.jobId}: ${verdict.decision}`);
}

export function hasVerdict(jobId: string): boolean {
  const verdicts = loadVerdicts();
  return !!verdicts[jobId];
}
