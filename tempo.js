'use strict';
/* Página "Tempo e prazos": parada em dias úteis, linha do tempo por processo, desempenho e limites. */
const tpBaseRender=render,tpBaseBind=bindPage;
let tpTab='parados',tpFilter='todos',tpSel=null;
const TP_COLORS=['#294e9b','#e0a63a','#279d8d','#7a5cb0','#b84848','#5b8fb9','#8a9aae'];
const TP_LEVELS={critical:['red','Crítico'],attention:['orange','Atenção'],ok:['green','Em dia'],unknown:['gray','Sem histórico'],done:['gray','Concluído']};
const tpFmt=(iso,year)=>iso&&Number.isFinite(Date.parse(iso))?new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',...(year?{year:'numeric'}:{})}).format(new Date(iso)):'—';
const tpFmtTime=iso=>iso&&Number.isFinite(Date.parse(iso))?new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(iso)):'—';
const tpNum=v=>Number.isFinite(v)?v:null;
const tpDays=v=>v===null||v===undefined?'—':v+(v===1?' dia útil':' dias úteis');
const tpNorm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase();

function tpRows(){
 const report=timingReport();
 const rows=report.rows.filter(r=>active(r.p)).map(r=>({...r,level:r.s.level,days:tpNum(r.s.businessDays)}));
 rows.sort((a,b)=>(b.days??-1)-(a.days??-1));
 const finished=report.rows.filter(r=>category(r.p)!=='cancelado');
 const perf=CopelTiming.performance(finished.map(r=>({stageDurations:r.sd,metrics:r.m&&{...r.m,unitTimes:r.m.unitTimes.filter(u=>u.unit!=='Destino não registrado')}})));
 return {rows,perf,all:report.rows};
}
const tpCount=(rows,l)=>rows.filter(r=>r.level===l).length;

function tpMetrics(rows,perf){
 const ages=rows.map(r=>r.m?.ageBusiness).filter(Number.isFinite),med=CopelTiming.percentile(ages,50);
 const card=(cls,label,value,small)=>`<div class="metric tp-metric ${cls}"><div class="metric-top">${label}</div><strong class="${/^[\d—]/.test(String(value))?'':'tp-text'}">${value}</strong><small>${small}</small></div>`;
 if(tpTab==='desempenho'){
  const slowStage=perf.byStage[0],slowUnit=perf.byUnit[0],c=perf.concluded;
  return `<div class="metrics">${card('','Duração mediana (concluídos)',c.median===null?'—':c.median+' d.u.',c.n?`da abertura à conclusão · ${c.n} processo(s)`:'ainda sem concluídos com histórico completo')}${card('','P90 (concluídos)',c.p90===null?'—':c.p90+' d.u.','9 em cada 10 terminam até este prazo')}${card('att','Etapa mais lenta',slowStage?esc(slowStage.name):'—',slowStage?`mediana ${slowStage.median} d.u. · n=${slowStage.n}`:'sem etapas encerradas no histórico')}${card('','Unidade com mais tempo',slowUnit?esc(slowUnit.name):'—',slowUnit?`mediana ${slowUnit.median} d.u. · n=${slowUnit.n}`:'sem dados de unidade')}</div>`;
 }
 const cfg=timingConfig();
 return `<div class="metrics">${card('crit','Parados (crítico)',tpCount(rows,'critical'),`${cfg.criticalDays} dias úteis ou mais sem movimentação`)}${card('att','Atenção',tpCount(rows,'attention'),`${cfg.attentionDays} a ${cfg.criticalDays-1} dias úteis sem movimentação`)}${card('ok','Em dia',tpCount(rows,'ok'),'movimentação recente')}${card('','Idade mediana',med===null?'—':med+' d.u.','dos processos em acompanhamento')}</div>`;
}

function tpFilters(rows){
 const items=[['todos','Todos',rows.length],['critical','Crítico',tpCount(rows,'critical')],['attention','Atenção',tpCount(rows,'attention')],['ok','Em dia',tpCount(rows,'ok')],['unknown','Sem histórico',tpCount(rows,'unknown')]];
 return `<div class="scope-tabs tp-filters" role="group" aria-label="Filtrar por situação">${items.map(([k,l,n])=>`<button data-tp-filter="${k}" class="${tpFilter===k?'selected':''}">${l} <b>${n}</b></button>`).join('')}</div>`;
}

