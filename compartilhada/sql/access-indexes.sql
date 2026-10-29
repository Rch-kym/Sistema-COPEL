create index copel_reads_user on public.copel_notice_reads(user_id);
create index copel_notices_afm on public.copel_notices(afm_id);
create index copel_notices_process on public.copel_notices(process_id);
create index copel_config_admin on copel_private.configuration(admin_id);
