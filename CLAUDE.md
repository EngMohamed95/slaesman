# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Vite dev server (frontend only)
npm run build            # Production build to dist/
npm run lint             # ESLint (flat config, JS/JSX only)
npm run preview          # Preview production build
npm run whatsapp-server  # Local WhatsApp bridge on :3001 (required for live WhatsApp sync)
```

There is no test framework configured. `README.md` is the unmodified Vite template and describes nothing about this project.

## What this is

**AdToDeal AI** — a bilingual (Arabic RTL / English LTR) AI sales CRM aimed at the Gulf/Arab market. React 19 + Vite 8, plain JavaScript (no TypeScript), no UI library. Auth, CRM data and tenancy are Supabase (Postgres + RLS); a few per-user preferences remain in `localStorage`.

## Migration in progress — read this first

This codebase is being converted from prototype to a real multi-tenant SaaS on **Supabase** (Postgres + Auth + RLS + Edge Functions), with organizations/teams, server-enforced entitlements, and the official WhatsApp Cloud API. The phased plan lives at `~/.claude/plans/humming-launching-fog.md`.

**Phases 0–5 and 7 are done.** All simulated auth, payment, data and AI flows were deleted, not refactored — do not reintroduce them:

- `AuthPages.jsx` has **no Google sign-in**. The old one decoded the Google ID token in the browser with `atob()` and trusted its claims, and shipped a fake account-chooser popup that signed users in via a `postMessage` with no origin check. OAuth providers can now be added through the Supabase client, never by parsing a token in the browser.
- `SubscriptionPage.jsx` and `UpgradePaywall.jsx` **never grant a plan**. `setPlan` must not be called from any page or component — the server owns entitlements from Phase 7. The checkout modal is an informational placeholder; **do not add a card form**, real checkout redirects to the provider.
- Paywall gates must sit **below every hook** (see `SocialGeneratorPage.jsx`, `CampaignRequestPage.jsx`) — early-returning above `useState` is a conditional-hooks crash.
- `LeadDetailsPage.jsx` hoists all its `useState` above the not-found guard and re-seeds via `useEffect`. This is required for async data; reverting it crashes the page the moment leads load over the network.

- `AdminPanelPage.jsx` lists **real accounts** from `profiles`. The plan / payment-method / amount columns are gone because no subscription data exists yet; they return in Phase 7 from `subscriptions`. The MRR tile shows `—`, not the old `"697 ريال"` string literal.
- The contacts-import modal (`DEVICE_CONTACTS` in `CRMPage.jsx`) is an empty list with an explanatory empty state. It used to render seven invented people as if read from the user's phone, and importing one created a lead for someone who does not exist.

**Phase 6 sends, receives and displays**: the three Cloud API functions, the migration, the per-lead conversation view over Realtime, and the approved-template picker all exist (see the WhatsApp section). Still pending inside it — media over the Cloud API (a separate upload-then-reference flow; attachments still go through the local bridge), and retiring `whatsapp-server.cjs` with its `whatsapp-web.js`/`puppeteer` dependencies once orgs have migrated. Teams/invites (Phase 8) untouched.

### Environment

Copy `.env.example` → `.env.local` and fill `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (Supabase → Project Settings → API). Without them the app still builds and runs, but the login screen shows a "not configured" banner and every auth call returns `code: 'not_configured'` — it **never** falls back to a mock session. Only the anon key belongs in a `VITE_` variable; Vite inlines those into the bundle, so the `service_role` key must never appear there. The deploy workflow reads both from GitHub repository secrets of the same name.

Deployment is FTP-to-Hostinger via `.github/workflows/deploy.yml` on push to `main`. `vite.config.js` sets `base: './'` — keep relative asset paths.

## Architecture

### Routing: react-router with a `setPage` compatibility shim

`src/App.jsx` is now just providers + a route table. Routes live under `HashRouter`, so URLs stay `#/dashboard` — every previously bookmarked link still resolves. `BrowserRouter` needs a Hostinger `.htaccess` rewrite and `base: '/'`; that's a later, optional step.

