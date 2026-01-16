-- Create posts table
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  content text not null,
  author_id uuid references auth.users(id) not null,
  author_email text,
  category text not null check (category in ('notice', 'free')),
  view_count integer default 0
);

-- Enable Row Level Security (RLS)
alter table public.posts enable row level security;

-- Create policies
-- Anyone can view posts
create policy "Public posts are viewable by everyone"
  on public.posts for select
  using (true);

-- Authenticated users can create posts
create policy "Authenticated users can create posts"
  on public.posts for insert
  with check (auth.uid() = author_id);

-- Users can update their own posts
create policy "Users can update own posts"
  on public.posts for update
  using (auth.uid() = author_id);

-- Users can delete their own posts
create policy "Users can delete own posts"
  on public.posts for delete
  using (auth.uid() = author_id);

-- Create function to increment view count
create or replace function increment_view_count(post_id uuid)
returns void as $$
begin
  update public.posts
  set view_count = view_count + 1
  where id = post_id;
end;
$$ language plpgsql security definer;
