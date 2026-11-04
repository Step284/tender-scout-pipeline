drop policy if exists "self update display" on public.organization_members;
create or replace function public.update_my_display_name(_org uuid, _name text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if char_length(coalesce(_name,'')) not between 1 and 80 then raise exception 'invalid name'; end if;
  update public.organization_members set display_name = _name where organization_id = _org and user_id = auth.uid();
end $$;
revoke all on function public.update_my_display_name(uuid, text) from public, anon;
grant execute on function public.update_my_display_name(uuid, text) to authenticated;