**Pages were not rewritten.** ~40 call sites still do `setPage('crm')` and `setSelectedLeadId(id)`. Those come from `src/navigation.jsx`:

- `PAGE_PATHS` (`src/routes/paths.js`) maps each legacy page id to its path — **path names intentionally equal the page ids**.
- `setPage('leadDetails')` resolves to `/lead/:id`. Call sites do `setSelectedLeadId(id); setPage('leadDetails')` in one handler, so the id is mirrored into a **ref** — reading it from state would get the pre-update value.
- `<Page component={X} />` injects `setPage`/`setSelectedLeadId` so page components stay untouched. Passing them to pages that ignore them is deliberate.

Adding a page: add to `PAGE_PATHS`, add a `<Route>` in `App.jsx`, add a `menuItems` entry in `src/layouts/AppLayout.jsx`.

**Gotcha:** `/login` and `/register` render the same `AuthPages` component, which seeds `isRegister` from `mode` only on mount. Their routes carry distinct `key`s to force a remount — without them, navigating login→register keeps showing the login form.

Guards are in `src/components/RouteGuards.jsx`. `RequireAuth` wraps the whole authenticated shell (including `/onboarding`); `RequireRole role="admin"` wraps `/admin`, which also keeps the admin chunk from ever being downloaded by non-admins; `RedirectIfAuthed` keeps a signed-in user off `/login` and `/register`. **These are UX guards, not security** — real enforcement is RLS, once there is a server.

All three guards return a loader while `authLoading` is true. Do not "simplify" that away: session restore is async, so a guard that only checks `!user` bounces every signed-in visitor to the landing page on every page refresh.

All 15 pages are `React.lazy`. `vite.config.js` splits `@supabase/*` and the React runtime into their own chunks — both are on the boot critical path but change far less often than app code, so they stay cached across deploys. Entry chunk is ~86KB (was a single 670KB bundle).

### Nested providers, order matters

`HashRouter` → `AppProvider` → `LanguageProvider` → `CRMProvider` → `NavigationProvider` (`src/App.jsx`). `CRMContext` calls `useApp()` to key its storage by the active `user.id`, so it must stay inside `AppProvider`; `NavigationProvider` calls `useNavigate()`, so it must stay inside the router.

| Context | Owns |
|---|---|
| `src/context/AppContext.jsx` | session/auth, plan, profile, theme, geo-detected currency, feature gating |
| `src/context/LanguageContext.jsx` | `lang`, `isRTL`, `t()`; sets `document.documentElement.dir` |
| `src/context/CRMContext.jsx` | leads, tasks, campaign requests |

### Auth — Supabase, session-driven

`src/lib/supabase.js` builds the one client. `flowType: 'pkce'` is **mandatory, not a preference**: the implicit flow returns the session as `#access_token=…`, which collides with `HashRouter`'s `#/route` and is eaten before supabase-js can read it.

`AppContext` exposes `signIn` / `signUp` / `signOut` / `resetPassword` — all async, all returning `{ ok, code, message }`, never a bare `true`. `AuthPages.jsx` maps `code` to a bilingual sentence. The old `login()`/`register()`/`logout()` are gone; so is `setUser` from the context value, so no component can mint a session.

`user.role` reads `app_metadata.role`, which is signed into the JWT and writable only with the service-role key. **Never** move it to `user_metadata` (self-writable by any signed-in browser) or derive it from the email string — `email.includes('admin')` was the original hole.

### CRM data lives in Postgres

Leads, tasks and campaign requests are Supabase tables. **There is no demo data anywhere** — `INITIAL_LEADS`, `INITIAL_TASKS`, `MOCK_CONTACTS`, `MOCK_WHATSAPP_CHATS` and `mockUsers` were deleted, not disabled. A new account starts genuinely empty. Do not reintroduce seed rows; an empty state is the correct first-run experience.

