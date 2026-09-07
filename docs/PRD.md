# AI-First Inbox — Product Requirements Document

**Status:** v1  
**Stack:** React, TypeScript, Redux Toolkit  
**Data:** mock multi-user mailbox (JSON fixtures)  
**LLM:** local Ollama (open-source models), with a pluggable model selector  

This is not a Gmail clone with a chatbot on the side. The product is an **inbox that already understands the mail**. Users should know what a thread is about, whether it needs them, and what to say next *before* they grind through the body. AI is the reading and triage layer; it lives in the list, the thread, compose, and admin insights — not in a separate chat panel.

---

## 1. Goals

- Let people **triage without opening every thread** (preview gists + inbox brief).
- Let people **reply well with less effort** (suggested message, apply, edit, send).
- Let admins **see email activity across users** as operational insights, not a surveillance inbox.
- Keep the architecture **modular** so new AI capabilities and models can be added without rewriting the UI.

## 2. Non-goals (v1)

- Real Gmail / OAuth / IMAP / SMTP.
- Attachments, labels, stars, snooze, signatures, rich-text editor.
- Notifications, mobile native apps, token streaming (nice-to-have later).
- Admin reading other people’s full message bodies as a feed.

---

## 3. Personas and session

No real auth. A **user switcher** in the shell is the demo login.

| Role | Sees | AI |
|------|------|----|
| **Member** | Threads they participate in; Inbox / Unread / Sent | Gists, inbox brief, summaries, suggested replies, compose-from-intent |
| **Admin** | Member capabilities plus **Activity** across all users | Same as member, plus org narrative from activity metrics |

Admin insights are about **behavior** (volume, response time, unanswered, AI-assist usage), not a warrant to read everyone’s mail.

Every send, open, apply-suggestion, and thread create writes an `ActivityEvent`. That log is the admin product.

---

## 4. Design principles (AI that feels like email)

| Traditional add-on | This product |
|---|---|
| “Summarize” button after you open mail | One-line **gist on every preview row** so you may never open it |
| Chat panel that restates the email | **Suggested reply sitting in the reply box**, apply / edit / send |
| Dashboard of model metrics | **Admin narrative**: who is drowning, who is silent, what is stalling |
| User must prompt the model | Insights generate as part of load; user steers tone or model only when they want |

Rules:

- Default insights require **zero extra clicks**.
- AI never auto-sends. **Apply** fills the composer; the human sends.
- If Ollama is down, mail still works. Show a quiet “AI unavailable” state, not a blocked inbox.
- Cache insights in Redux keyed by target (`threadId` / `messageId` / inbox / org) so pagination does not re-hit the model.
- Prefer short, scannable output: 1-line gist, 3-bullet summary or brief, 1 draft.

---

## 5. Domain model

| Entity | Fields (minimum) |
|--------|------------------|
| **User** | `id`, `name`, `email`, `role: "admin" \| "member"` |
| **Thread** | `id`, `subject`, `participantIds`, `lastMessageAt`, `unreadByUserIds` |
| **Message** | `id`, `threadId`, `fromUserId`, `toUserIds`, `body`, `sentAt` |
| **ActivityEvent** | `id`, `actorUserId`, `type`, `threadId?`, `timestamp`, `meta` |
| **AiInsight** | `targetType`, `targetId`, `kind`, `content`, `model`, `generatedAt` |

`AiInsight.kind`: `gist` | `summary` | `reply` | `inbox_brief` | `org_narrative`

List UI is **thread-centric**. Email view is **one message in a thread** (suggested replies are message-aware). Creating a new thread creates a thread plus its first message.

**Seed data:** ~40–60 messages, ~15–20 threads, 5–8 users, mixed dates, unread state, and a few long threads so pagination, date filters, smart views, and summaries are demonstrable.

---

## 6. Information architecture

Only three mail folders. Do **not** clone the Gmail sidebar (no Drafts / Spam / Trash / Labels / Categories).

| Folder | Definition |
|--------|------------|
| **Inbox** | Threads the current user participates in, excluding those that only exist because they sent them and have no inbound messages (those belong in Sent). Practical v1: all participating threads, with Unread as a filter on top. |
| **Unread** | Participating threads where `unreadByUserIds` includes the current user. |
| **Sent** | Threads where the current user has sent at least one message; list emphasizes last outbound message. |

Nav also includes **New thread** and, for admins, **Activity**.

Desktop: list pane + reading pane. Small screens: list, then full-page view.

Routes: `/inbox`, `/unread`, `/sent`, `/inbox/:threadId` (and equivalents), `/compose`, `/activity`.

