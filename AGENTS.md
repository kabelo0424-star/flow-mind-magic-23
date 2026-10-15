<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Workspace data (tasks, meetings, research, chat) lives in browser localStorage via `src/lib/store.ts`; no sign-in yet, so keep it simple and swappable.
- AI calls run server-side only (`src/lib/ai.functions.ts`, `src/routes/api/chat.ts`) through `src/lib/ai/gateway.server.ts` so the key never reaches the browser.
