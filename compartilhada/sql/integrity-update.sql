create or replace function copel_private.validate_record() returns trigger language plpgsql security invoker set search_path='' as $$
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