---

## 7. Feature requirements

Requirement IDs are stable. Implementation should be traceable to these IDs.

### 7.1 Email preview (inbox list)

**Job:** Triage without opening mail.

| ID | Requirement |
|----|-------------|
| PREVIEW-1 | Paginated thread list. Do **not** render the full corpus. Page size **10 / 25 / 50**, with page controls and “Showing X–Y of Z”. |
| PREVIEW-2 | Each row: sender or participant summary, subject, **AI gist (1 line)**, relative time, unread indicator, optional urgency chip (`needs_reply` \| `fyi` \| `waiting`). |
| PREVIEW-3 | Newest-first. Unread is visually stronger than read. |
| PREVIEW-4 | Activating a row opens Email view (split pane on desktop, full page on small screens). |
| PREVIEW-5 | Loading, empty inbox, and empty-filter states are all designed — never a blank pane. |
| PREVIEW-6 | List is a **keyboard-operable composite** (see §7.9). |
| PREVIEW-AI-1 | Gists generate for the **visible page only**, then cache. Never gist the whole mailbox on first paint. |
| PREVIEW-AI-2 | Urgency from last message + whether the current user was addressed (rules first; model later if needed). |

**Out of scope for this surface:** infinite scroll, bulk select/archive, labels, stars.

#### Inbox brief (highest-leverage AI surface)

The brief sits **on the preview**, above the list — not behind a “Summarize inbox” button.

| ID | Requirement |
|----|-------------|
| BRIEF-1 | Show a **3-bullet inbox brief**: what needs the current user now (unblock, reply, waiting). |
| BRIEF-2 | One model call over the **current folder + current page/unread set**, not the entire mailbox. |
| BRIEF-3 | Brief respects the active folder and filters (Inbox vs Unread vs Sent, smart views, search). If the set is empty, hide the brief or show a short empty line — do not invent work. |
| BRIEF-4 | Loading: skeleton or “Writing a brief…”. Failure: collapse quietly with retry; list remains usable. |
| BRIEF-5 | Cache by `{ userId, folder, filterHash, page }`. Invalidate when the user sends, new mock mail arrives, or they switch user/model. |
| BRIEF-6 | Copy is operational (“Reply to Priya on Q3 numbers”) not a recap of subjects. |

This is how the product feels AI-native: the user understands the mailbox **from the list**.

---

### 7.2 Search, filter, and smart views

**Job:** Narrow the corpus *before* pagination, then paginate the filtered set.

| ID | Requirement |
|----|-------------|
| SEARCH-1 | Keyword search over subject + body (+ cached gist if present). Debounce ~300ms. |
| SEARCH-2 | Date filter: presets (Today, Last 7 days, Last 30 days) and custom from/to. |
| SEARCH-3 | **Group by user:** cluster threads by the other participant (or sender). People list with counts, or grouped sections. Grouping is a view mode, not a hidden sort. |
| SEARCH-4 | Filters compose: keyword ∩ date ∩ person ∩ folder ∩ smart view. Changing filters resets to page 1. |
| SEARCH-5 | Clear-all control. Result count sits with pagination. |
| SEARCH-6 | Search field accessible name and placeholder describe a real job (e.g. “Find the invoice thread”), not only “Search”. |

**Admin vs member:** mailbox search is scoped to the current user’s mail. Activity search is a separate control (§7.5).

#### Smart views: Needs reply / Waiting

These are first-class filters in the search/filter bar, not extra Gmail-style folders.

| ID | Requirement |
|----|-------------|
| SMART-1 | **Needs reply:** threads where the last message was **not** sent by the current user (they were addressed / are a participant and owe a response). |
| SMART-2 | **Waiting:** threads where the current user **sent last** and is waiting on someone else. |
| SMART-3 | Smart views are mutually exclusive with each other; they compose with keyword, date, and user grouping. |
| SMART-4 | Unread remains a **folder** (see §6), not a duplicate chip — unless the user is already in Inbox and wants unread as a chip; v1 uses the Unread folder to avoid two unread controls. |
| SMART-5 | Each smart view shows a **count**. Empty smart view uses the same empty-filter pattern as search. |
| SMART-6 | v1 classification is **deterministic rules** (who sent last). Do not block v1 on a classifier. A later model can re-label edge cases (FYI vs action) without changing the UI. |

---

### 7.3 Email view (single message)

**Job:** Understand this message fast, then reply with a draft that already sounds right.

