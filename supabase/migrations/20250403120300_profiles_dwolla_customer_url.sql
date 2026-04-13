/* Link Supabase user to Dwolla Customer resource */
alter table public.profiles add column if not exists dwolla_customer_url text;

comment on column public.profiles.dwolla_customer_url is
  'Dwolla customer resource URL from Location header after POST /customers.';
