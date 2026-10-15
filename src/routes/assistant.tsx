import { useChat } from "@ai-sdk/react";
import { createFileRoute } from "@tanstack/react-router";
import { DefaultChatTransport, type UIMessage } from "ai";
import { ArrowUp, Eraser, Square, Waves } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAppState, workspaceContext } from "@/lib/store";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "AI Chat Assistant — MindFlow AI" },
      { name: "description", content: "Chat with an AI that knows your meetings, tasks and research and connects them together." },
      { property: "og:title", content: "AI Chat Assistant — MindFlow AI" },
      { property: "og:description", content: "Ask questions across your meetings, tasks and research." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AssistantPage,
});

const KEY = "mindflow:chat";
const suggestions = ["What should I focus on today?", "Which action items from meetings aren't tasks yet?", "Summarize my research and link it to my tasks", "Am I at risk of missing any deadlines?"];

function AssistantPage() {
  const [initial, setInitial] = useState<UIMessage[] | null>(null);
  useEffect(() => {
    try { setInitial(JSON.parse(localStorage.getItem(KEY) ?? "[]")); } catch { setInitial([]); }
  }, []);
  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col md:h-[calc(100vh-4rem)]">
      <PageHeader title="AI Assistant" subtitle="Ask anything — I can see your meetings, tasks and research." />
      {initial && <Chat initial={initial} />}
    </div>
  );
}

function Chat({ initial }: { initial: UIMessage[] }) {
  const state = useAppState();
  const ctxRef = useRef("");
  ctxRef.current = workspaceContext(state);
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat", body: () => ({ context: ctxRef.current }) }), []);
  const { messages, sendMessage, status, stop, setMessages, error } = useChat({ id: "main", messages: initial, transport });
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => { if (status === "ready" || status === "error") localStorage.setItem(KEY, JSON.stringify(messages)); }, [messages, status]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, status]);
  useEffect(() => { if (!busy) inputRef.current?.focus(); }, [busy]);

  const send = (text: string) => {
    if (!text.trim() || busy) return;
    sendMessage({ text });
    setInput("");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-xl border bg-card">
      <div className="flex-1 space-y-5 overflow-y-auto p-4 md:p-6">
        {messages.length === 0 && (
          <div className="mx-auto max-w-lg py-10 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-accent text-accent-foreground"><Waves /></span>
            <p className="mt-3 font-display text-lg font-semibold">How can I help you flow today?</p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {suggestions.map((s) => <button key={s} onClick={() => send(s)} className="rounded-lg border p-3 text-left text-sm transition hover:border-primary hover:bg-secondary/50">{s}</button>)}
            </div>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex gap-3"}>
            {m.role === "assistant" && <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground"><Waves className="size-4" /></span>}
            <div className={m.role === "user" ? "max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-primary-foreground" : "prose-chat min-w-0 max-w-[85%] text-sm leading-relaxed"}>
              {m.parts.map((p, i) => p.type === "text" ? (m.role === "user" ? <p key={i} className="whitespace-pre-wrap">{p.text}</p> : <ReactMarkdown key={i}>{p.text}</ReactMarkdown>) : null)}
            </div>
          </div>
        ))}
        {status === "submitted" && (
          <div className="flex gap-3"><span className="grid size-8 place-items-center rounded-lg bg-accent text-accent-foreground"><Waves className="size-4" /></span><span className="flex items-center gap-1 text-muted-foreground"><span className="size-2 animate-bounce rounded-full bg-current" /><span className="size-2 animate-bounce rounded-full bg-current [animation-delay:150ms]" /><span className="size-2 animate-bounce rounded-full bg-current [animation-delay:300ms]" /></span></div>
        )}
        {error && <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error.message || "Something went wrong. Please try again."}</p>}
        <div ref={endRef} />
      </div>
      <form className="flex items-end gap-2 border-t p-3" onSubmit={(e) => { e.preventDefault(); send(input); }}>
        <Button type="button" variant="ghost" size="icon" aria-label="Clear conversation" onClick={() => { setMessages([]); localStorage.removeItem(KEY); }}><Eraser /></Button>
        <Textarea ref={inputRef} autoFocus rows={1} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }} placeholder="Ask about your meetings, tasks or research…" className="max-h-40 min-h-10 resize-none" />
        {busy ? <Button type="button" size="icon" variant="secondary" aria-label="Stop" onClick={stop}><Square /></Button> : <Button type="submit" size="icon" aria-label="Send" disabled={!input.trim()}><ArrowUp /></Button>}
      </form>
    </div>
  );
}