function tpTable(rows){
 const list=rows.filter(r=>tpFilter==='todos'||r.level===tpFilter);
 if(!list.length)return '<div class="empty">Nenhum processo nesta seleção.</div>';
 return `<div class="table-wrap"><table><thead><tr><th>Processo</th><th class="tp-unit-col">Com quem está</th><th>Sem movimentação</th></tr></thead><tbody>${list.map(r=>{
  const [cls,label]=TP_LEVELS[r.level],crit=r.s.thresholds?.criticalDays||timingConfig().criticalDays,width=r.days===null?0:Math.min(100,Math.round(r.days/(crit*1.5)*100));
  const where=!r.m?'Sem consulta ao SEI':r.m.inTransit?'Destino não registrado':r.m.currentUnit||'—';
  return `<tr class="clickable ${tpSel===r.p.id?'tp-sel':''}" data-tp-row="${esc(r.p.id)}"><td><span class="object">${esc(r.p.name)}</span><span class="object-sub">${esc(r.p.sei||'SEI não informado')} · ${esc(r.p.stage)}</span><span class="object-sub tp-unit-inline">Com: ${esc(where)}</span></td><td class="tp-unit-col">${esc(where)}</td><td><div class="tp-gauge"><b>${r.days===null?'—':r.days}</b><div class="tp-track"><div class="tp-fill ${cls}" style="width:${width}%"></div></div><span class="pill ${cls}">${label}</span></div></td></tr>`}).join('')}</tbody></table></div>`;
}

function tpPanel(rows){
 const r=rows.find(x=>x.p.id===tpSel);
 if(!r)return '<div class="empty">Selecione um processo para ver a linha do tempo.</div>';
 const p=r.p,m=r.m,[cls,label]=TP_LEVELS[r.level],stageDays=daysInStage(p);
 const head=`<div class="card-head"><div><h2>${esc(p.name)}</h2><small>${esc(p.sei||'SEI não informado')}</small></div><span class="pill ${cls}">${label}</span></div>`;
 if(!m)return head+`<div class="card-body"><p class="inline-note">Ainda não há andamento do SEI para este processo. Use Atualizar agora, com o conector habilitado, para criar a referência.</p><a class="button secondary" href="#processo/${encodeURIComponent(p.id)}">Abrir ficha →</a></div>`;
 const total=m.unitTimes.reduce((a,u)=>a+u.businessDays,0)||1;
 const stack=m.unitTimes.length?`<h3 class="tp-h3">Onde o tempo foi gasto (estimado)</h3><div class="tp-stack">${m.unitTimes.map((u,i)=>`<i title="${esc(u.unit)}: ${u.businessDays} d.u." style="width:${Math.max(2,u.businessDays/total*100)}%;background:${TP_COLORS[i%TP_COLORS.length]}"></i>`).join('')}</div><div class="tp-legend">${m.unitTimes.map((u,i)=>`<span><em style="background:${TP_COLORS[i%TP_COLORS.length]}"></em>${esc(u.unit)} · ${u.businessDays} d.u.</span>`).join('')}</div>`:'';
 const tl=state.timelines?.[p.sei]?.movements||[];
 const typed=tl.map(x=>({...x,kind:CopelTiming.classify(x.description)})).reverse();
 const shown=typed.slice(0,14);
 const gap=!m.concluded&&m.sinceLastBusiness>0?`<div class="tp-ev gap"><strong>${tpDays(m.sinceLastBusiness)} sem movimentação</strong><small>desde ${tpFmt(m.lastMovementAt,true)}${m.inTransit?' · aguardando recebimento':m.currentUnit?' · '+esc(m.currentUnit):''}</small></div>`:'';
 const events=shown.map(e=>`<div class="tp-ev ${e.kind==='doc_created'||e.kind==='doc_signed'?'doc':''}"><strong>${esc(e.description.length>110?e.description.slice(0,110)+'…':e.description)}</strong><small>${tpFmtTime(e.date)}${e.unit?' · '+esc(e.unit):''}</small></div>`).join('');
 const more=typed.length>shown.length?`<p class="inline-note">+ ${typed.length-shown.length} andamento(s) anterior(es) guardado(s).</p>`:'';
 const caveat=state.timelines?.[p.sei]?.complete===true?'':'<div class="notice tp-note">O histórico lido pode estar incompleto (visão resumida do SEI ou conector anterior à v0.3). A idade do processo parte do andamento mais antigo disponível.</div>';
 return head+`<div class="card-body"><div class="facts"><div class="fact"><span>Com quem está</span><strong>${esc(m.concluded?'Concluído':m.inTransit?'Destino não registrado':m.currentUnit||'—')}</strong></div><div class="fact"><span>Sem movimentação</span><strong>${m.concluded?'—':tpDays(m.sinceLastBusiness)}</strong></div><div class="fact"><span>Idade do processo</span><strong>${tpDays(m.ageBusiness)}${m.startReliable?'':' (mínima)'}</strong></div><div class="fact"><span>Tempo na etapa (Trello)</span><strong>${stageDays===null?'Não calculável':stageDays+' dias corridos'} · ${esc(p.stage)}</strong></div></div>${stack}<h3 class="tp-h3">Linha do tempo</h3><div class="tp-tl">${gap}${events}</div>${more}<a class="button secondary" href="#processo/${encodeURIComponent(p.id)}">Abrir ficha →</a></div>${caveat}<div class="notice tp-note">Cálculo a partir dos andamentos exibidos pelo SEI. Não substitui a conferência no processo.</div>`;
}

