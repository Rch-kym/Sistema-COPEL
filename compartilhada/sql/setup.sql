-- COPEL: banco compartilhado, administrador único e leitores autorizados.
create schema if not exists copel_private;
revoke all on schema copel_private from public, anon, authenticated;
grant usage on schema copel_private to authenticated;
create table copel_private.configuration (
 singleton boolean primary key default true check (singleton),
 admin_email text not null check (admin_email=lower(admin_email)),
 admin_id uuid references auth.users(id) on delete set null
);
insert into copel_private.configuration(admin_email) values ('akymrocha@gmail.com');
alter table copel_private.configuration enable row level security;
create table public.copel_members(email text primary key check(email=lower(trim(email)) and email like '%@%'), role text not null default 'viewer' check(role='viewer'));
create function copel_private.access_role() returns text language sql stable security definer set search_path='' as $$
 select case when u.id=c.admin_id then 'admin' when exists(select 1 from public.copel_members m where m.email=lower(u.email)) then 'viewer' end
 from auth.users u cross join copel_private.configuration c
 where u.id=(select auth.uid()) and u.email_confirmed_at is not null and (u.banned_until is null or u.banned_until<now())
$$;
revoke all on function copel_private.access_role() from public,anon;
grant execute on function copel_private.access_role() to authenticated;
create function copel_private.bind_admin() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.email_confirmed_at is not null then
 update copel_private.configuration set admin_id=new.id where admin_id is null and admin_email=lower(new.email);
 end if;
 return new;
