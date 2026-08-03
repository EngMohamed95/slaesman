-- AdToDeal AI — expose email on profiles.
--
-- auth.users is not reachable over REST with a user token, so the admin panel
-- had no way to show who an account belongs to. Mirroring the email onto
-- profiles (which already has an admin-readable RLS policy) fixes that without
-- handing the client a service-role key.

alter table public.profiles add column if not exists email text;

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id
  and p.email is distinct from u.email;

-- Keep it in step for new sign-ups.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  new_org uuid;
  display text;
begin
  display := coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1));

  insert into public.profiles (id, full_name, email)
  values (new.id, display, new.email)
  on conflict (id) do update set email = excluded.email;

  insert into public.organizations (name, created_by)
  values (coalesce(nullif(new.raw_user_meta_data ->> 'agency_name', ''), display), new.id)
  returning id into new_org;

  insert into public.org_members (org_id, user_id, role)
  values (new_org, new.id, 'owner')
  on conflict do nothing;

  return new;
end;
$$;

-- ...and on email change (Supabase updates auth.users, not our mirror).
create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.sync_profile_email();

-- The admin panel counts accounts and lists them; both need org context.
drop policy if exists profiles_select_admin on public.profiles;
create policy profiles_select_admin on public.profiles
  for select using (public.is_platform_admin());

select count(*) as profiles_with_email from public.profiles where email is not null;
