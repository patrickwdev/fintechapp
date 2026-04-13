/* Dwolla bank → app wallet: pending transfers + idempotent credits (webhook-driven). */

alter table public.profiles
  add column if not exists dwolla_bank_funding_source_url text null;

comment on column public.profiles.dwolla_bank_funding_source_url is
  'Dwolla funding-source resource URL for the user Plaid-linked bank (ACH source).';

create table if not exists public.dwolla_pending_transfers (
  transfer_resource_url text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  created_at timestamptz not null default now()
);

comment on table public.dwolla_pending_transfers is
  'Outbound Dwolla transfers awaiting webhook completion before wallet credit.';

create index if not exists dwolla_pending_transfers_user_id_idx
  on public.dwolla_pending_transfers (user_id);

alter table public.dwolla_pending_transfers enable row level security;

create table if not exists public.dwolla_transfer_credits (
  transfer_resource_url text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  created_at timestamptz not null default now()
);

comment on table public.dwolla_transfer_credits is
  'Ledger of wallet credits applied from completed Dwolla transfers (idempotent by transfer URL).';

create index if not exists dwolla_transfer_credits_user_id_idx
  on public.dwolla_transfer_credits (user_id);

alter table public.dwolla_transfer_credits enable row level security;

/* Idempotent credit: insert ledger row then bump wallet; no-op if URL already credited. */
create or replace function public.try_credit_wallet_from_dwolla (
  p_transfer_url text,
  p_user_id uuid,
  p_amount_cents integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted text;
begin
  if not exists (select 1 from public.wallets w where w.user_id = p_user_id) then
    raise exception 'wallet not found for user %', p_user_id;
  end if;

  insert into public.dwolla_transfer_credits (transfer_resource_url, user_id, amount_cents)
  values (p_transfer_url, p_user_id, p_amount_cents)
  on conflict (transfer_resource_url) do nothing
  returning transfer_resource_url into v_inserted;

  if v_inserted is null then
    return false;
  end if;

  update public.wallets
  set balance = balance + p_amount_cents
  where user_id = p_user_id;

  delete from public.dwolla_pending_transfers
  where transfer_resource_url = p_transfer_url;

  return true;
end;
$$;

revoke all on function public.try_credit_wallet_from_dwolla (text, uuid, integer) from public;
grant execute on function public.try_credit_wallet_from_dwolla (text, uuid, integer) to service_role;
