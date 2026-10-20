/* Conversão local: não acessa a rede nem executa conteúdo do arquivo. */
(function(root){
 'use strict';
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
 const clean=s=>String(s||'').split('\n').filter(l=>!/(senha|password|token|secret|e-mail copel)/i.test(l)).join('\n');
 const iso=s=>typeof s==='string'&&Number.isFinite(Date.parse(s))?new Date(s).toISOString():null;
 const safeUrl=s=>{try{const u=new URL(s);return u.protocol==='https:'&&!u.username&&!u.password?u.href:''}catch{return ''}};
 function convert(d,now=new Date().toISOString()){
  if(!d||typeof d.id!=='string'||typeof d.name!=='string'||!Array.isArray(d.cards)||!Array.isArray(d.lists)||!Array.isArray(d.checklists))throw Error('Selecione uma exportação JSON de quadro do Trello.');
  const lists=new Map(d.lists.map(l=>[l.id,l])),members=new Map((d.members||[]).map(m=>[m.id,m.fullName||m.username||'Membro'])),checks=new Map(d.checklists.map(c=>[c.id,c]));
  const actions=(d.actions||[]).filter(a=>iso(a.date));
  const grouped=new Map();for(const a of actions){const id=a.data?.card?.id;if(id){if(!grouped.has(id))grouped.set(id,[]);grouped.get(id).push(a)}}
  const documents=[],processes=[];
  for(const c of d.cards){if(typeof c.id!=='string'||typeof c.name!=='string')continue;const list=lists.get(c.idList),stage=list?.name||'Lista não disponível';const n=norm(stage);const category=(c.closed||list?.closed)?'arquivado':norm(stage).includes('MODELO')||c.isTemplate?'modelo':n.includes('CANCELAD')?'cancelado':n.includes('FINALIZA')?'finalizado':'ativo';
   const aa=(grouped.get(c.id)||[]).slice().sort((a,b)=>Date.parse(b.date)-Date.parse(a.date));
   const moves=aa.filter(a=>a.type==='updateCard'&&a.data?.listBefore?.id&&a.data?.listAfter?.id&&a.data.listBefore.id!==a.data.listAfter.id);
   const latest=moves[0];const entered=latest?.data.listAfter.id===c.idList?iso(latest.date):null;
   const tasks=[];for(const checkid of c.idChecklists||[]){const check=checks.get(checkid);if(!check)continue;for(const item of (check.checkItems||[]).slice().sort((a,b)=>(a.pos||0)-(b.pos||0)))tasks.push({id:item.id,text:clean(item.name),done:item.state==='complete',group:check.name||'Checklist',source:'trello'})}
   const history=aa.filter(a=>(a.type==='updateCard'&&a.data?.listBefore&&a.data?.listAfter)||['commentCard','copyCommentCard','addAttachmentToCard','updateCheckItemStateOnCard'].includes(a.type)).map(a=>({id:a.id,date:iso(a.date),type:a.type,actor:a.memberCreator?.fullName||members.get(a.idMemberCreator)||'Membro',text:a.data.listBefore&&a.data.listAfter?`Movimentação: ${a.data.listBefore.name} → ${a.data.listAfter.name}`:a.type==='commentCard'||a.type==='copyCommentCard'?clean(a.data.text):a.type==='addAttachmentToCard'?`Anexo registrado: ${clean(a.data.attachment?.name||'documento')}`:`Checklist: ${clean(a.data.checkItem?.name||'item')} · ${a.data.checkItem?.state==='complete'?'concluído':'pendente'}`,copied:a.type==='copyCommentCard'}));
   const p={id:'trello-'+c.id,trelloId:c.id,boardId:d.id,name:clean(c.name),sei:(c.name.match(/\d{3}\.\d{4,5}\.\d{4}\.\d{7}-\d{2}/)||[])[0]||'',modality:'A definir',owner:'',members:(c.idMembers||[]).map(id=>members.get(id)||'Membro não identificado'),stage,listId:c.idList,category,archived:!!(c.closed||list?.closed),priority:(c.labels||[]).some(l=>/URGEN/.test(norm(l.name)))?'Alta':'Normal',labels:(c.labels||[]).map(l=>({name:l.name||'',color:l.color||''})),notes:category==='modelo'?'Modelo ou referência do quadro. Revise sua adequação antes de usar.':clean(c.desc),due:'',dueType:'A classificar',trelloDue:iso(c.due),trelloDueComplete:!!c.dueComplete,created:'',example:false,sourceUrl:safeUrl(c.shortUrl||c.url),stageEnteredAt:entered,stageEntrySource:entered?'Movimentação registrada no Trello':null,stageTargetDays:null,lastActivityAt:iso(c.dateLastActivity),tasks,history,importedAt:now};
   processes.push(p);
   for(const a of c.attachments||[])documents.push({id:'trello-attachment-'+a.id,name:clean(a.name||a.fileName||'Anexo'),type:'Outro documento',processId:p.id,date:(iso(a.date)||now).slice(0,10),size:a.bytes||null,source:false,trello:true,url:safeUrl(a.url),mimeType:a.mimeType||'',status:'Vínculo do Trello'});
  }
  const ds=actions.map(a=>iso(a.date)).sort();
  return {processes,documents,trello:{boardId:d.id,boardName:clean(d.name),url:safeUrl(d.url||d.shortUrl),importedAt:now,actionCount:actions.length,oldestAction:ds[0]||null,newestAction:ds.at(-1)||null,partialHistory:true,lists:d.lists.map(l=>({id:l.id,name:l.name,closed:!!l.closed,pos:l.pos||0})),source:'Exportação JSON do Trello'}};
 }
 const api={convert,safeUrl};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CopelTrello=api;
})(typeof globalThis!=='undefined'?globalThis:this);
