-- MHH AI Manager v3 migration
alter table public.campaigns
  add column if not exists facebook_post text,
  add column if not exists headline text,
  add column if not exists image_brief text,
  add column if not exists duplicate_warning text,
  add column if not exists meta_post_id text,
  add column if not exists published_at timestamptz;

create index if not exists campaigns_user_created_idx
  on public.campaigns (user_id, created_at desc);
