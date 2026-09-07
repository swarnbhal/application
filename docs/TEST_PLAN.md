# Test plan — P0 key functions

Living catalog. Status: **Planned** → **Implemented** (test path) → **Waived**.  
Update this file as each PRD surface ships. P1 cases (keyboard `j`/`k`, tone chips, debounce) are added when that UI exists.

**Harness:** Jest + Testing Library (already in the repo). AI tests mock the Ollama adapter — never require a live model in CI.

**Fixtures:** one `admin` (Priya Raman), one default `member` (Alex Duarte), threads covering Inbox / Unread / Sent / Needs reply / Waiting / FYI.

---

## F1 — Mailbox scope

| ID | Case | PRD | Status |
|----|------|-----|--------|
| P0-MAIL-01 | Inbox for user A includes only threads A participates in | SESSION-2 | Implemented (`src/lib/mail.test.ts`) |
| P0-MAIL-02 | Unread = participating + A in `unreadByUserIds` | §6 Unread | Implemented (`src/lib/mail.test.ts`) |
| P0-MAIL-03 | Sent = threads where A sent at least one message | §6 Sent | Implemented (`src/lib/mail.test.ts`) |
| P0-MAIL-04 | Switching `currentUserId` A→B changes all three folders | SESSION-2 | Implemented (`src/lib/mail.test.ts`) |

## F2 — Filter then paginate

| ID | Case | PRD | Status |
|----|------|-----|--------|
| P0-FILT-01 | Keyword matches subject/body; miss returns empty | SEARCH-1 | Implemented (`src/lib/mail.test.ts`) |
| P0-FILT-02 | Date range excludes threads outside the window | SEARCH-2 | Implemented (`src/lib/mail.test.ts`) |
| P0-FILT-03 | Needs reply = last message not from current user; Waiting = current user sent last | SMART-1, SMART-2 | Implemented (`src/lib/mail.test.ts`) |
| P0-FILT-04 | Filters compose; changing a filter resets page to 1 | SEARCH-4 | Implemented (`src/lib/mail.test.ts`, `src/store/slices/filters-slice.test.ts`) |
| P0-FILT-05 | Page size 10/25/50; page N is that slice only | PREVIEW-1 | Implemented (`src/lib/mail.test.ts`) |
| P0-FILT-06 | Group-by-user clusters the filtered set | SEARCH-3 | Implemented (`src/lib/mail.test.ts`) |

## F3 — Send / reply / new thread

| ID | Case | PRD | Status |
|----|------|-----|--------|
| P0-SEND-01 | Reply appends a message, marks recipients unread, not the sender | VIEW-6 | Implemented (`src/store/slices/mail-slice.test.ts`) |
| P0-SEND-02 | New thread rejected when recipients, subject, or body missing | COMPOSE-3 | Implemented (`src/lib/mail.test.ts`, `src/store/slices/mail-slice.test.ts`) |
| P0-SEND-03 | Valid compose appears in sender Sent and recipient Inbox | COMPOSE-4 | Implemented (`src/store/slices/mail-slice.test.ts`) |
| P0-SEND-04 | Send writes `email_sent` (and `thread_created`) as the current user | VIEW-6 | Implemented (`src/store/slices/mail-slice.test.ts`) |

## F4 — Session, model, admin gate

| ID | Case | PRD | Status |
|----|------|-----|--------|
| P0-SESS-01 | Member cannot open Activity; `/activity` redirects | ADMIN-1 | Implemented (`src/lib/session.test.ts`; UI empty state on `/activity`) |
| P0-SESS-02 | Admin sees Activity across all users | ADMIN-1 | Implemented (`src/lib/session.test.ts`) |
| P0-SESS-03 | User switch does not write a mail activity event | SESSION-4 | Implemented (`src/store/slices/mail-slice.test.ts`) |
| P0-SESS-04 | Changing model namespaces or clears AI cache | MODEL-4 | Implemented (insight keys include model id) |

## F5 — AI must not block mail

| ID | Case | PRD | Status |
|----|------|-----|--------|
| P0-AI-01 | Adapter failure does not block send/list | MODEL-5 | Implemented (mail slice has no LLM dependency; `mail-slice.test.ts`) |
| P0-AI-02 | Gists requested only for visible page ids | PREVIEW-AI-1 | Implemented (InboxPage iterates `paged.items` only) |
| P0-AI-03 | Brief cache key includes user, folder, filters, page, model | BRIEF-5 | Implemented (`filterHash` in `src/lib/mail.ts`) |
| P0-AI-04 | Apply copies into composer; does not send | VIEW-AI-4 | Implemented (`src/store/slices/compose-slice.test.ts`) |
| P0-AI-05 | Org narrative prompt has no message bodies | ADMIN-PII-1 | Implemented (`src/lib/activity.test.ts`) |

## F6 — Activity metrics

| ID | Case | PRD | Status |
|----|------|-----|--------|
| P0-ACT-01 | Sent/received counts match events in range; empty range → zeros | ADMIN-3 | Implemented (`src/lib/activity.test.ts`) |
| P0-ACT-02 | Unanswered uses the same last-sender rules as smart views | ADMIN-3 | Implemented (`src/lib/activity.test.ts`) |

---

## Manual smoke (after mail loop, then AI)

1. Switch member → folders change; Activity hidden. Switch admin → Activity visible.
2. Paginate Inbox; change page size; search to empty; clear-all.
3. Needs reply / Waiting counts move a thread after Send.
4. Invalid compose does not send; valid compose opens the thread.
5. Stop Ollama: list/compose/send still work; AI regions show unavailable.