Migrations are in `supabase/migrations/`, applied by pasting them into the Supabase SQL Editor (there is no CLI configured). They are idempotent and must stay that way.

**Every row carries `org_id` and `owner_id`.** An account gets its own organization from the `handle_new_user` trigger on sign-up. `AppContext` exposes `orgId`/`orgRole`; nothing can be written before that resolves, which is why `CRMContext.writable()` guards every mutation.

RLS is the real security boundary: reps see only rows where `owner_id = auth.uid()`, managers and owners see the whole org, and `campaign_requests.status` is updatable **only** by platform staff (`is_platform_admin()`). `is_org_member()` is `SECURITY DEFINER` with a pinned `search_path` — a policy on `leads` that queried `org_members` directly would recurse through that table's own RLS.

`src/lib/mappers.js` is the only file that knows about `snake_case`. Pages read `lead.nextFollowUp`; the database column is `next_follow_up`. Empty strings are converted to `null` there — Postgres rejects `''` for date, numeric and uuid columns, which is the single most likely source of a 400 on write.

Writes are **optimistic with rollback**: state updates first, the network call follows, and a failure restores the pre-mutation array and sets `syncError` (rendered by `SyncErrorBanner`). `addLead`/`addTask` still return the new object **synchronously** — `CRMPage` reads the return value on the next line — which is why ids come from `crypto.randomUUID()` client-side rather than from a database default.

`CRMBoundary` (in `AppLayout`) holds every authenticated page back until the first load resolves. Without it `/lead/:id` flashes its not-found screen and the dashboard flashes zeroes.

### localStorage — what is left

Still there, keyed by **`user.id`**: `salesmate_plan_{uid}`, `salesmate_onboarded_{uid}`, `salesmate_profile_{uid}`, `salesmate_ai_query_count_{uid}`, `adtodeal_ai_conversations_{uid}`. Plan moves to the server in Phase 7, the AI conversation store in Phase 5. The `salesmate_` prefix is intentional legacy (the brand is "AdToDeal") — do not "fix" it without a migration.

`src/utils/userStorage.js` re-indexes pre-Phase-1 email-keyed buckets into the id namespace once per account. `AppContext`'s `loadedUid` guard stops the outgoing user's state from being written under the incoming user's key during a switch — keep it.

### Plan gating — the server owns entitlements

**`setPlan` does not exist.** It is not in the `AppContext` value at all, so any code that tries to grant a plan fails at destructuring rather than silently succeeding. `plan` is read-only and comes from the `subscriptions` table.

Nothing about a plan is hardcoded in the client any more:

| What | Where it lives |
|---|---|
| Which tier a feature needs | `plan_features` rows |
| Prices per currency | `plan_prices` rows, read via `usePlanCatalog()` |
| The org's current tier | `subscriptions.plan_code` |
| AI query cap | `plan_features.limit_value` for `aiQueries` |

`validateFeatureAccess(featureKey)` reads the fetched matrix and **denies while it is loading** — defaulting to allow would flash paid pages open on every load. Gated pages early-return `<UpgradePaywall requiredPlan=... />`; `ReportsPage` gates a single tab.

`subscriptions` has **no insert/update/delete policy and no write grant** for `authenticated`. A browser cannot construct a request that grants itself a plan; writes come from a billing webhook using the service role. The same applies to `plans`/`plan_prices`/`plan_features` and the tenancy tables (`0005_lock_catalog_writes.sql`) — Supabase's default privileges grant ALL on new public tables, so every migration that adds one must revoke explicitly, or RLS ends up defending alone.

Entitlements have teeth in Postgres: `campaign_requests` select **and** insert require `org_has_feature(org_id, 'campaigns')`, so a Trial org gets nothing from REST even with a valid token. An expired or `past_due` subscription entitles nothing — `org_has_feature` and the client's `subscriptionActive` apply the same status/period rules.

Changing what a tier includes is an UPDATE on `plan_features`, not a redeploy.

Shared helper: `src/utils/chatParser.js` holds `parseChatToMessages`, used by both `CRMPage.jsx` and `AIAssistantPage.jsx` (it was previously duplicated byte-for-byte in both).

