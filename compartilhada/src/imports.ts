import {records as rows,put,notice,supabase,naturalKey} from './api';
import {schemas} from './validation';
import {convertTrello} from './trello-import.mjs';
const fail=(message:string):never=>{throw Error(message)};
import {day} from './domain.mjs';
const sei=/^\d{3}\.\d{4,5}\.\d{4}\.\d{7}-\d{2}$/;
const norm=(s:any)=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function eventOf(m:any){const t=norm(m.description);if(/bloco|cancel|exclu|retir|disponibil|libera|solicita|aguard|pendente/.test(t))return null;const number=String(m.description||'').match(/\b\d{6,20}\b/)?.[0];if(!number||!Number.isFinite(Date.parse(m.date)))return null;const kind=/assinatura.*(?:realizada|registrada)|(?:documento|assinatura).*assinad|assinado.*documento/.test(t)?'signature':/(?:inclu|inser|gerad|anexa|recebid).*documento|documento.*(?:inclu|inser|gerad|anexa|recebid)/.test(t)?'document':null;return kind?{kind,number,date:new Date(m.date).toISOString()}:null}
export async function importData(input:any){let imported=0,documents=0,skipped=0;const converted=input?.cards?convertTrello(input):null;if(converted)input=converted;const existing=await rows('process'),map=new Map(existing.map(p=>[p.sei,p]));if(input?.format==='copel-sei-review-v1')input={processes:[],seiReviews:{[input.processNumber]:[input]}};if(!input||!Array.isArray(input.processes)||input.processes.length>500)fail('Selecione um backup da Central ou uma consulta JSON do SEI.');
for(const p of input.processes){if(p.example||!p.name||!sei.test(p.sei||'')){skipped++;continue}if(map.has(p.sei)){skipped++;continue}const id=await put('process',{name:String(p.name).slice(0,200),sei:p.sei,stage:String(p.stage||'Planejamento').slice(0,100),modality:String(p.modality||'A definir').slice(0,100),owner:String(p.owner||'').slice(0,120),notes:String(p.notes||'').slice(0,3000),estimatedCents:0,status:['active','closed','cancelled'].includes(p.status)?p.status:'active',legacy:p.legacy||p});map.set(p.sei,{id,sei:p.sei});imported++}
for(const [number,raw] of Object.entries(input.seiReviews||{})){const process:any=map.get(number);if(!process)continue;const history=(Array.isArray(raw)?raw:[]).slice(0,30).sort((a,b)=>Date.parse(a.capturedAt)-Date.parse(b.capturedAt));let known=await rows('document');for(const snapshot of history){if(snapshot.status==='failed'||!Array.isArray(snapshot.documents)||snapshot.documents.length>10000)continue;const events=(snapshot.movements||[]).map(eventOf).filter(Boolean);for(const d of snapshot.documents){if(!/^\d{6,20}$/.test(d.number)||!d.title)continue;const old=known.find(x=>x.processId===process.id&&x.number===d.number);const inserted=events.find((e:any)=>e.kind==='document'&&e.number===d.number)?.date||old?.insertedAt||null;const signed=events.filter((e:any)=>e.kind==='signature'&&e.number===d.number).at(-1)?.date||old?.signedAt||null;const payload={...(old?{id:old.id,revision:old.revision}:{}),processId:process.id,number:d.number,title:String(d.title).slice(0,500),insertedAt:inserted,signedAt:signed,signatureObserved:d.signatureStatus==='observed',capturedAt:snapshot.capturedAt};await put('document',payload);documents++;if(old&&signed&&signed!==old.signedAt)await notice({eventKey:`sei-signature:${process.id}:${d.number}:${signed}`,processId:process.id,kind:'signature_candidate',title:'Assinatura identificada no SEI',detail:`${d.number} · ${d.title}. Para AFMs, confirme se a assinatura é do fornecedor.`,occurredAt:signed});if(!old&&known.some(x=>x.processId===process.id)&&inserted)await notice({eventKey:`sei-document:${process.id}:${d.number}`,processId:process.id,kind:/atestado.*recebimento/.test(norm(d.title))?'receipt_candidate':'document',title:/atestado.*recebimento/.test(norm(d.title))?'Atestado de recebimento identificado':'Novo documento',detail:`${d.number} · ${d.title}${/atestado.*recebimento/.test(norm(d.title))?' · confira a AFM e registre o recebimento.':''}`,occurredAt:inserted});}known=await rows('document')}}
return {imported,documents,skipped,trello:converted?.trelloSummary}}

export async function restoreBackup(input:any){
 const {count,error}=await supabase.from('copel_records').select('id',{head:true,count:'exact'});if(error)throw error;
 if(count)throw Error('Restaure o backup compartilhado apenas em uma base vazia. A importação da Central anterior continua disponível.');
 const prepared:any[]=[];
 for(const [kind,key]of [['process','processes'],['supplier','suppliers'],['afm','afms'],['receipt','receipts'],['payment','payments'],['document','documents']]){
  if(!Array.isArray(input[key])||input[key].length>10000)throw Error('Backup inválido ou muito grande.');
  for(const raw of input[key]){
   if(!/^[0-9a-f-]{36}$/i.test(raw.id||''))throw Error('Identificador inválido no backup.');
   let data:any;
   if(kind==='document'){if(!raw.processId||!/^\d{6,20}$/.test(raw.number)||typeof raw.title!=='string')throw Error('Documento inválido no backup.');data={processId:raw.processId,number:raw.number,title:raw.title,insertedAt:raw.insertedAt,signedAt:raw.signedAt,signatureObserved:!!raw.signatureObserved,capturedAt:raw.capturedAt}}
   else{const parsed=schemas[kind].safeParse({...raw,submissionId:crypto.randomUUID()});if(!parsed.success)throw Error('Registro inválido no backup: '+(parsed.error.issues[0]?.message||kind));const {id,revision,submissionId,...clean}=parsed.data;data={...clean,...(kind==='process'&&raw.legacy?{legacy:raw.legacy}:{})}}
   prepared.push({id:raw.id,kind,natural_key:naturalKey(kind,data),data});
  }
 }
 // Uma única inserção: qualquer falha desfaz todos os registros do backup.
 if(prepared.length){const {error}=await supabase.from('copel_records').insert(prepared);if(error)throw error}
 return {imported:input.processes.length,documents:input.documents.length,skipped:0,restored:true};
}