end $$;
revoke all on function copel_private.bind_admin() from public,anon,authenticated;
create trigger copel_bind_admin after insert or update of email_confirmed_at,email on auth.users for each row execute function copel_private.bind_admin();
update copel_private.configuration c set admin_id=u.id from auth.users u where c.admin_id is null and lower(u.email)=c.admin_email and u.email_confirmed_at is not null;
create table public.copel_settings (
 id boolean primary key default true check(id),
 data jsonb not null default jsonb_build_object('since',(now() at time zone 'America/Sao_Paulo')::date,'signatureDays',5,'deliveryDays',15,'dayMode','calendar','holidays','[]'::jsonb,'recipients','[]'::jsonb,'mailEnabled',false),
 updated_at timestamptz not null default now()
);
insert into public.copel_settings(id) values(true);
create table public.copel_records (
 id uuid primary key default gen_random_uuid(),
 kind text not null check(kind in ('process','supplier','afm','receipt','payment','document')),
 natural_key text not null check(length(natural_key) between 1 and 500),
 data jsonb not null check(jsonb_typeof(data)='object'),
 revision integer not null default 1,
 updated_at timestamptz not null default now(),
 unique(kind,natural_key)
);
create index copel_records_kind on public.copel_records(kind);
create index copel_records_afm on public.copel_records((data->>'afmId')) where kind in ('receipt','payment');
create index copel_records_process on public.copel_records((data->>'processId')) where kind in ('afm','document');
create table public.copel_notices (
 id uuid primary key default gen_random_uuid(), event_key text unique not null,
 afm_id uuid references public.copel_records(id), process_id uuid references public.copel_records(id),
 kind text not null, title text not null, detail text not null,
 occurred_at timestamptz, active boolean not null default true, created_at timestamptz not null default now()
);
create index copel_notices_active on public.copel_notices(created_at desc) where active;
create table public.copel_notice_reads (
 notice_id uuid references public.copel_notices(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 at timestamptz not null default now(), primary key(notice_id,user_id)
);
create table public.copel_runs(id uuid primary key default gen_random_uuid(), at timestamptz not null default now(), checked integer not null);
create table copel_private.audit(id bigint generated always as identity primary key, actor uuid, action text not null, record_id uuid, at timestamptz not null default now());
alter table copel_private.audit enable row level security;

-- O cliente não escolhe sua própria permissão. Contas não liberadas não leem a base.
alter table public.copel_members enable row level security;
create policy admin_members on public.copel_members for all to authenticated using((select copel_private.access_role())='admin') with check((select copel_private.access_role())='admin');
alter table public.copel_settings enable row level security;
create policy read_settings on public.copel_settings for select to authenticated using((select copel_private.access_role()) is not null);
create policy update_settings on public.copel_settings for update to authenticated using((select copel_private.access_role())='admin') with check((select copel_private.access_role())='admin');
alter table public.copel_records enable row level security;
create policy read_records on public.copel_records for select to authenticated using((select copel_private.access_role()) is not null);
create policy insert_records on public.copel_records for insert to authenticated with check((select copel_private.access_role())='admin');
create policy update_records on public.copel_records for update to authenticated using((select copel_private.access_role())='admin') with check((select copel_private.access_role())='admin');
alter table public.copel_notices enable row level security;
create policy read_notices on public.copel_notices for select to authenticated using((select copel_private.access_role()) is not null);
create policy insert_notices on public.copel_notices for insert to authenticated with check((select copel_private.access_role())='admin');
alter table public.copel_notice_reads enable row level security;
create policy own_reads on public.copel_notice_reads for all to authenticated using(user_id=(select auth.uid()) and (select copel_private.access_role()) is not null) with check(user_id=(select auth.uid()) and (select copel_private.access_role()) is not null);
alter table public.copel_runs enable row level security;
create policy read_runs on public.copel_runs for select to authenticated using((select copel_private.access_role()) is not null);
revoke all on public.copel_members,public.copel_settings,public.copel_records,public.copel_notices,public.copel_notice_reads,public.copel_runs from anon,authenticated;
grant select,insert,update,delete on public.copel_members to authenticated;
grant select,update on public.copel_settings to authenticated;
grant select,insert,update on public.copel_records to authenticated;
grant select,insert on public.copel_notices to authenticated;
grant select,insert,update on public.copel_notice_reads to authenticated;
grant select on public.copel_runs to authenticated;

create function public.copel_role() returns text language sql stable security invoker set search_path='' as $$select copel_private.access_role()$$;
revoke all on function public.copel_role() from public,anon;
grant execute on function public.copel_role() to authenticated;

create function copel_private.valid_day(v text) returns boolean language plpgsql immutable set search_path='' as $$
begin return coalesce(v ~ '^\d{4}-\d{2}-\d{2}$' and (v::date)::text=v,false); exception when others then return false; end $$;
revoke all on function copel_private.valid_day(text) from public,anon;
grant execute on function copel_private.valid_day(text) to authenticated;
create function copel_private.validate_record() returns trigger language plpgsql security invoker set search_path='' as $$
declare p jsonb:=new.data; parent jsonb; used numeric; k text; amount numeric; today date:=(now() at time zone 'America/Sao_Paulo')::date;
begin
 perform pg_advisory_xact_lock(729,1);
 if tg_op='UPDATE' then
  if new.id<>old.id or new.kind<>old.kind then raise exception 'Identidade do registro não pode mudar.'; end if;
  if new.kind in ('receipt','payment') then raise exception 'Recebimentos e pagamentos confirmados não podem ser sobrescritos.'; end if;
  new.revision:=old.revision+1;
 else new.revision:=1; end if;
 new.updated_at:=now();
 new.data:=p-'id'-'kind'-'revision'-'updatedAt';
 if octet_length(new.data::text)>100000 then raise exception 'Registro muito grande.'; end if;
 if new.kind in ('process','supplier') and coalesce(length(trim(p->>'name')),0)<2 then raise exception 'Informe um nome válido.'; end if;
 if new.kind='process' then
  if coalesce(p->>'sei','') !~ '^\d{3}\.\d{4,5}\.\d{4}\.\d{7}-\d{2}$' then raise exception 'Número SEI inválido.'; end if;
  new.natural_key:=p->>'sei';
  if coalesce(p->>'status','') not in ('active','closed','cancelled') then raise exception 'Situação inválida.'; end if;
 elsif new.kind='supplier' then
  if coalesce(p->>'cnpj','') !~ '^\d{14}$' then raise exception 'Informe os 14 dígitos do CNPJ.'; end if;
  new.natural_key:=p->>'cnpj';
 elsif new.kind in ('afm','document') then
  if not exists(select 1 from public.copel_records where id=(p->>'processId')::uuid and kind='process') then raise exception 'Processo não encontrado.'; end if;
  if coalesce(length(trim(p->>'number')),0)<2 then raise exception 'Informe o número.'; end if;
  new.natural_key:=(p->>'processId')||':'||(p->>'number');
  if new.kind='afm' then
   if coalesce(p->>'supplierId','')<>'' and not exists(select 1 from public.copel_records where id=(p->>'supplierId')::uuid and kind='supplier') then raise exception 'Fornecedor não encontrado.'; end if;
   if not copel_private.valid_day(p->>'offeredAt') or (p->>'offeredAt')::date>today then raise exception 'Data de disponibilização inválida.'; end if;
   if coalesce((p->>'signatureDays')::int,0) not between 1 and 365 or coalesce((p->>'deliveryDays')::int,0) not between 1 and 730 or coalesce(p->>'dayMode','') not in ('calendar','business') then raise exception 'Prazo inválido.'; end if;
   if coalesce(p->>'supplierSignedAt','')<>'' and (not copel_private.valid_day(p->>'supplierSignedAt') or (p->>'supplierSignedAt')::date>today or (p->>'supplierSignedAt')::date<(p->>'offeredAt')::date) then raise exception 'Confira a data da assinatura do fornecedor.'; end if;
   if coalesce(p->>'deliveryDueOverride','')<>'' and (not copel_private.valid_day(p->>'deliveryDueOverride') or coalesce(p->>'supplierSignedAt','')='' or (p->>'deliveryDueOverride')::date<(p->>'supplierSignedAt')::date) then raise exception 'Data de entrega inválida.'; end if;
   if tg_op='UPDATE' then
    if coalesce(p->>'supplierSignedAt','')='' and exists(select 1 from public.copel_records where kind='receipt' and data->>'afmId'=new.id::text) then raise exception 'Há recebimentos registrados. Preserve a assinatura do fornecedor.'; end if;
    select greatest(coalesce(sum((data->>'amountCents')::numeric) filter(where kind='receipt'),0),coalesce(sum((data->>'amountCents')::numeric) filter(where kind='payment'),0)) into used from public.copel_records where data->>'afmId'=new.id::text;
    if (p->>'amountCents')::numeric<used then raise exception 'O valor contratado não pode ficar abaixo do recebido ou pago.'; end if;
   end if;
  end if;
 elsif new.kind in ('receipt','payment') then
  select data into parent from public.copel_records where id=(p->>'afmId')::uuid and kind='afm' for update;
  if parent is null then raise exception 'AFM não encontrada.'; end if;
  if new.kind='receipt' and coalesce(parent->>'supplierSignedAt','')='' then raise exception 'Confirme a assinatura do fornecedor antes do recebimento.'; end if;
  k:=case when new.kind='receipt' then 'receivedAt' else 'paidAt' end;
  if not copel_private.valid_day(p->>k) or (p->>k)::date>today then raise exception 'Data de confirmação inválida.'; end if;
  if new.kind='receipt' and (p->>k)::date<(parent->>'supplierSignedAt')::date then raise exception 'Recebimento anterior à assinatura.'; end if;
  k:=case when new.kind='receipt' then 'documentNumber' else 'reference' end;
  if coalesce(length(trim(p->>k)),0)=0 then raise exception 'Informe o documento de confirmação.'; end if;
  new.natural_key:=(p->>'afmId')||':'||trim(p->>k);
  select coalesce(sum((data->>'amountCents')::numeric),0) into used from public.copel_records where kind=new.kind and data->>'afmId'=p->>'afmId';
  if used+(p->>'amountCents')::numeric>(parent->>'amountCents')::numeric then raise exception 'O valor ultrapassa o saldo da AFM.'; end if;
 end if;
 if new.kind in ('afm','receipt','payment','process') then
  k:=case when new.kind='process' then 'estimatedCents' else 'amountCents' end;
  amount:=(p->>k)::numeric;
  if amount is null or amount<0 or amount<>trunc(amount) or amount>100000000000 or (new.kind<>'process' and amount=0) then raise exception 'Valor inválido. Use centavos inteiros.'; end if;
 end if;
 return new;
end $$;
revoke all on function copel_private.validate_record() from public,anon,authenticated;
create trigger copel_validate_record before insert or update on public.copel_records for each row execute function copel_private.validate_record();
create function copel_private.audit_record() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or copel_private.access_role() is distinct from 'admin' then raise exception 'Apenas o administrador pode salvar.'; end if;
 insert into copel_private.audit(actor,action,record_id) values(auth.uid(),lower(tg_op)||'_'||new.kind,new.id); return new;
end $$;
revoke all on function copel_private.audit_record() from public,anon,authenticated;
create trigger copel_audit_record after insert or update on public.copel_records for each row execute function copel_private.audit_record();
create function copel_private.validate_settings() returns trigger language plpgsql set search_path='' as $$
declare v text;
begin
 if not copel_private.valid_day(new.data->>'since') or coalesce((new.data->>'signatureDays')::int,0) not between 1 and 365 or coalesce((new.data->>'deliveryDays')::int,0) not between 1 and 730 or coalesce(new.data->>'dayMode','') not in ('calendar','business') then raise exception 'Confira as datas e os prazos.'; end if;
 if jsonb_typeof(new.data->'holidays') is distinct from 'array' or jsonb_typeof(new.data->'recipients') is distinct from 'array' or jsonb_typeof(new.data->'mailEnabled') is distinct from 'boolean' then raise exception 'Preferências inválidas.'; end if;
 for v in select jsonb_array_elements_text(new.data->'holidays') loop if not copel_private.valid_day(v) then raise exception 'Feriado inválido.'; end if; end loop;
 for v in select jsonb_array_elements_text(new.data->'recipients') loop if v !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'E-mail inválido.'; end if; end loop;
 new.updated_at:=now(); return new;
end $$;
revoke all on function copel_private.validate_settings() from public,anon,authenticated;
create trigger copel_validate_settings before update on public.copel_settings for each row execute function copel_private.validate_settings();