### Bilingual convention

Domain objects carry paired fields: `name`/`nameAr`, `status`/`statusAr`, `notes`/`notesAr`, `service`/`serviceAr`. New lead/task/campaign fields that are user-visible text should follow this. UI strings come from `TRANSLATIONS` in `src/mockData.js` via `t('key')`, but much of the codebase also inlines `isRTL ? 'عربي' : 'English'` directly in JSX — both patterns are in active use; match the surrounding file.

### AI layer — server-side only

`src/utils/gemini.js` is **deleted**. The browser has no API key, calls no model endpoint, and cannot supply a system instruction. Everything goes through `supabase/functions/ai-proxy/index.ts`.

The contract is `callAI(task, input, context)` from `src/utils/ai.js`:

- **`task`** is one of a fixed set the proxy knows (`assistant_chat`, `sales_copilot`, `analyze_chat`, `performance_report`, `social_content`). The system instruction for each lives in the proxy. Adding an AI feature means adding a task there, not writing a prompt preamble in a page.
- **`input`** is the user's own text.
- **`context`** carries scalars only — `lang`, ids, filters. **Never put rows in it.** The proxy fetches leads and tasks itself with the caller's token so RLS decides what the model sees; the old code inlined `JSON.stringify(leads)` into the prompt, which for a large pipeline meant a request of hundreds of kilobytes.

Each task declares the entitlement it needs, and the proxy calls `consume_ai_quota()` — a Postgres transaction that takes `for update` on the usage row **before** the model call, so concurrent requests cannot race past the cap. Exhausted quota returns `402`.

**There is no simulated fallback.** `getSimulatedResponse()` and every page-level canned block were deleted, including one in `CRMPage` that filled the add-lead form with an invented 850,000 budget and a fictional property, then reported "parsed successfully". Failures now surface through `describeAIError()`. The one surviving fallback is `analyzeWhatsAppChat()` — it regex-extracts from the real pasted text rather than inventing, and the UI now says the values came from basic extraction, not AI.

Server-side setup: deploy the function, then set `GEMINI_API_KEY` (and optionally `GEMINI_MODEL`, `ALLOWED_ORIGIN`) as function secrets. Without the key the proxy returns `503 ai_not_configured` — loudly, by design.

### WhatsApp — three paths, one of them official

**1. Cloud API (Phase 6, `supabase/functions/whatsapp-*`)** — the path that actually sends as the business. Three functions:

| Function | Does | Deploy |
|---|---|---|
| `whatsapp-connect` | Verifies the credentials against Graph, then stores the token in **Vault**. Owner/manager only. | `supabase functions deploy whatsapp-connect` |
| `whatsapp-send` | Entitlement → consent → 24-hour window → Graph → log the `wamid`. | `supabase functions deploy whatsapp-send` |
| `whatsapp-webhook` | Inbound messages and delivery receipts. **Public endpoint.** | `supabase functions deploy whatsapp-webhook --no-verify-jwt` |

Function secrets: `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET` (optionally `WHATSAPP_GRAPH_VERSION`, default `v21.0`). Without the app secret the webhook returns 503 rather than accepting unsigned callbacks.

The client sends a **lead id, never a phone number** — that is what lets the server check consent and the window against a record it trusts. `whatsapp_messages` has no insert/update policy and no write grant, so a transcript cannot be forged from a browser; both functions write with the service role.