function tpBars(items,empty){
 if(!items.length)return `<div class="empty">${empty}</div>`;
 const max=Math.max(1,...items.map(i=>i.p90??i.median??0));
 return `<div class="tp-bars">${items.map(i=>`<div class="tp-bar-row"><strong>${esc(i.name)}</strong><small>mediana ${i.median} · P90 ${i.p90} · n=${i.n}${i.n<5?' · amostra pequena':''}</small><div class="tp-bar"><i style="width:${Math.min(100,(i.median??0)/max*100)}%"></i><u style="left:${Math.min(100,(i.p90??0)/max*100)}%"></u></div></div>`).join('')}</div>`;
}

function tpConfigForm(){
 const t=CopelTiming.timingSettings(state.settings?.timing),raw=state.settings?.timing||{};
 const stageLines=Object.entries(raw.stageDays||{}).map(([k,v])=>`${k}; ${v.attentionDays}; ${v.criticalDays}`).join('\n');
 return `<section class="card"><div class="card-head"><div><h2>Limites de parada</h2><small>Em dias úteis sem movimentação registrada no SEI</small></div></div><form id="tp-form" class="card-body tp-form"><label>Atenção a partir de (dias úteis)<input name="attention" type="number" min="1" max="365" value="${t.attentionDays}" required></label><label>Crítico a partir de (dias úteis)<input name="critical" type="number" min="1" max="365" value="${t.criticalDays}" required></label><label class="tp-full">Limites diferentes por etapa (opcional)<textarea name="stages" rows="3" placeholder="Uma por linha: Etapa; atenção; crítico">${esc(stageLines)}</textarea><small class="inline-note">A etapa deve ter o mesmo nome da lista no Trello. Exemplo: Assinatura; 2; 4</small></label><label class="tp-full">Feriados e pontos facultativos extras<textarea name="holidays" rows="3" placeholder="AAAA-MM-DD, um por linha">${esc(t.extraHolidays.join('\n'))}</textarea><small class="inline-note">Já incluídos: feriados nacionais, Carnaval, Sexta-feira Santa, Corpus Christi e 2 de Julho. Acrescente os municipais e os pontos facultativos do seu órgão.</small></label><div class="tp-full"><button class="button" type="submit">Salvar limites</button></div></form></section>`;
}

function tempoPage(){
 const {rows,perf}=tpRows();
 if(!rows.some(r=>r.p.id===tpSel))tpSel=rows[0]?.p.id||null;
 const tabs=[['parados','Parados'],['desempenho','Desempenho'],['config','Limites e feriados']];
 const actions=tpTab==='config'?'':'<div class="tp-actions"><button class="button secondary" id="tp-csv">Exportar CSV</button><button class="button secondary" id="tp-backup">Backup</button></div>';
 let body;
 if(tpTab==='parados')body=`${tpMetrics(rows,perf)}<div class="tp-split"><section class="card"><div class="card-head"><div><h2>Processos por tempo parado</h2><small>Do mais parado ao menos parado</small></div></div><div class="card-body tp-filter-wrap">${tpFilters(rows)}</div>${tpTable(rows)}</section><section class="card">${tpPanel(rows)}</section></div>`;
 else if(tpTab==='desempenho')body=`${tpMetrics(rows,perf)}<div class="tp-split"><section class="card"><div class="card-head"><div><h2>Tempo por etapa do Trello</h2><small>Mediana (barra) e P90 (traço vermelho), em dias úteis</small></div></div>${tpBars(perf.byStage,'Ainda não há etapas encerradas no histórico importado.')}</section><section class="card"><div class="card-head"><div><h2>Tempo por unidade</h2><small>Estimado a partir de envios e recebimentos</small></div></div>${tpBars(perf.byUnit,'Ainda não há andamentos do SEI guardados.')}</section></div><div class="notice">Etapas só entram quando o intervalo já terminou. Resultados com menos de 5 processos aparecem como amostra pequena. O tempo por unidade é uma estimativa.</div>`;
 else body=tpConfigForm();
 return heading('ACOMPANHAMENTO','Tempo e prazos','Quanto cada processo demora, onde está parado e quem está com ele. Fonte: andamento do SEI, em dias úteis.',actions)+`<div class="scope-tabs tp-tabs" role="tablist">${tabs.map(([k,l])=>`<button role="tab" data-tp-tab="${k}" class="${tpTab===k?'selected':''}" aria-selected="${tpTab===k}">${l}</button>`).join('')}</div>${body}`;
}

