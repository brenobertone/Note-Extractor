-- Create images table to store uploaded image metadata
create table if not exists public.images (
  id bigint generated always as identity primary key,
  user_action_id bigint not null references public.user_actions(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  file_size integer,
  created_at timestamptz default now()
);

-- Create index for efficient lookup by user_action_id
create index idx_images_user_action_id on public.images(user_action_id);

-- Enable RLS
alter table public.images enable row level security;

-- Policy (development - allow all)
create policy "Allow all for now" on public.images
  for all using (true) with check (true);

-- Create storage bucket for images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'note-images',
  'note-images',
  true,
  10485760, -- 10MB
  array['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
on conflict (id) do nothing;

-- Storage bucket policies (allow all for development)
create policy "Allow public read access" on storage.objects
  for select using (bucket_id = 'note-images');

create policy "Allow public upload" on storage.objects
  for insert with check (bucket_id = 'note-images');

create policy "Allow public delete" on storage.objects
  for delete using (bucket_id = 'note-images');
