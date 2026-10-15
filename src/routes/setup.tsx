import { createFileRoute } from "@tanstack/react-router";
import { Download, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { resetData, useAppState } from "@/lib/store";

export const Route = createFileRoute("/setup")({
  head: () => ({
    meta: [
      { title: "Setup & Data — MindFlow AI" },
      { name: "description", content: "How to get started with MindFlow AI, plus export or reset your workspace data." },
      { property: "og:title", content: "Setup & Data — MindFlow AI" },
      { property: "og:description", content: "Getting started guide and data controls for MindFlow AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Setup,
});

const steps = [
  ["Explore the dashboard", "Sample meetings, tasks and research are pre-loaded so you can see everything working right away."],
  ["Summarize a meeting", "Go to Meetings → New meeting, paste your notes and click Save & summarize. Turn action items into tasks with one click."],
  ["Plan your work", "In Task Planner, describe a goal and let AI generate prioritized tasks with deadlines. Move tasks between columns to track progress."],
  ["Research a topic", "Enter any topic in Research to get a summary, key findings, a comparison table and sources to verify."],
  ["Ask the assistant", "The AI Assistant reads your workspace and can connect meetings, tasks and research for you."],
  ["Switch themes", "Use the Dark mode button at the bottom of the menu."],
];

function Setup() {
  const state = useAppState();
  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "mindflow-data.json";
    a.click();
  }
  return (
    <div className="max-w-3xl">
      <PageHeader title="Setup & Data" subtitle="Get up and running in a minute." />
      <Card className="mb-6">
        <CardHeader><CardTitle>Getting started</CardTitle></CardHeader>
        <CardContent>
          <ol className="space-y-4">
            {steps.map(([t, d], i) => (
              <li key={t} className="flex gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">{i + 1}</span>
                <div><p className="font-medium">{t}</p><p className="text-sm text-muted-foreground">{d}</p></div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Your data</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Your workspace is saved automatically in this browser. AI features run securely on the server — no keys are ever exposed in the page.</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportData}><Download />Export data</Button>
            <Button variant="destructive" onClick={() => { if (confirm("Reset all data to the sample workspace?")) { resetData(); localStorage.removeItem("mindflow:chat"); toast.success("Workspace reset"); } }}><RotateCcw />Reset to sample data</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
