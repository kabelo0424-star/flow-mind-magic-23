import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { MODEL, getProvider, openaiOptions, friendlyAiError } = await import("@/lib/ai/gateway.server");
        const { getLovableAiGatewayRunId, withLovableAiGatewayRunIdHeader } = await import("@/lib/ai/run-id.server");
        let body: { messages: UIMessage[]; context?: string };
        try {
          body = await request.json();
        } catch {
          return new Response("Invalid request", { status: 400 });
        }
        try {
          const { provider, runIdFetch } = getProvider(getLovableAiGatewayRunId(request));
          const context = (body.context ?? "").slice(0, 20000);
          const result = streamText({
            model: provider.responses(MODEL),
            instructions: `You are MindFlow AI, a friendly productivity assistant. Use the user's workspace data below to answer questions and connect meetings, tasks and research. Be concise and use markdown. Today is ${new Date().toDateString()}.\n\nWORKSPACE DATA:\n${context}`,
            messages: await convertToModelMessages(body.messages),
            abortSignal: request.signal,
            providerOptions: openaiOptions,
          });
          return withLovableAiGatewayRunIdHeader(
            result.toUIMessageStreamResponse({ onError: (e) => friendlyAiError(e) }),
            runIdFetch,
          );
        } catch (e) {
          return new Response(friendlyAiError(e), { status: 500 });
        }
      },
    },
  },
});