| ID | Requirement |
|----|-------------|
| VIEW-1 | Header: from, to, date, subject (thread subject). |
| VIEW-2 | Body of the **selected message**. Compact thread rail to pick another message in the same thread. |
| VIEW-3 | Reply composer: recipients from participants, body editable. |
| VIEW-4 | **AI recommended message** from this message (optional prior thread as context). |
| VIEW-5 | Actions: **Apply** (writes into composer), **Regenerate**, **Copy**, dismiss. After Apply, user may edit, then **Send**. |
| VIEW-6 | Send appends a `Message`, marks unread for recipients, writes `email_sent` and `ai_reply_applied` if they applied first. |
| VIEW-7 | LLM loading/failure: composer still usable; suggestion region offers retry. |
| VIEW-AI-1 | Reply is specific to this thread (names, ask, deadline) — not “Thanks for your email.” |
| VIEW-AI-2 | Tone chips after first draft: **Brief / Friendly / Formal** (re-run with same context). |
| VIEW-AI-3 | **3-bullet summary** above the body (this message or thread so far). |
| VIEW-AI-4 | Never auto-send. Never replace composer body without Apply. |

---

### 7.4 Create new email thread

**Job:** Start a conversation, including from intent rather than a blank box.

| ID | Requirement |
|----|-------------|
| COMPOSE-1 | “New thread” entry in the shell. |
| COMPOSE-2 | Recipients from mock users (multi-select), subject, body. |
| COMPOSE-3 | Validation: ≥1 recipient, non-empty subject and body. |
| COMPOSE-4 | Send creates `Thread` + first `Message`, selects it in the list, logs `thread_created` / `email_sent`. |
| COMPOSE-5 | Draft lives in Redux while typing; discard confirms if dirty. |
| COMPOSE-AI-1 | **Compose from intent** (optional): e.g. “Ask Priya for the Q3 numbers by Friday” → model returns subject + body. User edits, then sends. |
| COMPOSE-AI-2 | Intent field is optional; power users type normally. |

---

### 7.5 Track email activity (admin)

**Job:** See how people use email, not a replica of everyone’s inbox.

| ID | Requirement |
|----|-------------|
| ADMIN-1 | Admin-only view. Members do not see Activity in nav. Direct visit → 403-style empty state or redirect to Inbox. |
| ADMIN-2 | Date range for the dashboard. |
| ADMIN-3 | KPI cards: sent volume, received volume, median time-to-reply (from thread send pairs), unanswered count, AI apply rate. |
| ADMIN-4 | Per-user table or cards with the same metrics. |
| ADMIN-5 | Paginated activity timeline: `email_sent`, `email_opened`, `thread_created`, `ai_reply_applied` (and similar). |
| ADMIN-6 | Empty and error states when the range has no events. |
| ADMIN-AI-1 | One **org narrative** card from aggregated stats + sampled event types — **not** dumped message bodies. Example: “Three threads older than 5 days still wait on Alex.” |
| ADMIN-AI-2 | Optional “who needs coverage”: high unanswered + slow reply. |
| ADMIN-PII-1 | No admin message-body reader. Drill-down is metadata (subject, age) or threads the admin already participates in. Documented as mock-only. |

---

### 7.6 User switcher

Required to demo member vs admin and activity across users.

| ID | Requirement |
|----|-------------|
| SESSION-1 | Shell control lists fixture users (name, role). Changing user is instant (no fake login form). |
| SESSION-2 | Switching user re-scopes Inbox / Unread / Sent, pagination, briefs, and AI cache to that user. |
| SESSION-3 | Activity nav item appears only when the selected user is `admin`. |
| SESSION-4 | Switching writes an activity event is **not** required (it is a demo control). Mail actions of the selected user **do** write events as that actor. |
| SESSION-5 | Control has a visible label / `aria-label` (e.g. “Current user”). Current selection is announced. |

---

### 7.7 Model switcher

Users pick which Ollama model generates insights. v1 ships **one selectable model**; the UI and Redux field are built so more models can be added later without a layout rewrite.

| ID | Requirement |
|----|-------------|
| MODEL-1 | Shell control: “Model” select. v1 options: a single supported Ollama model (e.g. `llama3.1`). Disabled-looking extra items are **not** required; an empty extensible list in config is enough. |
| MODEL-2 | Supported models live in a config module (`id`, `label`, `ollamaName`). Adding a model later = config row, not a new component. |
| MODEL-3 | Selected model is stored in Redux (`session` or `ai` slice) and passed into every LLM call. Insights store `model` on `AiInsight`. |
| MODEL-4 | Changing model **invalidates** cached insights (or namespaces cache by model id) so gists/briefs/replies do not mix models. |
| MODEL-5 | If Ollama is unreachable or the model is missing, show status (“AI unavailable” / “Model not pulled”) and keep mail usable. |
| MODEL-6 | Control is labeled for assistive tech (“Language model”). v1 may show a single option; that is acceptable. |

