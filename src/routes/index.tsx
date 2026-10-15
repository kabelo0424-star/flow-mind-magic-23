import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, CalendarClock, CheckCircle2, ListTodo, NotebookPen, Timer } from "lucide-react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAppState } from "@/lib/store";
import { daysUntil, dueLabel, priorityClass } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — MindFlow AI" },
      { name: "description", content: "See upcoming deadlines, recent meetings, task stats and research projects in one AI-powered workspace." },
      { property: "og:title", content: "MindFlow AI — Your productivity dashboard" },
      { property: "og:description", content: "Summarize meetings, plan tasks and research topics with AI in one workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { tasks, meetings, research } = useAppState();
  const done = tasks.filter((t) => t.status === "done").length;
  const inProg = tasks.filter((t) => t.status === "in_progress").length;
  const todo = tasks.length - done - inProg;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const upcoming = tasks.filter((t) => t.status !== "done").sort((a, b) => a.due.localeCompare(b.due)).slice(0, 5);
  const overdue = tasks.filter((t) => t.status !== "done" && daysUntil(t.due) < 0).length;
  const statusData = [
    { name: "Done", value: done, fill: "var(--chart-3)" },
    { name: "In progress", value: inProg, fill: "var(--chart-2)" },
    { name: "To do", value: todo, fill: "var(--chart-1)" },
  ];
  const projects = Object.entries(tasks.reduce<Record<string, number>>((acc, t) => ({ ...acc, [t.project]: (acc[t.project] ?? 0) + 1 }), {})).map(([name, count]) => ({ name, count }));

  const stats = [
    { label: "Open tasks", value: todo + inProg, icon: ListTodo },
    { label: "Completed", value: done, icon: CheckCircle2 },
    { label: "Overdue", value: overdue, icon: Timer },
    { label: "Meetings logged", value: meetings.length, icon: NotebookPen },
  ];

  return (
    <div>
      <PageHeader
        title="Good to see you 👋"
        subtitle="Here's what's flowing through your workspace today."
        action={<Button asChild><Link to="/assistant">Ask MindFlow AI <ArrowRight /></Link></Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="transition hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="font-display text-3xl font-semibold">{value}</p>
              </div>
              <span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary"><Icon className="size-5" /></span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><CalendarClock className="size-5 text-primary" />Upcoming deadlines</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link to="/tasks">All tasks</Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcoming.length === 0 && <p className="text-sm text-muted-foreground">Nothing due — enjoy the calm.</p>}
            {upcoming.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{t.title}</p>
                  <p className="text-xs text-muted-foreground">{t.project}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="outline" className={priorityClass(t.priority)}>{t.priority}</Badge>
                  <span className={daysUntil(t.due) < 0 ? "text-sm font-medium text-destructive" : "text-sm text-muted-foreground"}>{dueLabel(t.due)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Task progress</CardTitle></CardHeader>
          <CardContent>
            <div className="relative h-44">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={statusData} dataKey="value" innerRadius={52} outerRadius={75} paddingAngle={3} stroke="none">
                    {statusData.map((d) => <Cell key={d.name} fill={d.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--popover-foreground)" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-items-center"><span className="font-display text-2xl font-semibold">{pct}%</span></div>
            </div>
            <Progress value={pct} className="mt-2" />
            <div className="mt-3 flex justify-between text-xs text-muted-foreground">
              {statusData.map((d) => <span key={d.name} className="flex items-center gap-1"><span className="size-2 rounded-full" style={{ background: d.fill }} />{d.name} {d.value}</span>)}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><NotebookPen className="size-5 text-primary" />Recent meetings</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link to="/meetings">View all</Link></Button>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {meetings.slice(0, 4).map((m) => (
              <Link key={m.id} to="/meetings" search={{ id: m.id }} className="rounded-lg border p-4 transition hover:border-primary hover:bg-secondary/50">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{m.title}</p>
                  {m.summary ? <Badge className="bg-success text-primary-foreground">Summarized</Badge> : <Badge variant="outline">Notes</Badge>}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{m.date} · {m.attendees.length} attendees</p>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{m.summary?.summary ?? m.notes}</p>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Tasks by project</CardTitle></CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer>
              <BarChart data={projects} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" hide allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "var(--muted)" }} contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--popover-foreground)" }} />
                <Bar dataKey="count" fill="var(--chart-1)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><BookOpen className="size-5 text-primary" />Research projects</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link to="/research">Open research</Link></Button>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {research.slice(0, 3).map((r) => (
              <Link key={r.id} to="/research" search={{ id: r.id }} className="rounded-lg border p-4 transition hover:border-primary hover:bg-secondary/50">
                <p className="font-medium">{r.topic}</p>
                <p className="mt-1 text-xs text-muted-foreground">{r.result ? `${r.result.sources.length} sources · ${r.result.keyFindings.length} findings` : "Not researched yet"}</p>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
