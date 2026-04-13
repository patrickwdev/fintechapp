/* Wallets: one per user, balance in integer cents */
create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  balance integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id)
);

comment on table public.wallets is 'User wallet; balance stored in cents.';
comment on column public.wallets.balance is 'Balance in cents (integer).';

create index wallets_user_id_idx on public.wallets (user_id);

alter table public.wallets enable row level security;

create policy "Users can read own wallet"
  on public.wallets
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Create a wallet row whenever a new auth user is inserted (all signup paths)
create or replace function public.handle_new_user_wallet()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.wallets (user_id, balance)
  values (new.id, 0);
  return new;
end;
$$;

create trigger on_auth_user_created_wallet
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user_wallet();

grant select on table public.wallets to authenticated;
