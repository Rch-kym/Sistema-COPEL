begin;
insert into auth.users(id,email,email_confirmed_at) values('00000000-0000-4000-8000-000000000009','editor-test@example.invalid',now());
insert into public.copel_members(email,role) values('editor-test@example.invalid','editor');
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000009',true);
do $$ begin if public.copel_role() is distinct from 'editor' then raise exception 'Colaborador não reconhecido'; end if; end $$;
insert into public.copel_records(id,kind,natural_key,data) values('10000000-0000-4000-8000-000000000009','process','test','{"name":"Teste colaborador","sei":"019.0703.2026.0000009-09","estimatedCents":0,"status":"active"}');
insert into public.copel_records(id,kind,natural_key,data) values('20000000-0000-4000-8000-000000000009','afm','test','{"number":"AFM teste editor","processId":"10000000-0000-4000-8000-000000000009","amountCents":10000,"offeredAt":"2026-10-01","supplierSignedAt":"2026-10-02","signatureDays":5,"deliveryDays":15,"dayMode":"calendar"}');
insert into public.copel_records(kind,natural_key,data) values('receipt','test','{"afmId":"20000000-0000-4000-8000-000000000009","documentNumber":"Atestado teste editor","receivedAt":"2026-10-03","amountCents":1000}'),('payment','test','{"afmId":"20000000-0000-4000-8000-000000000009","reference":"NOB teste editor","paidAt":"2026-10-03","amountCents":1000}');
do $$ declare changed integer; begin
 update public.copel_records set data=jsonb_set(data,'{notes}','"Conferido pelo colaborador"'::jsonb) where id='10000000-0000-4000-8000-000000000009';get diagnostics changed=row_count;if changed<>1 then raise exception 'Colaborador não conseguiu atualizar processo'; end if;
 update public.copel_settings set data=jsonb_set(data,'{mailEnabled}','true'::jsonb);get diagnostics changed=row_count;if changed<>0 then raise exception 'Colaborador alterou configurações'; end if;
 begin insert into public.copel_members(email,role) values('invasao@example.invalid','editor');raise exception 'TESTE: colaborador gerenciou acessos';exception when insufficient_privilege then null;end;
 if (select count(*) from public.copel_members)<>0 then raise exception 'Colaborador viu gestão de acessos';end if;
end $$;
select public.copel_check_deadlines();
reset role;
select 'PASS: colaborador registra e atualiza dados operacionais sem alterar configurações ou acessos' as result;
rollback;