Two rules are enforced in Postgres, not in the page: `whatsapp_window_open()` (Meta forbids free-form text more than 24h after the contact's last inbound message — outside it, only an approved template) and `leads.consent->>'whatsapp'`, which had been collected and ignored since Phase 3.

Idempotency rests on the unique index on `whatsapp_messages.wa_message_id`. Meta retries any callback that does not get a 200 and re-delivers the same `wamid` as normal operation. `whatsapp_apply_status()` ranks `sent < delivered < read` and only moves forward, because those three callbacks arrive unordered — applied blindly, a late `delivered` overwrites a `read`.

The read side is `src/components/WhatsAppConversation.jsx`, mounted in `LeadDetailsPage`. It renders `null` unless the org has a connected number, so orgs still on the deep link see nothing new. Messages arrive over Realtime (`whatsapp_messages` is in the `supabase_realtime` publication) — no polling, and nothing is appended optimistically: a message shown as sent that was not is worse than a half-second wait.

Its composer is two-faced by design. Window open → textarea. Window shut → a picker of **APPROVED** templates read live from Graph via `whatsapp-connect`'s `templates` action. Approval status is deliberately not cached in Postgres; it changes on Meta's side without telling us, and a stale "approved" is a send that fails in front of a customer.

CRMPage's 2s/3s/8s polls are **untouched and still correct** — they poll the local bridge for QR state and chat history, which Realtime on `whatsapp_messages` cannot serve. They go when the bridge does.

**2. Local bridge (`whatsapp-server.cjs`)** — Express on `:3001` driving `whatsapp-web.js` + headless Puppeteer with `LocalAuth` persisted to `.wwebjs_auth/` (gitignored). Endpoints: `GET /status` (connection state + QR data URL), `GET /chats`, `GET /chats/:chatId/messages`, `POST /send`, `POST /send-media`, `POST /logout`, `GET /debug`.

`installWhatsAppCompatibilityPatch()` (`whatsapp-server.cjs:36`) overrides `window.WWebJS.getChatModel` inside the Puppeteer page. This is load-bearing: upstream `whatsapp-web.js` drops every chat when WhatsApp Web serves LID-style chat keys without a serialized `lastReceivedKey`. Expect this to break on `whatsapp-web.js` upgrades. `resolvePhoneNumber()` similarly reaches into WhatsApp's internal `WAWebLidMigrationUtils` to map LIDs back to phone numbers.

Frontend reads the bridge URL from `VITE_WHATSAPP_BRIDGE_URL` (default `http://localhost:3001`), duplicated in `src/utils/whatsapp.js:79` and `src/pages/CRMPage.jsx:7`.

**3. wa.me deep links (`src/utils/whatsapp.js`)** — `openWhatsAppConversation()` opens `web.whatsapp.com/send` with a prefilled message. The window open is deliberately synchronous to avoid popup blocking — do not wrap it in an `await`. This is the fallback for orgs with no connected number: `WhatsAppGeneratorPage` offers the direct-send button only when `getWhatsAppAccount()` returns a row, so both paths run side by side with the connection itself as the flag.

`getWhatsAppConfig`/`setWhatsAppConfig`/`isWhatsAppCloudApiActive` are **gone**. They kept the Meta permanent token in `localStorage` and drove a Settings badge reading "Real Meta WhatsApp API Connected & Active" — while nothing in the app could send through the Cloud API at all, `sendRealWhatsAppMessage()` having been deleted in Phase 0 for putting that token in a Bearer header. Do not reintroduce a client-side WhatsApp credential store.

## Working in this codebase

- Styling is CSS variables in `src/index.css` plus heavy inline `style={{}}` objects. There is no CSS-in-JS or utility framework. Theme switching sets `data-theme` on `<html>`.
- Use logical CSS properties (`marginInlineStart`, `textAlign: 'start'`) rather than left/right so RTL keeps working.
- `src/pages/CRMPage.jsx` is ~2700 lines and holds the lead table, filters, the add-lead modal, pasted-chat analysis, and the whole live WhatsApp sync UI. Locate work by the `importMode` / `activeTab` state values before reading linearly.
- No secret is stored in the client any more. The Gemini key is a function secret (Phase 5) and the WhatsApp token is in Vault (Phase 6); `SettingsPage` posts the token to `whatsapp-connect` once and never reads it back. Do not add new secret fields to the client — the Supabase anon key in `.env.local` is public by design and is the only key that belongs in the bundle. `AdminPanelPage` is the last place worth auditing for leftovers.
