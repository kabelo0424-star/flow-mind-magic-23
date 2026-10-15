import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const meetingSchema = z.object({
  summary: z.string(),
  decisions: z.array(z.string()),
  actionItems: z.array(z.object({ task: z.string(), owner: z.string(), due: z.string() })),
  followUp: z.string(),
});
export type MeetingSummary = z.infer<typeof meetingSchema>;

const planSchema = z.object({
  tasks: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      priority: z.enum(["high", "medium", "low"]),
      dueInDays: z.number(),
    }),
  ),
});
export type TaskPlan = z.infer<typeof planSchema>;

const researchSchema = z.object({
  summary: z.string(),
  keyFindings: z.array(z.string()),
  comparison: z.array(z.object({ aspect: z.string(), optionA: z.string(), optionB: z.string() })),
  comparisonLabels: z.object({ optionA: z.string(), optionB: z.string() }),
  sources: z.array(z.object({ title: z.string(), publisher: z.string(), url: z.string(), note: z.string() })),
});
export type ResearchResult = z.infer<typeof researchSchema>;

export const summarizeMeeting = createServerFn({ method: "POST" })
  .inputValidator((d: { title: string; notes: string }) =>
    z.object({ title: z.string().max(300), notes: z.string().min(10).max(40000) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { generateStructured } = await import("./ai/gateway.server");
    return generateStructured(
      meetingSchema,
      "You are a meticulous meeting analyst. Summarize in 3-5 sentences, list key decisions, extract action items with owner (use 'Unassigned' if unknown) and due (a short date or 'TBD'), and write a concise, friendly follow-up email body.",
      `Meeting: ${data.title}\n\nNotes:\n${data.notes}`,
    );
  });

export const planTasks = createServerFn({ method: "POST" })
  .inputValidator((d: { goal: string }) => z.object({ goal: z.string().min(3).max(4000) }).parse(d))
  .handler(async ({ data }) => {
    const { generateStructured } = await import("./ai/gateway.server");
    const plan = await generateStructured(
      planSchema,
      "You are a productivity coach. Break the goal into 3-7 concrete, actionable tasks ordered by priority. dueInDays is a realistic integer number of days from today (0-60).",
      data.goal,
    );
    return { tasks: plan.tasks.slice(0, 8) };
  });

export const researchTopic = createServerFn({ method: "POST" })
  .inputValidator((d: { topic: string }) => z.object({ topic: z.string().min(3).max(1000) }).parse(d))
  .handler(async ({ data }) => {
    const { generateStructured } = await import("./ai/gateway.server");
    return generateStructured(
      researchSchema,
      "You are a careful research assistant. Give a balanced summary, 4-6 key findings, a comparison table of the two most relevant options/viewpoints (4-6 aspects), and 3-6 well-known, reputable sources (official docs, journals, major publications) with real, stable URLs you are confident exist. Never invent URLs; prefer homepage or well-known article URLs.",
      data.topic,
    );
  });
