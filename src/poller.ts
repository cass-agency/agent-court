import { fetchSubmittedJobs, fetchDeliverable, submitVerdict } from "./obolos";
import { evaluateDeliverable } from "./evaluator";
import { saveVerdict, hasVerdict } from "./verdicts";

const POLL_INTERVAL_MS = 60 * 1000; // 60 seconds

export function startPoller(courtAddress: string, privateKey: `0x${string}`): void {
  console.log(`Court polling every 60s for jobs with evaluator=${courtAddress}`);

  const poll = async () => {
    console.log(`[${new Date().toISOString()}] Polling Obolos...`);

    try {
      const jobs = await fetchSubmittedJobs(courtAddress);
      console.log(`Found ${jobs.length} submitted job(s)`);

      for (const job of jobs) {
        if (hasVerdict(job.id)) {
          console.log(`Job ${job.id} already has verdict — skipping`);
          continue;
        }

        console.log(`Evaluating job ${job.id}: ${job.deliverableUri}`);

        const deliverableContent = await fetchDeliverable(job.deliverableUri);
        const evaluation = await evaluateDeliverable(
          job.description,
          job.deliverableUri,
          deliverableContent
        );

        console.log(`Verdict for job ${job.id}: ${evaluation.decision}`);
        console.log(`Reasoning: ${evaluation.reasoning}`);

        // Save verdict first (immutable once written)
        saveVerdict({
          jobId: job.id,
          decision: evaluation.decision,
          reasoning: evaluation.reasoning,
          timestamp: new Date().toISOString(),
          deliverableUri: job.deliverableUri,
          jobDescription: job.description,
        });

        // Submit on-chain if contract address is provided
        if (job.contractAddress && process.env.SUBMIT_ONCHAIN !== "false") {
          try {
            const txHash = await submitVerdict(
              evaluation.decision,
              job.id,
              job.contractAddress,
              privateKey
            );
            console.log(`Tx submitted for job ${job.id}: ${txHash}`);
          } catch (err) {
            console.error(`On-chain submission failed for job ${job.id}: ${(err as Error).message}`);
            // Verdict is already saved — won't re-evaluate
          }
        }
      }
    } catch (err) {
      console.error(`Poll cycle error: ${(err as Error).message}`);
    }
  };

  // Run immediately, then on interval
  poll();
  setInterval(poll, POLL_INTERVAL_MS);
}
