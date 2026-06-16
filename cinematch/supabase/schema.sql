-- ============================================================
-- CineMatch — Supabase database schema
-- Run in order in the Supabase SQL editor
-- ============================================================

-- --------------------------------------------------------
-- TABLE: rooms
-- --------------------------------------------------------
create table rooms (
  id         uuid primary key default gen_random_uuid(),
  code       text unique not null,           -- 6-char uppercase share code e.g. "XQJK72"
  deck       jsonb not null default '[]',    -- ordered array of 15 TMDB movie objects
  phase      text not null default 'genre_pick',
  -- phase values: 'genre_pick' | 'waiting' | 'swiping' | 'done'
  genres_a   text[] default null,            -- genres chosen by participant A
  genres_b   text[] default null,            -- genres chosen by participant B
  created_at timestamptz default now()
);

-- --------------------------------------------------------
-- TABLE: participants
-- --------------------------------------------------------
create table participants (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid references rooms(id) on delete cascade,
  device_id  text not null,                  -- random UUID stored in localStorage
  joined_at  timestamptz default now(),
  unique(room_id, device_id)
);

-- --------------------------------------------------------
-- TABLE: swipes
-- --------------------------------------------------------
create table swipes (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid references rooms(id) on delete cascade,
  device_id  text not null,
  movie_id   integer not null,               -- TMDB movie ID
  liked      boolean not null,
  created_at timestamptz default now(),
  unique(room_id, device_id, movie_id)
);

-- --------------------------------------------------------
-- TABLE: matches
-- --------------------------------------------------------
create table matches (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid references rooms(id) on delete cascade,
  movie_id   integer not null,
  movie_data jsonb not null,                 -- snapshot: title, poster_path, rating, year, trailer_key
  matched_at timestamptz default now(),
  unique(room_id, movie_id)
);

-- --------------------------------------------------------
-- FUNCTION + TRIGGER: auto-insert match when both like same movie
-- --------------------------------------------------------
create or replace function check_for_match()
returns trigger as $$
declare
  other_device_id text;
  movie_snap jsonb;
begin
  -- only process positive swipes
  if new.liked = false then
    return new;
  end if;

  -- find the other participant in the room
  select device_id into other_device_id
  from participants
  where room_id = new.room_id
    and device_id != new.device_id
  limit 1;

  if other_device_id is null then
    return new;
  end if;

  -- check if the other participant already liked this movie
  if exists (
    select 1 from swipes
    where room_id  = new.room_id
      and device_id = other_device_id
      and movie_id  = new.movie_id
      and liked     = true
  ) then
    -- pull the movie snapshot from the room deck
    select elem into movie_snap
    from rooms, jsonb_array_elements(deck) elem
    where id = new.room_id
      and (elem->>'id')::integer = new.movie_id;

    -- insert match, ignore if it already exists (race-condition safe)
    insert into matches (room_id, movie_id, movie_data)
    values (new.room_id, new.movie_id, movie_snap)
    on conflict do nothing;
  end if;

  return new;
end;
$$ language plpgsql;

create trigger on_swipe_insert
after insert on swipes
for each row execute function check_for_match();

-- --------------------------------------------------------
-- ROW LEVEL SECURITY
-- --------------------------------------------------------
alter table rooms        enable row level security;
alter table participants enable row level security;
alter table swipes       enable row level security;
alter table matches      enable row level security;

-- rooms: public read + write (no auth required)
create policy "public read rooms"   on rooms for select using (true);
create policy "public insert rooms" on rooms for insert with check (true);
create policy "public update rooms" on rooms for update using (true);

-- participants: public read + insert
create policy "public read participants"   on participants for select using (true);
create policy "public insert participants" on participants for insert with check (true);

-- swipes: public read + insert
create policy "public read swipes"   on swipes for select using (true);
create policy "public insert swipes" on swipes for insert with check (true);

-- matches: public read only (written by trigger, not directly by clients)
create policy "public read matches" on matches for select using (true);

-- --------------------------------------------------------
-- NOTE: After running this schema, enable Realtime on the
-- `matches` table in Supabase Dashboard →
-- Database → Replication → toggle "matches"
-- --------------------------------------------------------
