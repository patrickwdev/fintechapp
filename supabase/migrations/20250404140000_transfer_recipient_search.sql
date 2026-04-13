/* Searchable local email part for @handle-style matching; no full email exposed. */
alter table public.profiles
  add column if not exists email_local text;

comment on column public.profiles.email_local is 'Lowercase part before @ in auth email; for in-app recipient search only.';

create index if not exists profiles_email_local_idx on public.profiles (email_local);

/* New signups: store email local part for search. */
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  local_part text;
begin
  local_part := lower(nullif(split_part(coalesce(new.email::text, ''), '@', 1), ''));
  insert into public.profiles (id, first_name, last_name, phone, ssn_last_four, email_local)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data->>'first_name', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data->>'last_name', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data->>'phone', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data->>'ssn_last_four', '')), ''),
    nullif(local_part, '')
  );
  return new;
end;
$$;

/* Existing users: backfill email_local from auth.users */
update public.profiles p
set email_local = lower(nullif(split_part(coalesce(u.email::text, ''), '@', 1), ''))
from auth.users u
where u.id = p.id
  and (p.email_local is null or p.email_local = '');

/*
  Returns other users safe for transfer picker (no phone/ssn).
  Caller must be authenticated; excludes self.
*/
create or replace function public.search_profiles_for_transfer(p_search text, p_limit int default 20)
returns table (
  id uuid,
  first_name text,
  last_name text,
  display_name text,
  email_local text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.first_name,
    p.last_name,
    nullif(trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')), '') as display_name,
    p.email_local
  from public.profiles p
  cross join lateral (
    select nullif(
      trim(both '@' from trim(coalesce(p_search, ''))),
      ''
    ) as term
  ) q
  where auth.uid() is not null
    and p.id <> auth.uid()
    and length(q.term) >= 2
    and (
      coalesce(p.first_name, '') ilike '%' || q.term || '%'
      or coalesce(p.last_name, '') ilike '%' || q.term || '%'
      or coalesce(p.email_local, '') ilike '%' || lower(q.term) || '%'
    )
  order by display_name nulls last, p.id
  limit least(coalesce(nullif(p_limit, 0), 20), 50);
$$;

revoke all on function public.search_profiles_for_transfer(text, int) from public;
grant execute on function public.search_profiles_for_transfer(text, int) to authenticated;
