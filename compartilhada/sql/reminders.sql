create function copel_private.add_days(start_at date, days integer, mode text, holidays jsonb) returns date language plpgsql immutable set search_path='' as $$
declare d date:=start_at; n integer:=days;
begin
 if d is null or n is null or n<0 or n>730 then raise exception 'Prazo inválido.'; end if;
 while n>0 loop d:=d+1; if mode='calendar' or (extract(isodow from d)<6 and not holidays ? d::text) then n:=n-1; end if; end loop;
 return d;
end $$;
revoke all on function copel_private.add_days(date,integer,text,jsonb) from public,anon,authenticated;
create function copel_private.run_reminders() returns jsonb language plpgsql security invoker set search_path='' as $$
declare a record; s jsonb; p jsonb; due date; delivered numeric; today date:=(now() at time zone 'America/Sao_Paulo')::date; k text; title text; event_at date; event_key text; checked integer:=0; run_id uuid;
begin
 perform pg_advisory_xact_lock(729,2);
 select data into s from public.copel_settings where id;
 update public.copel_notices set active=false where kind in ('signature_overdue','delivery_overdue','delivery_soon','signed');
 for a in select id,data from public.copel_records where kind='afm' loop
  checked:=checked+1; p:=a.data;
  due:=copel_private.add_days((p->>'offeredAt')::date,(p->>'signatureDays')::int,p->>'dayMode',s->'holidays');
  if coalesce(p->>'supplierSignedAt','')<>'' then
   event_at:=(p->>'supplierSignedAt')::date; k:='signed';
   title:=case when event_at>due then 'AFM assinada após o prazo' else 'AFM assinada' end;
   event_key:='signed:'||a.id||':'||event_at;
   insert into public.copel_notices(event_key,afm_id,process_id,kind,title,detail,occurred_at)
   values(event_key,a.id,(p->>'processId')::uuid,k,title,(p->>'number')||' · assinatura do fornecedor confirmada em '||event_at,(event_at::timestamp at time zone 'America/Sao_Paulo'))
   on conflict on constraint copel_notices_event_key_key do update set active=true,title=excluded.title,detail=excluded.detail;
   select coalesce(sum((data->>'amountCents')::numeric),0) into delivered from public.copel_records where kind='receipt' and data->>'afmId'=a.id::text;
   due:=coalesce(nullif(p->>'deliveryDueOverride','')::date,copel_private.add_days(event_at,(p->>'deliveryDays')::int,p->>'dayMode',s->'holidays'));
   if delivered>=(p->>'amountCents')::numeric then continue; end if;
   if today>due then k:='delivery_overdue'; title:='Entrega em atraso';
   elsif today+3>=due then k:='delivery_soon'; title:='Entrega próxima do prazo';
   else continue; end if;
  elsif today>due then k:='signature_overdue'; title:='AFM aguardando assinatura';
  else continue; end if;
  event_at:=due; event_key:=replace(k,'_','-')||':'||a.id||':'||due;
  insert into public.copel_notices(event_key,afm_id,process_id,kind,title,detail,occurred_at)
  values(event_key,a.id,(p->>'processId')::uuid,k,title,(p->>'number')||' · prazo até '||due,(due::timestamp at time zone 'America/Sao_Paulo'))
  on conflict on constraint copel_notices_event_key_key do update set active=true,title=excluded.title,detail=excluded.detail;
 end loop;
 insert into public.copel_runs(checked) values(checked) returning id into run_id;
 return jsonb_build_object('checked',checked,'id',run_id,'at',now(),'mail',jsonb_build_object('configured',false,'sent',0));
end $$;
revoke all on function copel_private.run_reminders() from public,anon,authenticated;
create function copel_private.check_deadlines() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or copel_private.access_role() is distinct from 'admin' then raise exception 'Apenas o administrador pode conferir os prazos.' using errcode='42501'; end if;
 return copel_private.run_reminders();
end $$;
revoke all on function copel_private.check_deadlines() from public,anon;
grant execute on function copel_private.check_deadlines() to authenticated;
create function public.copel_check_deadlines() returns jsonb language sql security invoker set search_path='' as $$select copel_private.check_deadlines()$$;
revoke all on function public.copel_check_deadlines() from public,anon;
grant execute on function public.copel_check_deadlines() to authenticated;
create extension if not exists pg_cron;
select cron.schedule('copel-verificar-prazos','0 11 * * *',$job$select copel_private.run_reminders();$job$);
