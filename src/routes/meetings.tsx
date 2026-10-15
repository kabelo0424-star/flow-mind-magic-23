import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Copy, ListPlus, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { summarizeMeeting } from "@/lib/ai.functions";
import { setState, uid, useAppState } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/meetings")({
  validateSearch: (s: Record<string, unknown>): { id?: string | undefined } => ({ id: typeof s["id"] === "string" ? (s["id"] as string) : undefined }),
  head: () => ({
    meta: [
      { title: "Meeting Summarizer — MindFlow AI" },
      { name: "description", content: "Turn raw meeting notes into summaries, decisions, action items and follow-up emails with AI." },
      { property: "og:title", content: "AI Meeting Note Summarizer — MindFlow AI" },
      { property: "og:description", content: "Summaries, key decisions and action items from any meeting notes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Meetings,
});

function Meetings() {
  const { meetings } = useAppState();
  const { id } = Route.useSearch();
  const navigate = useNavigate({ from: "/meetings" });
  const selected = meetings.find((m) => m.id === id) ?? meetings[0];
  const [creating, setCreating] = useState(meetings.length === 0);
  const [title, setTitle] = useState("");
  const [attendees, setAttendees] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const summarize = useServerFn(summarizeMeeting);

  async function runSummary(meetingId: string, t: string, n: string) {
    setLoading(true);
    try {
      const summary = await summarize({ data: { title: t, notes: n } });
      setState((s) => ({ ...s, meetings: s.meetings.map((m) => (m.id === meetingId ? { ...m, summary } : m)) }));
      toast.success("Meeting summarized");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not summarize");
    } finally {
      setLoading(false);
    }
  }

  async function create() {
    if (!title.trim() || notes.trim().length < 10) { toast.error("Add a title and at least a sentence of notes."); return; }
    const m = { id: uid(), title: title.trim(), date: new Date().toISOString().slice(0, 10), attendees: attendees.split(",").map((a) => a.trim()).filter(Boolean), notes };
    setState((s) => ({ ...s, meetings: [m, ...s.meetings] }));
    setCreating(false);
    setTitle(""); setAttendees(""); setNotes("");
    navigate({ search: { id: m.id } });
    await runSummary(m.id, m.title, m.notes);
  }

  function addActionItemsAsTasks() {
    if (!selected?.summary) return;
    const due = new Date(); due.setDate(due.getDate() + 7);
    const newTasks = selected.summary.actionItems.map((a) => ({ id: uid(), title: a.task, description: `From "${selected.title}" · Owner: ${a.owner} · Due: ${a.due}`, priority: "medium" as const, status: "todo" as const, due: due.toISOString().slice(0, 10), project: "Meetings" }));
    setState((s) => ({ ...s, tasks: [...newTasks, ...s.tasks] }));
    toast.success(`${newTasks.length} tasks added to your planner`);
  }

  function remove(mid: string) {
    setState((s) => ({ ...s, meetings: s.meetings.filter((m) => m.id !== mid) }));
    navigate({ search: {} });
  }

  return (
    <div>
      <PageHeader title="Meeting Summarizer" subtitle="Paste your notes — get decisions, action items and a follow-up in seconds." action={<Button onClick={() => setCreating(true)}><Plus />New meeting</Button>} />
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-2">
          {meetings.map((m) => (
            <button key={m.id} onClick={() => { setCreating(false); navigate({ search: { id: m.id } }); }} className={cn("w-full rounded-lg border bg-card p-3 text-left transition hover:border-primary", !creating && selected?.id === m.id && "border-primary ring-1 ring-primary")}>
              <p className="font-medium">{m.title}</p>
              <p className="text-xs text-muted-foreground">{m.date} · {m.summary ? "Summarized" : "Notes only"}</p>
            </button>
          ))}
        </div>

        {creating ? (
          <Card>
            <CardHeader><CardTitle>New meeting</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Meeting title, e.g. Design review" value={title} onChange={(e) => setTitle(e.target.value)} />
              <Input placeholder="Attendees (comma separated)" value={attendees} onChange={(e) => setAttendees(e.target.value)} />
              <Textarea placeholder="Paste raw notes or a transcript…" rows={12} value={notes} onChange={(e) => setNotes(e.target.value)} />
              <div className="flex gap-2">
                <Button onClick={create} disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : <Sparkles />}Save & summarize</Button>
                {meetings.length > 0 && <Button variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>}
              </div>
            </CardContent>
          </Card>
        ) : selected ? (
          <div className="space-y-4">
            <Card>
              <CardHeader className="flex-row items-start justify-between gap-2">
                <div>
                  <CardTitle>{selected.title}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">{selected.date} · {selected.attendees.join(", ")}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => runSummary(selected.id, selected.title, selected.notes)} disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : <Sparkles />}{selected.summary ? "Re-summarize" : "Summarize"}</Button>
                  <Button size="icon" variant="ghost" aria-label="Delete meeting" onClick={() => remove(selected.id)}><Trash2 /></Button>
                </div>
              </CardHeader>
              <CardContent><p className="whitespace-pre-wrap text-sm text-muted-foreground">{selected.notes}</p></CardContent>
            </Card>

            {loading && <Card><CardContent className="flex items-center gap-2 p-6 text-muted-foreground"><Loader2 className="animate-spin" />Analyzing your meeting…</CardContent></Card>}

            {selected.summary && !loading && (
              <>
                <Card>
                  <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
                  <CardContent><p className="leading-relaxed">{selected.summary.summary}</p></CardContent>
                </Card>
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader><CardTitle>Key decisions</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      {selected.summary.decisions.map((d, i) => <p key={i} className="flex gap-2 text-sm"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />{d}</p>)}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex-row items-center justify-between">
                      <CardTitle>Action items</CardTitle>
                      <Button size="sm" variant="outline" onClick={addActionItemsAsTasks}><ListPlus />Add to tasks</Button>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {selected.summary.actionItems.map((a, i) => (
                        <div key={i} className="rounded-lg border p-2 text-sm">
                          <p className="font-medium">{a.task}</p>
                          <div className="mt-1 flex gap-2"><Badge variant="secondary">{a.owner}</Badge><Badge variant="outline">{a.due}</Badge></div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
                <Card>
                  <CardHeader className="flex-row items-center justify-between">
                    <CardTitle>Follow-up note</CardTitle>
                    <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(selected.summary!.followUp); toast.success("Copied"); }}><Copy />Copy</Button>
                  </CardHeader>
                  <CardContent><p className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm">{selected.summary.followUp}</p></CardContent>
                </Card>
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
