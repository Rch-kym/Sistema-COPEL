/* Cálculos de tempo e estagnação. Funções puras: sem rede, sem DOM, sem armazenamento. */
(function(root){
 'use strict';
 const DAY=86400000,BRT=3*3600000;
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
 const valid=s=>typeof s==='string'&&Number.isFinite(Date.parse(s));
 // Data civil em Brasília (UTC-3, sem horário de verão desde 2019).
 const dayKey=iso=>new Date(Date.parse(iso)-BRT).toISOString().slice(0,10);
 const dayNum=key=>Math.floor(Date.parse(key+'T00:00:00Z')/DAY);
 const keyOf=n=>new Date(n*DAY).toISOString().slice(0,10);

 /* Feriados e pontos facultativos de repartição pública na Bahia. Municipais e extras ficam em settings.timing.extraHolidays (AAAA-MM-DD). */
 function easter(y){const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),month=Math.floor((h+l-7*m+114)/31),day=((h+l-7*m+114)%31)+1;return Date.UTC(y,month-1,day)/DAY}
 const holidayCache=new Map();
 function holidaysOf(year){if(holidayCache.has(year))return holidayCache.get(year);const e=easter(year),set=new Set(['01-01','04-21','05-01','07-02','09-07','10-12','11-02','11-15','11-20','12-25'].map(x=>year+'-'+x));for(const off of [-48,-47,-2,60])set.add(keyOf(e+off));holidayCache.set(year,set);return set}
 function isBusinessDay(n,extra){const key=keyOf(n),dow=new Date(n*DAY).getUTCDay();return dow!==0&&dow!==6&&!holidaysOf(Number(key.slice(0,4))).has(key)&&!(extra&&extra.has(key))}
 const extraSet=list=>new Set((Array.isArray(list)?list:[]).filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(x)));
 /* Dias úteis decorridos: não conta o dia inicial; conta o dia final. */
 function businessDaysBetween(fromIso,toIso,extraHolidays){if(!valid(fromIso)||!valid(toIso))return null;const a=dayNum(dayKey(fromIso)),b=dayNum(dayKey(toIso));if(b<=a)return 0;if(b-a>7300)return null;const ex=extraHolidays instanceof Set?extraHolidays:extraSet(extraHolidays);let n=0;for(let d=a+1;d<=b;d++)if(isBusinessDay(d,ex))n++;return n}
 const calendarDays=(fromIso,toIso)=>valid(fromIso)&&valid(toIso)?Math.max(0,dayNum(dayKey(toIso))-dayNum(dayKey(fromIso))):null;

 /* Texto dos andamentos do SEI. Os padrões são tolerantes e devem ser conferidos contra processos reais. */
 const KINDS=[['sent',/remetid|enviad[oa]\s+para|tramitad/i],['received',/recebid/i],['concluded',/conclu[ií]d|conclus[aã]o\s+do\s+processo/i],['reopened',/reabert/i],['created',/processo\s+(?:p[uú]blico|restrito|sigiloso)?\s*gerado|gera[cç][aã]o\s+do\s+processo/i],['doc_signed',/assinad[oa]|assinatura/i],['doc_created',/(?:gerad[oa]|inclu[ií]d[oa]|registrad[oa])\b.{0,40}documento|documento\b.{0,40}(?:gerad|inclu[ií]d|registrad)/i],['attributed',/atribu[ií]d/i]];
 function classify(description){const t=String(description||'');for(const [kind,re] of KINDS)if(re.test(t))return kind;return 'other'}
 const PROCESS_RE=/\d{3}\.\d{4,5}\.\d{4}\.\d{7}-\d{2}/g;
 const docNumbers=description=>[...new Set((String(description||'').replace(PROCESS_RE,' ').match(/(?<![\d.])\d{6,20}(?![\d.])/g))||[])];

 function merge(...lists){const map=new Map();for(const list of lists)for(const m of Array.isArray(list)?list:[]){if(!m||!valid(m.date)||typeof m.description!=='string')continue;const date=new Date(m.date).toISOString(),unit=String(m.unit||''),key=date+'|'+unit+'|'+m.description;if(!map.has(key))map.set(key,{date,unit,description:m.description})}return [...map.values()].sort((a,b)=>Date.parse(a.date)-Date.parse(b.date))}

 /* Data real de inclusão de cada documento, quando o andamento a registra. */
 function docDates(movements){const out=new Map();for(const m of merge(movements)){if(classify(m.description)!=='doc_created')continue;for(const n of docNumbers(m.description))if(!out.has(n))out.set(n,{date:m.date,unit:m.unit})}return out}

 function metrics(movements,opts={}){
  const now=opts.now||new Date().toISOString(),ex=extraSet(opts.extraHolidays),list=merge(movements);
  if(!list.length)return null;
  const typed=list.map(m=>({...m,kind:classify(m.description)})),first=typed[0],last=typed.at(-1);
  let concluded=false;for(const m of typed){if(m.kind==='concluded')concluded=true;else if(m.kind==='reopened')concluded=false}
  const end=concluded?last.date:now;
  const holderAfter=i=>typed[i].kind==='sent'?(typed[i+1]?.unit||null):typed[i].unit||null;
  const unitMs=new Map();
  for(let i=0;i<typed.length;i++){const from=typed[i].date,to=i+1<typed.length?typed[i+1].date:end,holder=holderAfter(i)||'Destino não registrado';const bd=businessDaysBetween(from,to,ex)||0;const cur=unitMs.get(holder)||{unit:holder,businessDays:0,calendarDays:0};cur.businessDays+=bd;cur.calendarDays+=calendarDays(from,to)||0;unitMs.set(holder,cur)}
  const inTransit=last.kind==='sent'&&!concluded,currentUnit=concluded?null:inTransit?null:last.unit||null;
  let runStart=typed.length-1;if(currentUnit)while(runStart>0&&typed[runStart-1].unit===currentUnit&&typed[runStart-1].kind!=='sent')runStart--;
  const sinceUnit=concluded?null:typed[inTransit?typed.length-1:runStart].date;
  const reliableStart=opts.complete===true||first.kind==='created';
  return {movementCount:typed.length,startAt:first.date,startReliable:reliableStart,startKind:first.kind,lastMovementAt:last.date,lastMovementText:last.description,concluded,inTransit,currentUnit,
   sinceLastCalendar:concluded?null:calendarDays(last.date,now),sinceLastBusiness:concluded?null:businessDaysBetween(last.date,now,ex),
   inUnitBusiness:sinceUnit?businessDaysBetween(sinceUnit,now,ex):null,inUnitCalendar:sinceUnit?calendarDays(sinceUnit,now):null,
   ageCalendar:calendarDays(first.date,end),ageBusiness:businessDaysBetween(first.date,end,ex),endAt:concluded?last.date:null,
   unitTimes:[...unitMs.values()].sort((a,b)=>b.businessDays-a.businessDays),estimated:true};
 }

 const DEFAULT_TIMING={attentionDays:5,criticalDays:10,stageDays:{},extraHolidays:[]};
 function timingSettings(s){const t=s&&typeof s==='object'?s:{};const n=(v,d)=>Number.isFinite(Number(v))&&Number(v)>0?Math.min(365,Math.floor(Number(v))):d;const stageDays={};for(const [k,v] of Object.entries(t.stageDays&&typeof t.stageDays==='object'?t.stageDays:{})){const a=n(v?.attentionDays,0),c=n(v?.criticalDays,0);if(a&&c&&c>=a)stageDays[norm(k)]={attentionDays:a,criticalDays:c}}let attentionDays=n(t.attentionDays,DEFAULT_TIMING.attentionDays),criticalDays=n(t.criticalDays,DEFAULT_TIMING.criticalDays);if(criticalDays<attentionDays)criticalDays=attentionDays;return {attentionDays,criticalDays,stageDays,extraHolidays:[...extraSet(t.extraHolidays)]}}
 function thresholds(cfg,stage){const c=timingSettings(cfg);return c.stageDays[norm(stage)]||{attentionDays:c.attentionDays,criticalDays:c.criticalDays}}
 /* Classifica a parada em dias úteis sem movimentação registrada no SEI. */
 function stagnation(m,cfg,stage){
  if(!m)return {level:'unknown',businessDays:null,text:'Sem histórico de andamento do SEI para medir parada.'};
  if(m.concluded)return {level:'done',businessDays:null,text:'Processo concluído na unidade segundo o andamento.'};
  const t=thresholds(cfg,stage),d=m.sinceLastBusiness;
  if(d===null)return {level:'unknown',businessDays:null,text:'Não foi possível calcular a parada.'};
  const level=d>=t.criticalDays?'critical':d>=t.attentionDays?'attention':'ok';
  const where=m.inTransit?'em trânsito (destino ainda sem registro de recebimento)':m.currentUnit?'na unidade '+m.currentUnit:'';
  return {level,businessDays:d,thresholds:t,text:`${d} dia(s) útil(eis) sem movimentação registrada no SEI${where?', '+where:''}. Limites: atenção ${t.attentionDays}, crítico ${t.criticalDays}.`};
 }

 /* Tempo por etapa do Trello, a partir dos eventos "Movimentação: A → B" do histórico. */
 function stageDurations(history,now,extraHolidays){
  const ex=extraSet(extraHolidays),moves=(Array.isArray(history)?history:[]).filter(h=>valid(h?.date)&&/^Movimenta[cç][aã]o:/.test(h.text||'')).map(h=>{const m=String(h.text).match(/^Movimenta[cç][aã]o:\s*(.*?)\s*→\s*(.*)$/);return m?{date:new Date(h.date).toISOString(),from:m[1],to:m[2]}:null}).filter(Boolean).sort((a,b)=>Date.parse(a.date)-Date.parse(b.date));
  const out=[];for(let i=0;i<moves.length;i++){const to=i+1<moves.length?moves[i+1].date:now;if(!valid(to))continue;out.push({stage:moves[i].to,from:moves[i].date,to,open:i+1>=moves.length,businessDays:businessDaysBetween(moves[i].date,to,ex),calendarDays:calendarDays(moves[i].date,to)})}return out}

 function percentile(values,p){const v=values.filter(Number.isFinite).sort((a,b)=>a-b);if(!v.length)return null;return v[Math.min(v.length-1,Math.max(0,Math.ceil(p/100*v.length)-1))]}
 const summary=values=>({n:values.filter(Number.isFinite).length,median:percentile(values,50),p90:percentile(values,90),max:percentile(values,100)});
 /* rows: [{stageDurations:[…], metrics:{…}}] → resumo por etapa e por unidade (somente intervalos encerrados contam para etapa). */
 function performance(rows){
  const stage=new Map(),unit=new Map(),totals=[];
  for(const r of rows||[]){for(const d of r.stageDurations||[]){if(d.open||!Number.isFinite(d.businessDays))continue;if(!stage.has(d.stage))stage.set(d.stage,[]);stage.get(d.stage).push(d.businessDays)}
   for(const u of r.metrics?.unitTimes||[]){if(!Number.isFinite(u.businessDays))continue;if(!unit.has(u.unit))unit.set(u.unit,[]);unit.get(u.unit).push(u.businessDays)}
   if(r.metrics?.concluded&&r.metrics.startReliable&&Number.isFinite(r.metrics.ageBusiness))totals.push(r.metrics.ageBusiness)}
  const fmt=map=>[...map.entries()].map(([name,v])=>({name,...summary(v)})).sort((a,b)=>(b.median??0)-(a.median??0));
  return {byStage:fmt(stage),byUnit:fmt(unit),concluded:summary(totals)};
 }

 /* CSV para Excel brasileiro: separador ";", BOM UTF-8 e neutralização de fórmulas. */
 function csvCell(v){let s=v===null||v===undefined?'':String(v);if(/^[=+\-@\t\r]/.test(s))s="'"+s;return /[";\n\r]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s}
 function toCsv(columns,rows){const head=columns.map(c=>csvCell(c.label)).join(';');const body=(rows||[]).map(r=>columns.map(c=>csvCell(typeof c.value==='function'?c.value(r):r[c.key])).join(';'));return '\ufeff'+[head,...body].join('\r\n')}

 const api={dayKey,businessDaysBetween,calendarDays,holidaysOf,classify,docNumbers,merge,docDates,metrics,timingSettings,thresholds,stagnation,stageDurations,percentile,summary,performance,toCsv,DEFAULT_TIMING};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CopelTiming=api;
})(typeof globalThis!=='undefined'?globalThis:this);
