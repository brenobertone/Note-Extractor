-- Create user_actions table
create table if not exists public.user_actions (
  id bigint generated always as identity primary key,
  content text not null,
  category text check (category in ('Tasks', 'Habits')),
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.user_actions enable row level security;

-- Policies
create policy "Allow all for now" on public.user_actions
  for all using (true) with check (true);
