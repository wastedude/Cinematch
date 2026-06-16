# CineMatch — Developer Guide

> A "Tinder for movies" PWA. Two people join an anonymous room, each pick genres, swipe through a shared 15-movie deck, and get real-time "It's a Match!" notifications when both like the same film.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + CSS custom properties |
| Animations | Framer Motion |
| Database | Supabase (Postgres) |
| Realtime | Supabase Realtime |
| Movie data | TMDB API v3 |
| PWA | @ducanh2912/next-pwa |
| Deployment | Vercel |
| Fonts | Bebas Neue (display) + Manrope (body) |

---

## Project Structure

```
flixmatch/
├── app/
│   ├── layout.tsx                  # Root layout: fonts, header, TMDB attribution
│   ├── page.tsx                    # Landing page: create or join room
│   ├── room/[code]/
│   │   ├── page.tsx                # Room hub: genre pick → waiting → swipe → matches
│   │   └── layout.tsx
│   └── api/
│       ├── rooms/route.ts          # POST: create room  GET: fetch room by code
│       ├── genres/route.ts         # GET: proxy TMDB genre list (24h cache)
│       └── deck/route.ts           # POST: build 15-movie deck from blended genres
├── components/                     # All UI components (SwipeCard, CardStack, etc.)
├── hooks/
│   ├── useRoom.ts                  # Room state, participants, phase transitions
│   ├── useSwipe.ts                 # Swipe recording
│   └── useMatches.ts               # Realtime match subscription
├── lib/
│   ├── supabase/client.ts          # Browser Supabase client
│   ├── supabase/server.ts          # Server Supabase client (API routes)
│   ├── tmdb.ts                     # TMDB fetch helper (server-side only)
│   └── deck.ts                     # Genre blending + deck assembly
├── types/index.ts                  # Shared TypeScript types
├── styles/globals.css              # Tailwind base + theme CSS variables
├── public/
│   ├── manifest.json               # PWA manifest
│   └── tmdb-logo.svg               # Required TMDB attribution logo
├── supabase/schema.sql             # Full DB schema + RLS policies
├── .env.example                    # Template for environment variables
└── docs/                           # This folder
```

---

## Prerequisites

- Node.js 18+
- npm 9+
- A [Supabase](https://supabase.com) account (free tier works)
- A [TMDB API key](https://www.themoviedb.org/settings/api) (free)

---

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/flixmatch.git
cd flixmatch
```

### 2. Install dependencies

```bash
cd flixmatch
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in all four values:

```bash
TMDB_API_KEY=your_tmdb_v3_api_key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 4. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the entire contents of `supabase/schema.sql`
3. Enable Realtime on the `rooms` and `matches` tables:
   - Go to **Database → Replication**
   - Toggle ON: `rooms`, `matches`
4. Set `REPLICA IDENTITY FULL` on all tables (prevents null columns in realtime payloads):

```sql
alter table rooms        replica identity full;
alter table participants replica identity full;
alter table swipes       replica identity full;
alter table matches      replica identity full;
```

5. Copy your **Project URL** and **anon key** from **Project Settings → API** into `.env.local`

### 5. Add the TMDB logo

Download the official logo from [themoviedb.org/about/logos-attribution](https://www.themoviedb.org/about/logos-attribution) and save it as `public/tmdb-logo.svg`. This is required by TMDB's Terms of Use.

### 6. Add PWA icons

Place these files in `public/icons/`:
- `icon-192.png` (192×192)
- `icon-512.png` (512×512)
- `icon-maskable.png` (512×512, with safe zone padding)

### 7. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Database Schema

### Tables

| Table | Purpose |
|---|---|
| `rooms` | One row per room. Holds the deck (JSONB), phase, and both genre arrays |
| `participants` | Tracks which devices have joined a room (max 2) |
| `swipes` | Each device's like/pass decision per movie |
| `matches` | Auto-populated by trigger when both devices like the same movie |

### Room phases

```
genre_pick → waiting → swiping → done
```

- `genre_pick` — initial state, both devices pick genres independently
- `waiting` — at least one device has submitted genres; waiting for the other
- `swiping` — deck built, both devices swipe
- `done` — all 15 movies swiped (tracked client-side)

### Match trigger

`check_for_match()` fires after every `swipes` INSERT. If both participants have `liked = true` for the same `movie_id`, it inserts a row into `matches`. The Supabase Realtime subscription in `useMatches` picks this up instantly.

### RLS Policies required

Run these in the SQL editor if any are missing:

```sql
-- rooms
create policy "public read rooms"   on rooms for select using (true);
create policy "public insert rooms" on rooms for insert with check (true);
create policy "public update rooms" on rooms for update using (true);

-- participants
create policy "public read participants"   on participants for select using (true);
create policy "public insert participants" on participants for insert with check (true);
create policy "public update participants" on participants for update using (true);

-- swipes
create policy "public read swipes"   on swipes for select using (true);
create policy "public insert swipes" on swipes for insert with check (true);
create policy "public update swipes" on swipes for update using (true);

-- matches
create policy "public read matches"   on matches for select using (true);
create policy "public insert matches" on matches for insert with check (true);
```

---

## Deployment (Vercel)

### First-time setup

1. Push your repo to GitHub
2. Import the project at [vercel.com/new](https://vercel.com/new)
3. **Important:** Set **Root Directory** to `flixmatch` in the project settings
4. Add all four environment variables under **Settings → Environment Variables**:
   - `TMDB_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_BASE_URL` (set to your `.vercel.app` URL or custom domain)
5. Deploy

### Re-deploys

Every push to `main` triggers an automatic redeploy. No additional config needed.

---

## API Routes

All TMDB calls are proxied through server-side API routes. The `TMDB_API_KEY` never reaches the browser.

| Route | Method | Description |
|---|---|---|
| `/api/rooms` | POST | Create a new room, returns `{ id, code }` |
| `/api/rooms?code=XXXXXX` | GET | Fetch a room by its 6-char code |
| `/api/genres` | GET | Proxy TMDB genre list (cached 24h) |
| `/api/deck` | POST | Build 15-movie deck from two genre arrays |

---

## Environment Variables Reference

| Variable | Required | Exposed to browser | Description |
|---|---|---|---|
| `TMDB_API_KEY` | Yes | No | TMDB v3 API key |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Yes | Supabase anon/public key |
| `NEXT_PUBLIC_BASE_URL` | Yes | Yes | Full URL of your deployment |

---

## Key Design Decisions

**Anonymous identity** — No auth, no login. Each device gets a UUID stored in `localStorage` (`flixmatch_device_id`). This is the sole identity mechanism.

**Deck immutability** — Once `rooms.deck` is set and phase is `swiping`, the deck never changes. Both clients read from the same frozen array.

**Race condition safety** — The `/api/deck` route uses `.neq('phase', 'swiping')` so only one client wins the deck build even if both trigger it simultaneously.

**Realtime re-fetch pattern** — Instead of trusting the Supabase Realtime payload (which returns null for unchanged columns without `REPLICA IDENTITY FULL`), the `useRoom` hook re-fetches the full room row on every UPDATE event.

---

## TMDB Legal Requirements

CineMatch uses TMDB under the free non-commercial license. The following are mandatory:

- The `<TmdbAttribution>` component must render on every page (already in `app/layout.tsx`)
- The official TMDB logo must be visible but less prominent than the CineMatch logo
- No ads, subscriptions, or paid features without a commercial TMDB license
- TMDB data must never be used to train ML/AI models
- Any long-term TMDB data cache must be purged within 6 months

---

## Scripts

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run Next.js linter
```
