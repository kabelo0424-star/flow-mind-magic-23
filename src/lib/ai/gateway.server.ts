import { createOpenAI } from "@ai-sdk/openai";
import { APICallError, NoObjectGeneratedError, Output, streamText, type ModelMessage } from "ai";
import type { z } from "zod";
import { createLovableAiGatewayRunIdFetch } from "./run-id.server";

export const MODEL = "openai/gpt-6-astra";

export const openaiOptions = {
  openai: {
    forceReasoning: true,
    reasoningEffort: "low",
    reasoningSummary: "auto",
    store: false,
    include: ["reasoning.encrypted_content"],
  },
} as const;

export function getProvider(initialRunId?: string) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("AI is not configured yet. Please try again later.");
  const runIdFetch = createLovableAiGatewayRunIdFetch(initialRunId);
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
  return { provider, runIdFetch };
}

export function friendlyAiError(error: unknown): string {
  const status = APICallError.isInstance(error) ? error.statusCode : undefined;
  if (status === 429) return "The AI is busy right now. Please wait a moment and try again.";
  if (status === 402) return "AI credits have run out. Add credits in your workspace billing settings to continue.";
  if (status === 403) return "AI access is currently blocked for this workspace.";
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong while talking to the AI.";
}

export async function generateStructured<T>(schema: z.ZodType<T>, instructions: string, prompt: string): Promise<T> {
  const { provider } = getProvider();
  const messages: ModelMessage[] = [{ role: "user", content: prompt }];
  try {
    const result = streamText({
      model: provider.responses(MODEL),
      instructions,
      messages,
      output: Output.object({ schema }),
      providerOptions: openaiOptions,
      maxRetries: 1,
    });
    return (await result.output) as T;
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error) && error.text) {
      try {
        return schema.parse(JSON.parse(error.text));
      } catch {
        /* fall through */
      }
    }
    console.error(error);
    throw new Error(friendlyAiError(error));
  }
}
