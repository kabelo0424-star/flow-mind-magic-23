import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, Loader2, Search, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { researchTopic } from "@/lib/ai.functions";
import { setState, uid, useAppState } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/research")({
  validateSearch: (s: Record<string, unknown>): { id?: string | undefined } => ({ id: typeof s["id"] === "string" ? (s["id"] as string) : undefined }),
  head: () => ({
    meta: [
      { title: "AI Research Assistant — MindFlow AI" },
      { name: "description", content: "Research any topic: AI summaries, key findings, side-by-side comparisons and cited sources." },
      { property: "og:title", content: "AI Research Assistant — MindFlow AI" },
      { property: "og:description", content: "Summaries, comparisons and cited sources for any topic." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResearchPage,
});

function ResearchPage() {
  const { research } = useAppState();
  const { id } = Route.useSearch();
  const navigate = useNavigate({ from: "/research" });
  const selected = research.find((r) => r.id === id) ?? research[0];
  const [topic, setTopic] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const run = useServerFn(researchTopic);

  async function doResearch(rid: string, t: string) {
    setLoadingId(rid);
    try {
      const result = await run({ data: { topic: t } });
      setState((s) => ({ ...s, research: s.research.map((r) => (r.id === rid ? { ...r, result } : r)) }));
      toast.success("Research ready");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Research failed");
    } finally {
      setLoadingId(null);
    }
  }

  function start() {
    if (topic.trim().length < 3) { toast.error("Enter a topic to research."); return; }
    const r = { id: uid(), topic: topic.trim(), createdAt: new Date().toISOString().slice(0, 10) };
    setState((s) => ({ ...s, research: [r, ...s.research] }));
    setTopic("");
    navigate({ search: { id: r.id } });
    doResearch(r.id, r.topic);
  }

  const res = selected?.result;
  return (
    <div>
      <PageHeader title="AI Research Assistant" subtitle="Summaries, comparisons and sources — all in one place." />
      <Card className="mb-6">
        <CardContent className="flex flex-col gap-2 p-4 sm:flex-row">
          <Input placeholder="What do you want to research? e.g. Pomodoro vs time blocking" value={topic} onChange={(e) => setTopic(e.target.value)} onKeyDown={(e) => e.key === "Enter" && start()} />
          <Button onClick={start} disabled={!!loadingId}><Search />Research</Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <div className="space-y-2">
          {research.map((r) => (
            <div key={r.id} className={cn("flex items-center gap-2 rounded-lg border bg-card p-3 transition hover:border-primary", selected?.id === r.id && "border-primary ring-1 ring-primary")}>
              <button className="min-w-0 flex-1 text-left" onClick={() => navigate({ search: { id: r.id } })}>
                <p className="truncate font-medium">{r.topic}</p>
                <p className="text-xs text-muted-foreground">{r.createdAt} · {r.result ? "Complete" : "Pending"}</p>
              </button>
              <button aria-label="Delete research" className="text-muted-foreground hover:text-destructive" onClick={() => setState((s) => ({ ...s, research: s.research.filter((x) => x.id !== r.id) }))}><Trash2 className="size-4" /></button>
            </div>
          ))}
        </div>

        {selected && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-semibold">{selected.topic}</h2>
              <Button size="sm" variant="outline" disabled={!!loadingId} onClick={() => doResearch(selected.id, selected.topic)}><Sparkles />{res ? "Refresh research" : "Run research"}</Button>
            </div>
            {loadingId === selected.id ? (
              <Card><CardContent className="flex items-center gap-2 p-6 text-muted-foreground"><Loader2 className="animate-spin" />Researching and gathering sources…</CardContent></Card>
            ) : res ? (
              <>
                <Card><CardHeader><CardTitle>Summary</CardTitle></CardHeader><CardContent><p className="leading-relaxed">{res.summary}</p></CardContent></Card>
                <Card>
                  <CardHeader><CardTitle>Key findings</CardTitle></CardHeader>
                  <CardContent><ol className="list-decimal space-y-2 pl-5 text-sm">{res.keyFindings.map((f, i) => <li key={i}>{f}</li>)}</ol></CardContent>
                </Card>
                {res.comparison.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle>Comparison</CardTitle></CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader><TableRow><TableHead>Aspect</TableHead><TableHead>{res.comparisonLabels.optionA}</TableHead><TableHead>{res.comparisonLabels.optionB}</TableHead></TableRow></TableHeader>
                        <TableBody>{res.comparison.map((c, i) => <TableRow key={i}><TableCell className="font-medium">{c.aspect}</TableCell><TableCell>{c.optionA}</TableCell><TableCell>{c.optionB}</TableCell></TableRow>)}</TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
                <Card>
                  <CardHeader><CardTitle>Sources</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {res.sources.map((s, i) => (
                      <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 rounded-lg border p-3 transition hover:border-primary">
                        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-primary">{i + 1}</span>
                        <div className="min-w-0 flex-1"><p className="font-medium">{s.title}</p><p className="text-xs text-muted-foreground">{s.publisher} · {s.note}</p></div>
                        <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
                      </a>
                    ))}
                    <p className="pt-1 text-xs text-muted-foreground">AI-suggested sources — always open and verify before citing.</p>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card><CardContent className="p-6 text-muted-foreground">No research yet — click "Run research".</CardContent></Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