---

### 7.8 Accessibility

Applies to every surface above. Not a follow-up.

| ID | Requirement |
|----|-------------|
| A11Y-1 | Every interactive control has an **accessible name** (visible text, associated `label`, or `aria-label`). |
| A11Y-2 | **Visible focus rings** on all interactive elements (do not remove outline without a replacement). |
| A11Y-3 | Thread list is a **keyboard-operable composite**: arrow keys (and `j` / `k`) move selection, `Enter` / `Space` opens, focus does not trap. `aria-activedescendant` or equivalent roving tabindex. |
| A11Y-4 | **Pagination is `<button>`s** (previous, next, page size), not clickable `div`s. Disabled state on first/last page is a disabled button, not a missing control. |
| A11Y-5 | Semantic structure: `main`, `nav`, `search` (or labeled search region), headings per pane. |
| A11Y-6 | Loading and error text is available to assistive tech (not color-only). Images/avatars have `alt` or `alt=""`. |
| A11Y-7 | Folder nav, smart views, user switcher, and model switcher are reachable and operable by keyboard only. |

---

## 8. Modular AI architecture

LLM calls never go out from React components directly.

```
src/services/llm/types.ts      → generateGist, generateSummary, generateReply,
                                 generateInboxBrief, generateOrgNarrative
src/services/llm/ollamaAdapter.ts
src/services/llm/prompts.ts    → versioned prompts per kind
src/config/models.ts           → supported Ollama models (v1: one entry)
```

Redux `aiSlice`: pending / fulfilled / rejected per target; cache map keyed by target + model.

Adding a capability later = new prompt + adapter method + one UI slot. Adding a model later = config entry + it appears in the model switcher.

---

## 9. Client architecture

Greenfield Vite + React + TypeScript starter. Assignment requires **Redux**.

- **Redux Toolkit** is the source of truth for mail, filters, pagination, compose, current user, selected model, activity, and cached AI results.
- Do not split mock mail across Redux and TanStack Query.
- Suggested slices: `session` (user + model), `mail`, `filters` (folder, search, date, group-by, smart view, page), `ai`, `activity`.

---

## 10. Failure modes (required)

| Situation | Behavior |
|-----------|----------|
| Ollama not running | Mail, search, compose work. AI regions show unavailable + retry. |
| Selected model not pulled | Model switcher / status explains it; mail still works. |
| Slow generation | Per-region pending state; user can keep reading. |
| Empty search / empty smart view | Explicit empty state, not a blank list. |
| Last pagination page | Next is a disabled **button**. |
| Invalid compose | Inline validation; do not send. |
| Member opens `/activity` | No data leak; redirect or forbidden empty state. |

---

## 11. Success criteria

v1 is done when all of the following are true:

1. A member can scan a **paginated** Inbox, read the **inbox brief** and row **gists**, open one mail, **apply a suggested reply**, edit, and send — new message appears without a full reload.
2. **Unread** and **Sent** folders work; **Needs reply** and **Waiting** smart views change the paginated set correctly, including with keyword / date / user grouping.
3. New thread works via manual compose and via **intent-to-draft**.
4. **User switcher** changes mailbox scope; an admin sees Activity (KPIs, per-user, timeline, org narrative); a member does not.
5. **Model switcher** exposes the supported Ollama model (one option in v1) and is wired so more models can be added via config.
6. With Ollama stopped, inbox / search / compose still function.
7. Keyboard-only use: named controls, focus rings, list composite, pagination buttons.

---

## 12. Requirement index

| Area | IDs |
|------|-----|
| Preview / list | PREVIEW-1 … PREVIEW-6, PREVIEW-AI-1, PREVIEW-AI-2 |
| Inbox brief | BRIEF-1 … BRIEF-6 |
| Search / filter | SEARCH-1 … SEARCH-6 |
| Smart views | SMART-1 … SMART-6 |
| Email view | VIEW-1 … VIEW-7, VIEW-AI-1 … VIEW-AI-4 |
| Compose | COMPOSE-1 … COMPOSE-5, COMPOSE-AI-1, COMPOSE-AI-2 |
| Admin activity | ADMIN-1 … ADMIN-6, ADMIN-AI-1, ADMIN-AI-2, ADMIN-PII-1 |
| User switcher | SESSION-1 … SESSION-5 |
| Model switcher | MODEL-1 … MODEL-6 |
| Accessibility | A11Y-1 … A11Y-7 |
