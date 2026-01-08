-- Schema and RLS configuration for People_Uniter
-- Extensions
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";
create extension if not exists "vector";

-- Helper to reference the auth user id consistently
create or replace view current_auth AS
select auth.uid() as auth_user_id;

-- Users
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique,
  name text,
  year text,
  branch text,
  bio text,
  visibility text default 'public' check (visibility in ('public','community','private')),
  created_at timestamptz default now()
);

-- Interests
create table if not exists public.interests (
  id bigserial primary key,
  name text not null unique,
  category text not null default 'general'
);

-- User interests with weights
create table if not exists public.user_interests (
  user_id uuid references public.users(id) on delete cascade,
  interest_id bigint references public.interests(id) on delete cascade,
  weight real default 0.5 check (weight >= 0 and weight <= 1),
  primary key (user_id, interest_id)
);

-- Groups
create table if not exists public.groups (
  id bigserial primary key,
  name text not null,
  description text,
  owner_id uuid references public.users(id) on delete set null,
  type text default 'public',
  rules text,
  created_at timestamptz default now()
);

-- Group members
create table if not exists public.group_members (
  group_id bigint references public.groups(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  role text default 'member' check (role in ('admin','member')),
  created_at timestamptz default now(),
  primary key (group_id, user_id)
);

-- Events
create table if not exists public.events (
  id bigserial primary key,
  group_id bigint references public.groups(id) on delete cascade,
  title text not null,
  description text,
  time timestamptz,
  created_at timestamptz default now()
);

-- Interactions (logs user interactions)
create table if not exists public.interactions (
  id bigserial primary key,
  user_id uuid references public.users(id) on delete cascade,
  target_type text not null check (target_type in ('user','group','event')),
  target_id text not null,
  action text not null check (action in ('view','join','leave','like','attend','click')),
  duration integer default 0,
  created_at timestamptz default now()
);

-- Recommendation metadata written by ML pipeline
create table if not exists public.recommendations_metadata (
  id bigserial primary key,
  user_id uuid references public.users(id) on delete cascade,
  entity_type text not null check (entity_type in ('user','group','event')),
  entity_id text not null,
  score real not null,
  created_at timestamptz default now(),
  unique (user_id, entity_type, entity_id)
);

-- Embeddings storage (for pgvector similarity)
create table if not exists public.embeddings (
  entity_type text not null,
  entity_id text not null,
  vector vector(128) not null,
  primary key (entity_type, entity_id)
);

-- Indexes
create index if not exists idx_users_auth_user_id on public.users(auth_user_id);
create index if not exists idx_user_interests_user on public.user_interests(user_id);
create index if not exists idx_user_interests_interest on public.user_interests(interest_id);
create index if not exists idx_groups_owner on public.groups(owner_id);
create index if not exists idx_group_members_user on public.group_members(user_id);
create index if not exists idx_group_members_group on public.group_members(group_id);
create index if not exists idx_events_group on public.events(group_id);
create index if not exists idx_interactions_user on public.interactions(user_id);
create index if not exists idx_reco_user on public.recommendations_metadata(user_id);
create index if not exists idx_embeddings_vector on public.embeddings using ivfflat (vector vector_l2_ops) with (lists = 100);

-- Row Level Security
alter table public.users enable row level security;
alter table public.interests enable row level security;
alter table public.user_interests enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.events enable row level security;
alter table public.interactions enable row level security;
alter table public.recommendations_metadata enable row level security;
alter table public.embeddings enable row level security;

-- Helper function to fetch current user's row id
create or replace function public.current_user_id() returns uuid as $$
  select id from public.users where auth_user_id = auth.uid();
$$ language sql stable;

-- Policies: users
create policy "Users can read public or self" on public.users
  for select using (
    visibility = 'public' or auth.uid() = auth_user_id or visibility = 'community'
  );

create policy "Users insert themselves" on public.users
  for insert with check (auth.uid() = auth_user_id);

create policy "Users update themselves" on public.users
  for update using (auth.uid() = auth_user_id) with check (auth.uid() = auth_user_id);

-- Policies: interests
create policy "Interests readable by all" on public.interests for select using (true);
create policy "Interests managed by service role" on public.interests
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Policies: user_interests
create policy "User interests readable by owner" on public.user_interests
  for select using (user_id = public.current_user_id());
create policy "User interests upsert by owner" on public.user_interests
  for insert with check (user_id = public.current_user_id());
create policy "User interests update by owner" on public.user_interests
  for update using (user_id = public.current_user_id()) with check (user_id = public.current_user_id());
create policy "User interests delete by owner" on public.user_interests
  for delete using (user_id = public.current_user_id());

-- Policies: groups
create policy "Groups readable by all" on public.groups for select using (true);
create policy "Groups inserted by owner" on public.groups
  for insert with check (owner_id = public.current_user_id());
create policy "Groups updated by owner" on public.groups
  for update using (owner_id = public.current_user_id()) with check (owner_id = public.current_user_id());

-- Policies: group_members
create policy "Group members readable by members" on public.group_members
  for select using (
    user_id = public.current_user_id() or
    exists (
      select 1 from public.groups g where g.id = group_members.group_id and g.owner_id = public.current_user_id()
    )
  );
create policy "Join groups as self" on public.group_members
  for insert with check (
    user_id = public.current_user_id() or
    exists (
      select 1 from public.groups g where g.id = group_members.group_id and g.owner_id = public.current_user_id()
    )
  );
create policy "Update membership by owner" on public.group_members
  for update using (
    exists (
      select 1 from public.groups g where g.id = group_members.group_id and g.owner_id = public.current_user_id()
    )
  ) with check (
    exists (
      select 1 from public.groups g where g.id = group_members.group_id and g.owner_id = public.current_user_id()
    )
  );
create policy "Leave groups as self" on public.group_members
  for delete using (user_id = public.current_user_id());

-- Policies: events
create policy "Events readable by all" on public.events for select using (true);
create policy "Events created by group owner" on public.events
  for insert with check (
    exists (
      select 1 from public.groups g where g.id = events.group_id and g.owner_id = public.current_user_id()
    )
  );
create policy "Events update by group owner" on public.events
  for update using (
    exists (
      select 1 from public.groups g where g.id = events.group_id and g.owner_id = public.current_user_id()
    )
  ) with check (
    exists (
      select 1 from public.groups g where g.id = events.group_id and g.owner_id = public.current_user_id()
    )
  );

-- Policies: interactions
create policy "Interactions readable by owner" on public.interactions
  for select using (user_id = public.current_user_id());
create policy "Interactions insert by owner" on public.interactions
  for insert with check (user_id = public.current_user_id());

-- Policies: recommendations metadata
create policy "Recommendations readable by owner" on public.recommendations_metadata
  for select using (user_id = public.current_user_id());
create policy "Recommendations written by service role" on public.recommendations_metadata
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Policies: embeddings
create policy "Embeddings readable" on public.embeddings for select using (true);
create policy "Embeddings managed by service role" on public.embeddings
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Seed minimal interests
insert into public.interests(name, category) values
  ('AI/ML', 'tech'),
  ('Photography', 'art'),
  ('Music', 'art'),
  ('Web Development', 'tech'),
  ('Community Volunteering', 'social'),
  ('Design', 'creative')
on conflict (name) do nothing;
