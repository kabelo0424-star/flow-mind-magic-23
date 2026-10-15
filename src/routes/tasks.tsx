import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { planTasks } from "@/lib/ai.functions";
import { dueLabel, daysUntil, priorityClass } from "@/lib/format";
import { setState, uid, useAppState, type Priority, type Status, type Task } from "@/lib/store";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "AI Task Planner — MindFlow AI" },
      { name: "description", content: "Create, prioritize and schedule tasks. Let AI break big goals into a plan with deadlines." },
      { property: "og:title", content: "AI Task Planner — MindFlow AI" },
      { property: "og:description", content: "Turn goals into prioritized tasks with deadlines and track progress." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Tasks,
});

const columns: { key: Status; label: string }[] = [
  { key: "todo", label: "To do" },
  { key: "in_progress", label: "In progress" },
  { key: "done", label: "Done" },
];
const order: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

function Tasks() {
  const { tasks } = useAppState();
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ title: "", description: "", priority: "medium" as Priority, due: new Date().toISOString().slice(0, 10), project: "General" });
  const plan = useServerFn(planTasks);
  const pct = tasks.length ? Math.round((tasks.filter((t) => t.status === "done").length / tasks.length) * 100) : 0;

  const update = (id: string, patch: Partial<Task>) => setState((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));

  async function generate() {
    if (goal.trim().length < 3) { toast.error("Describe a goal first."); return; }
    setLoading(true);
    try {
      const res = await plan({ data: { goal } });
      const newTasks: Task[] = res.tasks.map((t) => {
        const d = new Date(); d.setDate(d.getDate() + Math.max(0, Math.round(t.dueInDays)));
        return { id: uid(), title: t.title, description: t.description, priority: t.priority, status: "todo", due: d.toISOString().slice(0, 10), project: goal.slice(0, 24) };
      });
      setState((s) => ({ ...s, tasks: [...newTasks, ...s.tasks] }));
      setGoal("");
      toast.success(`Planned ${newTasks.length} tasks`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Planning failed");
    } finally {
      setLoading(false);
    }
  }

  function addTask() {
    if (!draft.title.trim()) { toast.error("Give the task a title."); return; }
    setState((s) => ({ ...s, tasks: [{ id: uid(), status: "todo", ...draft }, ...s.tasks] }));
    setOpen(false);
    setDraft({ ...draft, title: "", description: "" });
    toast.success("Task added");
  }

  return (
    <div>
      <PageHeader title="AI Task Planner" subtitle={`${tasks.length} tasks · ${pct}% complete`} action={<Button onClick={() => setOpen(true)}><Plus />Add task</Button>} />
      <Progress value={pct} className="mb-6" />

      <Card className="mb-6 border-primary/30 bg-secondary/40">
        <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="size-5 text-primary" />Plan a goal with AI</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row">
          <Input placeholder="e.g. Launch a newsletter by end of month" value={goal} onChange={(e) => setGoal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && generate()} className="bg-card" />
          <Button onClick={generate} disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : <Sparkles />}Generate plan</Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {columns.map((c) => {
          const list = tasks.filter((t) => t.status === c.key).sort((a, b) => order[a.priority] - order[b.priority] || a.due.localeCompare(b.due));
          return (
            <div key={c.key} className="rounded-xl bg-muted/60 p-3">
              <div className="mb-3 flex items-center justify-between px-1"><h2 className="font-semibold">{c.label}</h2><Badge variant="secondary">{list.length}</Badge></div>
              <div className="space-y-2">
                {list.map((t) => (
                  <Card key={t.id} className="transition hover:shadow-md">
                    <CardContent className="space-y-2 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className={t.status === "done" ? "font-medium text-muted-foreground line-through" : "font-medium"}>{t.title}</p>
                        <button aria-label="Delete task" className="text-muted-foreground hover:text-destructive" onClick={() => setState((s) => ({ ...s, tasks: s.tasks.filter((x) => x.id !== t.id) }))}><Trash2 className="size-4" /></button>
                      </div>
                      {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <Badge variant="outline" className={priorityClass(t.priority)}>{t.priority}</Badge>
                        <span className={t.status !== "done" && daysUntil(t.due) < 0 ? "font-medium text-destructive" : "text-muted-foreground"}>{dueLabel(t.due)}</span>
                        <span className="text-muted-foreground">· {t.project}</span>
                      </div>
                      <div className="flex gap-2">
                        <Select value={t.status} onValueChange={(v) => update(t.id, { status: v as Status })}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>{columns.map((x) => <SelectItem key={x.key} value={x.key}>{x.label}</SelectItem>)}</SelectContent>
                        </Select>
                        <Input type="date" value={t.due} onChange={(e) => e.target.value && update(t.id, { due: e.target.value })} className="h-8 text-xs" aria-label="Deadline" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New task</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            <Textarea placeholder="Description" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            <div className="grid grid-cols-3 gap-2">
              <Select value={draft.priority} onValueChange={(v) => setDraft({ ...draft, priority: v as Priority })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent>
              </Select>
              <Input type="date" value={draft.due} onChange={(e) => setDraft({ ...draft, due: e.target.value })} />
              <Input placeholder="Project" value={draft.project} onChange={(e) => setDraft({ ...draft, project: e.target.value })} />
            </div>
            <Button className="w-full" onClick={addTask}>Add task</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
