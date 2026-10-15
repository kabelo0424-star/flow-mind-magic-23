import { useSyncExternalStore } from "react";
import type { MeetingSummary, ResearchResult } from "./ai.functions";

export type Priority = "high" | "medium" | "low";
export type Status = "todo" | "in_progress" | "done";
export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  due: string; // yyyy-mm-dd
  project: string;
}
export interface Meeting {
  id: string;
  title: string;
  date: string;
  attendees: string[];
  notes: string;
  summary?: MeetingSummary;
}
export interface Research {
  id: string;
  topic: string;
  createdAt: string;
  result?: ResearchResult;
}
export interface AppState {
  tasks: Task[];
  meetings: Meeting[];
  research: Research[];
}

const KEY = "mindflow:v1";
const day = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};
export const uid = () => Math.random().toString(36).slice(2, 10);

function seed(): AppState {
  return {
    tasks: [
      { id: "t1", title: "Finalize Q4 product roadmap", description: "Incorporate feedback from leadership review.", priority: "high", status: "in_progress", due: day(1), project: "Product" },
      { id: "t2", title: "Prepare investor update deck", description: "Metrics, highlights, hiring plan.", priority: "high", status: "todo", due: day(3), project: "Leadership" },
      { id: "t3", title: "Review onboarding flow designs", description: "Give feedback to Lerato on Figma v3.", priority: "medium", status: "todo", due: day(2), project: "Design" },
      { id: "t4", title: "Write literature review draft", description: "Chapter 2 of thesis on remote collaboration.", priority: "medium", status: "in_progress", due: day(6), project: "Research" },
      { id: "t5", title: "Send customer interview recap", description: "Share findings with the growth team.", priority: "low", status: "done", due: day(-1), project: "Growth" },
      { id: "t6", title: "Set up analytics dashboard", description: "Track activation & retention.", priority: "medium", status: "done", due: day(-3), project: "Growth" },
      { id: "t7", title: "Book team offsite venue", description: "Cape Town, 12 people, 2 days.", priority: "low", status: "todo", due: day(10), project: "Operations" },
      { id: "t8", title: "Fix billing email bug", description: "Invoices sent twice for annual plans.", priority: "high", status: "done", due: day(-2), project: "Engineering" },
    ],
    meetings: [
      {
        id: "m1",
        title: "Weekly Product Sync",
        date: day(-1),
        attendees: ["Dimakatso", "Thabo", "Lerato", "James"],
        notes:
          "Thabo: beta signups up 32% week over week. Lerato showed onboarding v3 — team likes the checklist approach. Decision: ship onboarding v3 to 20% of users next Tuesday. James raised concern about billing email duplicates; he'll fix by Friday. Dimakatso to update roadmap with mobile app pushed to Q1. Need to schedule customer interviews — Lerato owns.",
        summary: {
          summary: "The team reviewed beta growth (+32% WoW) and the new onboarding v3 design, which was well received. Mobile app work moves to Q1, and a billing email bug was flagged for an urgent fix.",
          decisions: ["Roll out onboarding v3 to 20% of users next Tuesday", "Move the mobile app to Q1"],
          actionItems: [
            { task: "Fix duplicate billing emails", owner: "James", due: "Friday" },
            { task: "Update roadmap with Q1 mobile timeline", owner: "Dimakatso", due: "Tomorrow" },
            { task: "Schedule customer interviews", owner: "Lerato", due: "Next week" },
          ],
          followUp: "Hi team, thanks for a great sync! Quick recap: onboarding v3 goes to 20% of users next Tuesday, and mobile moves to Q1. James is on the billing bug (Friday), I'll update the roadmap, and Lerato will set up customer interviews. Shout if I missed anything!",
        },
      },
      {
        id: "m2",
        title: "Thesis Supervisor Check-in",
        date: day(-4),
        attendees: ["Dimakatso", "Prof. Nkosi"],
        notes: "Discussed chapter 2 structure. Prof suggested adding 2021-2024 studies on hybrid work. Deadline for draft in two weeks. Consider survey method instead of interviews.",
      },
      {
        id: "m3",
        title: "Marketing Campaign Kickoff",
        date: day(-7),
        attendees: ["Dimakatso", "Aisha", "Ben"],
        notes: "Agreed on 'Work smarter' theme. Budget R120k. Aisha drafts copy, Ben handles paid social. Launch in 3 weeks.",
      },
    ],
    research: [
      {
        id: "r1",
        topic: "Remote vs hybrid work productivity",
        createdAt: day(-2),
        result: {
          summary: "Evidence suggests hybrid arrangements often match or slightly improve productivity while boosting retention, though outcomes depend heavily on role type and management practices.",
          keyFindings: [
            "Hybrid work reduced attrition by about a third in a large randomized trial.",
            "Fully remote setups can hurt mentoring and junior employee development.",
            "Focus work benefits from home days; collaboration benefits from shared office days.",
            "Clear coordination norms matter more than the location policy itself.",
          ],
          comparisonLabels: { optionA: "Fully remote", optionB: "Hybrid" },
          comparison: [
            { aspect: "Individual focus", optionA: "High", optionB: "High on home days" },
            { aspect: "Collaboration", optionA: "Harder, needs tooling", optionB: "Strong on office days" },
            { aspect: "Retention", optionA: "Good", optionB: "Very good" },
            { aspect: "Cost", optionA: "Lowest office cost", optionB: "Moderate" },
          ],
          sources: [
            { title: "Hybrid working from home improves retention without damaging performance", publisher: "Nature", url: "https://www.nature.com/articles/s41586-024-07500-2", note: "Randomized trial (Bloom et al., 2024)" },
            { title: "Work Trend Index", publisher: "Microsoft", url: "https://www.microsoft.com/en-us/worklab/work-trend-index", note: "Annual survey of knowledge workers" },
            { title: "State of the Global Workplace", publisher: "Gallup", url: "https://www.gallup.com/workplace/349484/state-of-the-global-workplace.aspx", note: "Engagement data" },
          ],
        },
      },
      { id: "r2", topic: "Best note-taking methods for students", createdAt: day(-5) },
    ],
  };
}

let state: AppState | null = null;
const serverState = seed();
const listeners = new Set<() => void>();

function get(): AppState {
  if (state) return state;
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? (JSON.parse(raw) as AppState) : seed();
  } catch {
    state = seed();
  }
  return state;
}

export function setState(fn: (s: AppState) => AppState) {
  state = fn(get());
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full */
  }
  listeners.forEach((l) => l());
}

export function resetData() {
  setState(() => seed());
}

export function useAppState(): AppState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    get,
    () => serverState,
  );
}

export function workspaceContext(s: AppState): string {
  return JSON.stringify({
    tasks: s.tasks.map(({ title, priority, status, due, project }) => ({ title, priority, status, due, project })),
    meetings: s.meetings.map((m) => ({ title: m.title, date: m.date, attendees: m.attendees, summary: m.summary?.summary ?? m.notes, actionItems: m.summary?.actionItems })),
    research: s.research.map((r) => ({ topic: r.topic, summary: r.result?.summary, findings: r.result?.keyFindings })),
  });
}
