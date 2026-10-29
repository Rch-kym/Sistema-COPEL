alter table public.copel_members drop constraint copel_members_role_check;
alter table public.copel_members add constraint copel_members_role_check check(role in ('viewer','editor'));
create or replace function copel_private.access_role() returns text language sql stable security definer set search_path='' as $$
 select case when u.id=c.admin_id then 'admin' else (select m.role from public.copel_members m where m.email=lower(u.email)) end
 from auth.users u cross join copel_private.configuration c
 where u.id=(select auth.uid()) and u.email_confirmed_at is not null and (u.banned_until is null or u.banned_until<now())
$$;
alter policy insert_records on public.copel_records with check ((select copel_private.access_role())='admin' or ((select copel_private.access_role())='editor' and kind in ('process','supplier','afm','receipt','payment')));
alter policy update_records on public.copel_records using ((select copel_private.access_role())='admin' or ((select copel_private.access_role())='editor' and kind in ('process','supplier','afm','receipt','payment'))) with check ((select copel_private.access_role())='admin' or ((select copel_private.access_role())='editor' and kind in ('process','supplier','afm','receipt','payment')));
create or replace function copel_private.audit_record() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or coalesce(copel_private.access_role(),'') not in ('admin','editor') then raise exception 'Seu acesso permite apenas consulta.' using errcode='42501'; end if;
 insert into copel_private.audit(actor,action,record_id) values(auth.uid(),lower(tg_op)||'_'||new.kind,new.id); return new;
end $$;
create or replace function copel_private.check_deadlines() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or coalesce(copel_private.access_role(),'') not in ('admin','editor') then raise exception 'Acesso não autorizado.' using errcode='42501'; end if;
 return copel_private.run_reminders();
end $$;
