import {createClient} from '@supabase/supabase-js';
import {supabaseUrl,supabaseKey} from './config';
import {afmState,day,totals} from './domain.mjs';
import {schemas} from './validation';
import {importData,restoreBackup} from './imports';
export const supabase=createClient(supabaseUrl,supabaseKey);
function checked<T>(r:{data:T,error:any}):T {if(r.error){if(r.error.code==='23505')throw Error('Este registro já existe. Abra o cadastro existente.');if(r.error.code==='42501')throw Error('Sua conta não tem permissão para esta alteração.');throw Error(r.error.message||'Não foi possível acessar o banco.')}return r.data}
export async function records(kind?:string){const all:any[]=[];for(let start=0;start<=20000;start+=1000){let q=supabase.from('copel_records').select('*').order('id').range(start,start+999);if(kind)q=q.eq('kind',kind);const list:any[]=checked(await q);all.push(...list.map(r=>({...r.data,id:r.id,kind:r.kind,revision:r.revision,updatedAt:r.updated_at})));if(list.length<1000)return all}throw Error('A base ultrapassou o limite de leitura desta versão. Solicite uma revisão da paginação.');}
export async function getData(){
 const role=checked(await supabase.rpc('copel_role'));
 if(!role)throw Error('Seu acesso ainda precisa ser liberado pelo administrador. Confirme também seu e-mail.');
 const [all,settingsResult,noticesResult,readsResult,membersResult,userResult,runtimeResult]=await Promise.all([
  records(),supabase.from('copel_settings').select('data').eq('id',true).single(),
  supabase.from('copel_notices').select('*').eq('active',true).order('created_at',{ascending:false}).limit(500),
  supabase.from('copel_notice_reads').select('notice_id,at'),
  role==='admin'?supabase.from('copel_members').select('email,role'):Promise.resolve({data:[],error:null}),supabase.auth.getUser(),supabase.rpc('copel_runtime_status')
 ]);
 const settings:any=checked(settingsResult).data,reads:any[]=checked(readsResult),user=checked(userResult).user;
 const lists:any={};for(const [kind,key]of [['process','processes'],['supplier','suppliers'],['afm','afms'],['receipt','receipts'],['payment','payments'],['document','documents']])lists[key]=all.filter(r=>r.kind===kind);
 const notices=checked(noticesResult).filter(n=>['signature_overdue','delivery_overdue','delivery_soon'].includes(n.kind)||(n.occurred_at&&day(n.occurred_at)>=settings.since)).map(n=>({...n,read_at:reads.find(r=>r.notice_id===n.id)?.at}));
 return {...lists,afms:lists.afms.map(a=>({...a,...afmState(a,lists.receipts,day(),settings.holidays)})),actor:{email:user.email,name:user.email,role},settings,notices,members:checked(membersResult),mail:[],totals:totals(lists),integrations:{sei:false,email:false,supplier:false,scheduler:!!checked(runtimeResult)?.scheduler},serverDate:day()};
}
export const naturalKey=(kind:string,p:any)=>kind==='process'?p.sei:kind==='supplier'?p.cnpj:['afm','document'].includes(kind)?p.processId+':'+p.number:p.afmId+':'+(p.documentNumber||p.reference);
export async function put(kind:string,p:any){const {id,revision,updatedAt,kind:ignored,...data}=p;const row={kind,natural_key:naturalKey(kind,p),data};
 if(id){if(!revision)throw Error('Atualize a página antes de editar.');const result=checked(await supabase.from('copel_records').update(row).eq('id',id).eq('revision',revision).select('id'));if(!result.length)throw Error('O registro mudou. Atualize a página e tente novamente.');return id}
 return checked(await supabase.from('copel_records').insert(row).select('id').single()).id;
}
export async function notice(n:any){const {error}=await supabase.from('copel_notices').insert({event_key:n.eventKey,afm_id:n.afmId||null,process_id:n.processId||null,kind:n.kind,title:n.title,detail:n.detail,occurred_at:n.occurredAt||null});if(error&&error.code!=='23505')throw error}
export async function jobs(){return checked(await supabase.rpc('copel_check_deadlines'))}
export async function action(type:string,payload:any){
 const role=checked(await supabase.rpc('copel_role'));if(type!=='read'&&role!=='admin')throw Error('Seu acesso permite apenas consulta.');let result:any={};
 if(schemas[type]){
  const parsed=schemas[type].safeParse(payload);if(!parsed.success)throw Error(parsed.error.issues[0]?.message||'Confira os campos.');const p=parsed.data;
  if(type==='receipt'||type==='payment'){
   const {submissionId,...data}=p;const prior=checked(await supabase.from('copel_records').select('data,kind').eq('id',submissionId).maybeSingle());
   if(prior){if(prior.kind!==type||prior.data.afmId!==p.afmId||prior.data.amountCents!==p.amountCents)throw Error('Este envio já foi utilizado.');result.id=submissionId}
   else {checked(await supabase.from('copel_records').insert({id:submissionId,kind:type,natural_key:naturalKey(type,p),data}));result.id=submissionId}
  }else result.id=await put(type,p);
 }else if(type==='settings'){checked(await supabase.from('copel_settings').update({data:payload}).eq('id',true))}
 else if(type==='member'){checked(await supabase.from('copel_members').upsert({email:payload.email.trim().toLowerCase(),role:'viewer'}))}
 else if(type==='read'){const user=checked(await supabase.auth.getUser()).user;checked(await supabase.from('copel_notice_reads').upsert({notice_id:payload.id,user_id:user.id}))}
 else if(type==='task'){const p=(await records('process')).find(p=>p.id===payload.id);if(!p||!p.legacy?.tasks?.[payload.index])throw Error('Item do checklist não encontrado.');p.legacy.tasks[payload.index].done=!!payload.done;await put('process',{...p,revision:payload.revision})}
 else if(type==='import'){result=payload?.format==='copel-cloud-v1'?await restoreBackup(payload):await importData(payload)}
 else throw Error('Operação não reconhecida.');
 // O salvamento já terminou. Uma indisponibilidade da rotina não deve induzir outro pagamento.
 let warning='';if(type!=='read')try{await jobs()}catch{warning='Registro salvo. A conferência dos prazos será tentada novamente pela rotina diária.'}
 return {result,data:await getData(),warning};
}
export async function exportBackup(){const data=await getData();if(data.actor.role!=='admin')throw Error('Somente o administrador pode exportar.');const blob=new Blob([JSON.stringify({format:'copel-cloud-v1',exportedAt:new Date().toISOString(),...data},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='copel-backup-'+day()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