function tpExportCsv(){
 const {rows,perf}=tpRows();
 if(tpTab==='desempenho'){
  const out=[...perf.byStage.map(i=>({tipo:'Etapa',...i})),...perf.byUnit.map(i=>({tipo:'Unidade',...i}))];
  download('copel-desempenho-'+today()+'.csv',CopelTiming.toCsv([{label:'Tipo',key:'tipo'},{label:'Nome',key:'name'},{label:'Processos',key:'n'},{label:'Mediana (dias úteis)',key:'median'},{label:'P90 (dias úteis)',key:'p90'},{label:'Máximo (dias úteis)',key:'max'}],out),'text/csv;charset=utf-8');
  return;
 }
 const lvl={critical:'Crítico',attention:'Atenção',ok:'Em dia',unknown:'Sem histórico',done:'Concluído'};
 const cols=[{label:'Processo',value:r=>r.p.name},{label:'Número SEI',value:r=>r.p.sei},{label:'Etapa (Trello)',value:r=>r.p.stage},{label:'Situação',value:r=>lvl[r.level]},{label:'Com quem está',value:r=>r.m?(r.m.inTransit?'Destino não registrado':r.m.currentUnit||''):''},{label:'Última movimentação',value:r=>r.m?tpFmt(r.m.lastMovementAt,true):''},{label:'Dias úteis sem movimentação',value:r=>r.days},{label:'Dias úteis na unidade',value:r=>r.m?r.m.inUnitBusiness:''},{label:'Idade (dias úteis)',value:r=>r.m?r.m.ageBusiness:''},{label:'Início no histórico',value:r=>r.m?tpFmt(r.m.startAt,true):''},{label:'Início confirmado',value:r=>r.m?(r.m.startReliable?'Sim':'Não'):''},{label:'Dias corridos na etapa (Trello)',value:r=>daysInStage(r.p)??''}];
 download('copel-tempo-processos-'+today()+'.csv',CopelTiming.toCsv(cols,rows),'text/csv;charset=utf-8');
}

function tpSaveConfig(form){
 const f=new FormData(form),attention=Number(f.get('attention')),critical=Number(f.get('critical'));
 if(!Number.isInteger(attention)||!Number.isInteger(critical)||attention<1||critical<attention||critical>365){toast('Confira os limites: o crítico deve ser igual ou maior que a atenção.');return}
 const stageDays={};
 for(const line of String(f.get('stages')||'').split('\n').map(x=>x.trim()).filter(Boolean)){const [name,a,c]=line.split(';').map(x=>x.trim());const na=Number(a),nc=Number(c);if(!name||!Number.isInteger(na)||!Number.isInteger(nc)||na<1||nc<na||nc>365){toast('Linha de etapa inválida: '+line.slice(0,60));return}stageDays[name]={attentionDays:na,criticalDays:nc}}
 const extraHolidays=[];
 for(const line of String(f.get('holidays')||'').split(/[\n,;]+/).map(x=>x.trim()).filter(Boolean)){if(!/^\d{4}-\d{2}-\d{2}$/.test(line)||!Number.isFinite(Date.parse(line+'T12:00:00Z'))){toast('Data inválida (use AAAA-MM-DD): '+line.slice(0,20));return}extraHolidays.push(line)}
 const previous=state.settings;state.settings={...(state.settings||{}),timing:{attentionDays:attention,criticalDays:critical,stageDays,extraHolidays:[...new Set(extraHolidays)].sort()}};
 if(!save()){state.settings=previous;toast('Não foi possível salvar. Exporte um backup e libere espaço.');return}
 timingCache.clear();toast('Limites salvos neste navegador.');render();
}

render=function(){
 if(location.hash==='#tempo'){
  $('#main').innerHTML=tempoPage();$('#crumb').textContent='Tempo e prazos';
  document.querySelectorAll('nav a').forEach(a=>a.classList.toggle('active',a.dataset.page==='tempo'));
  $('#nav-count').textContent=state.processes.length;bindPage();return;
 }
 tpBaseRender();
};
bindPage=function(){
 tpBaseBind();
 document.querySelectorAll('[data-tp-tab]').forEach(b=>b.onclick=()=>{tpTab=b.dataset.tpTab;render()});
 document.querySelectorAll('[data-tp-filter]').forEach(b=>b.onclick=()=>{tpFilter=b.dataset.tpFilter;render()});
 document.querySelectorAll('[data-tp-row]').forEach(tr=>tr.onclick=()=>{tpSel=tr.dataset.tpRow;render()});
 $('#tp-csv')?.addEventListener('click',tpExportCsv);
 $('#tp-backup')?.addEventListener('click',()=>download('copel-backup-'+today()+'.json',JSON.stringify(state,null,2),'application/json'));
 $('#tp-form')?.addEventListener('submit',e=>{e.preventDefault();tpSaveConfig(e.target)});
};
if(location.hash==='#tempo')render();
