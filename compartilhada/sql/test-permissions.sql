-- Teste transacional: não deixa usuários, processos ou lançamentos na base.
begin;
insert into auth.users(id,email,email_confirmed_at) values
('00000000-0000-4000-8000-000000000001','akymrocha@gmail.com',null),
('00000000-0000-4000-8000-000000000002','leitor@example.invalid',now()),
('00000000-0000-4000-8000-000000000003','naoliberado@example.invalid',now());
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
do $$ begin if public.copel_role() is not null then raise exception 'Administrador sem e-mail confirmado recebeu acesso'; end if; end $$;
reset role;
update auth.users set email_confirmed_at=now() where id='00000000-0000-4000-8000-000000000001';
insert into public.copel_members(email) values('leitor@example.invalid');
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
do $$ begin if public.copel_role() is distinct from 'admin' then raise exception 'Administrador não reconhecido'; end if; end $$;
insert into public.copel_records(id,kind,natural_key,data) values
('10000000-0000-4000-8000-000000000001','process','teste', '{"name":"Processo de teste","sei":"019.0703.2026.0000001-01","estimatedCents":10000,"status":"active"}'),
('20000000-0000-4000-8000-000000000001','afm','teste', '{"number":"AFM de teste","processId":"10000000-0000-4000-8000-000000000001","amountCents":10000,"offeredAt":"2026-10-01","supplierSignedAt":"2026-10-02","signatureDays":5,"deliveryDays":15,"dayMode":"calendar"}');
insert into public.copel_records(kind,natural_key,data) values ('payment','teste', '{"afmId":"20000000-0000-4000-8000-000000000001","amountCents":6000,"paidAt":"2026-10-03","reference":"NOB teste 1"}');
do $$ begin
 begin
 insert into public.copel_records(kind,natural_key,data) values ('payment','teste2', '{"afmId":"20000000-0000-4000-8000-000000000001","amountCents":5000,"paidAt":"2026-10-03","reference":"NOB teste 2"}');
 raise exception 'TESTE: pagamento excedente foi aceito';
 exception when raise_exception then if sqlerrm like 'TESTE:%' then raise; end if; end;
end $$;
select public.copel_check_deadlines();
do $$ begin if not (public.copel_runtime_status()->>'scheduler')::boolean then raise exception 'Rotina não está agendada'; end if; end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',true);
do $$ begin
 if public.copel_role() is distinct from 'viewer' or (select count(*) from public.copel_records)<>3 then raise exception 'Leitor não consegue consultar'; end if;
 begin
 insert into public.copel_records(kind,natural_key,data) values('supplier','0','{"name":"Invasão","cnpj":"00000000000000"}');
 raise exception 'TESTE: leitor conseguiu editar';
 exception when insufficient_privilege then null; end;
 if (select count(*) from public.copel_members)<>0 then raise exception 'Leitor viu acessos privados'; end if;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',true);
do $$ begin
 if public.copel_role() is not null or (select count(*) from public.copel_records)<>0 then raise exception 'Conta não autorizada leu os dados'; end if;
 begin perform public.copel_check_deadlines(); raise exception 'TESTE: conta não autorizada executou rotina'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'PASS: administrador, leitor, conta não autorizada e saldo financeiro' as result;
rollback;
