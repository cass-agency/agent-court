import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export interface EvaluationResult {
  decision: "complete" | "reject";
  reasoning: string;
}

export async function evaluateDeliverable(
  jobDescription: string,
  deliverableUri: string,
  deliverableContent: string | null
): Promise<EvaluationResult> {
  let prompt: string;

  if (!deliverableContent) {
    return {
      decision: "reject",
      reasoning: `Deliverable at ${deliverableUri} was unreachable. Auto-rejecting as the work cannot be verified.`,
    };
  }

  prompt = `You are The Court — an impartial AI judge for freelance job escrow contracts on the Obolos platform.

Your task: evaluate whether the submitted deliverable satisfies the job requirements.

## Job Description
${jobDescription}

## Deliverable URI
${deliverableUri}

## Deliverable Content
${deliverableContent.slice(0, 8000)}

## Instructions
Assess whether the deliverable genuinely satisfies the job description. Be fair but rigorous.

Respond with a JSON object (no markdown, just raw JSON):
{
  "decision": "complete" | "reject",
  "reasoning": "2-3 sentences explaining your verdict"
}`;

  const response = await client.messages.create({
    model: "claude-3-5-haiku-20241022",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const result = JSON.parse(text.trim()) as EvaluationResult;
    if (result.decision !== "complete" && result.decision !== "reject") {
      throw new Error("Invalid decision value");
    }
    return result;
  } catch {
    // Parse failure — default reject with raw text
    return {
      decision: "reject",
      reasoning: `Failed to parse Claude response. Raw output: ${text.slice(0, 200)}`,
    };
  }
}
