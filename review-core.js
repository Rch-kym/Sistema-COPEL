(function(root){
 'use strict';
 const number=s=>String(s||'').replace(/[^0-9]/g,'');
 const isSei=s=>/^\d{3}\.\d{4,5}\.\d{4}\.\d{7}-\d{2}$/.test(String(s||''));
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
 function read(input){
  if(input?.format!=='copel-sei-review-v1'||!isSei(input.processNumber)||!Number.isFinite(Date.parse(input.capturedAt)))throw Error('Arquivo de consulta SEI inválido. Confira o formato e o número do processo.');
  if(!['success','partial','failed'].includes(input.status))throw Error('Situação da consulta inválida.');
  if(!Array.isArray(input.documents)||input.documents.length>10000)throw Error('Lista de documentos inválida.');
  if(Date.parse(input.capturedAt)>Date.now()+300000)throw Error('A consulta tem data futura. Confira o relógio do computador.');
  const ids=new Set();const documents=input.documents.map(d=>{if(!d||typeof d.number!=='string'||!/^\d{6,20}$/.test(d.number)||typeof d.title!=='string'||!d.title.trim()||ids.has(d.number))throw Error('Documento sem identificação válida ou repetido.');ids.add(d.number);return {number:d.number,title:d.title.slice(0,500),unit:String(d.unit||'').slice(0,200),signatureStatus:['observed','none_displayed','unknown'].includes(d.signatureStatus)?d.signatureStatus:'unknown',contentProcessNumbers:Array.isArray(d.contentProcessNumbers)?[...new Set(d.contentProcessNumbers.filter(isSei))]:[],notes:String(d.notes||'').slice(0,2000)}});
  if(input.status==='failed'&&documents.length)throw Error('Consulta com falha não deve conter documentos.');
  return {format:'copel-sei-review-v1',processNumber:input.processNumber,capturedAt:new Date(input.capturedAt).toISOString(),status:input.status,documents,documentsComplete:input.status==='success'&&input.documentsComplete===true,source:String(input.source||'Consulta assistida').slice(0,200),failureReason:String(input.failureReason||'').slice(0,1000),unitsOpen:Array.isArray(input.unitsOpen)?input.unitsOpen.map(String).slice(0,50):[],movements:Array.isArray(input.movements)?input.movements.filter(m=>m&&Number.isFinite(Date.parse(m.date))&&typeof m.description==='string').map(m=>({date:new Date(m.date).toISOString(),description:m.description.slice(0,1000),unit:String(m.unit||'').slice(0,200)})).slice(0,3000):[],movementsComplete:input.movementsComplete===true,historyMode:['completo','resumido','desconhecido'].includes(input.historyMode)?input.historyMode:'desconhecido',notes:String(input.notes||'').slice(0,2000)};
 }
 const docFingerprint=d=>JSON.stringify([d.title,d.unit,d.signatureStatus,d.contentProcessNumbers.slice().sort(),d.notes]);
 function compare(current,previous){
  if(current.status==='failed')return {kind:'failed',added:[],changed:[],notVisible:[],message:'Falha de consulta. Não foi possível verificar novidades.'};
  if(!previous||previous.status==='failed')return {kind:'baseline',added:[],changed:[],notVisible:[],message:'Referência inicial. Os documentos existentes não são anunciados como novos.'};
  const old=new Map(previous.documents.map(d=>[d.number,d]));const now=new Map(current.documents.map(d=>[d.number,d]));
  const added=current.documents.filter(d=>!old.has(d.number));const changed=current.documents.filter(d=>old.has(d.number)&&docFingerprint(d)!==docFingerprint(old.get(d.number)));const notVisible=previous.documents.filter(d=>!now.has(d.number));
  return {kind:'comparison',added,changed,notVisible,message:added.length||changed.length?'Mudanças observadas desde a referência anterior.':current.documentsComplete&&previous.documentsComplete?'Nenhuma mudança nos documentos comparados.':'Sem mudanças observadas no recorte; a consulta não cobre todos os documentos.'};
 }
 function issues(s){return s.documents.flatMap(d=>d.contentProcessNumbers.filter(n=>number(n)!==number(s.processNumber)).map(n=>({kind:'process_mismatch',documentNumber:d.number,text:`O documento ${d.number} menciona o processo ${n}, diferente do processo consultado. Conferir o contexto.`})))}
 function suggest(task,s){
  const t=norm(task.text);let required=[];
  if(/ADH/.test(t)&&/RDH/.test(t)&&/NOB/.test(t))required=[/AUTORIZACAO.*DOCUMENTO HABIl/i,/REGISTRO.*DOCUMENTO HABIl/i,/LIQUIDACAO/i,/ORDEM BANCARIA|\bNOB\b/i,/DESPACHO/i];
  else if(/ATESTAR.*NF/.test(t))required=[/ATESTADO.*RECEBIMENTO/i,/FOTOGRAFIA/i];
  else if(/CHEGADA.*MERCADORIA/.test(t))required=[/ATESTADO.*RECEBIMENTO/i];
  else if(/TERMO DE REFERENCIA/.test(t))required=[/TERMO DE REFERENCIA/i];
  else if(/DOCUMENTO FORMALIZACAO|\bDFD\b/.test(t))required=[/FORMALIZACAO.*DEMANDA|\bDFD\b/i];
  else if(/AUTORIZACAO DE ABERTURA/.test(t))required=[/AUTORIZACAO.*ABERTURA/i];
  else if(/GERAR AFM/.test(t))required=[/AUTORIZACAO.*FORNECIMENTO|\bAFM\b/i];
  else if(/\bDED\b/.test(t))required=[/DEMONSTRATIVO.*EXECUCAO.*DESPESAS|\bDED\b/i];
  else if(/\bDOD\b/.test(t))required=[/DECLARACAO.*ORDENADOR|\bDOD\b/i];
  else if(/INSTRUMENTO.*CONTRATUA/.test(t))required=[/INSTRUMENTO CONTRATUAL/i];
  else if(/GERAR LID/.test(t)&&!/PUBLICACAO/.test(t))required=[/\bLID\b/i];
  const matches=required.map(re=>s.documents.filter(d=>re.test(norm(d.title))));const docs=[...new Map(matches.flat().map(d=>[d.number,d])).values()];
  const linkedIssues=issues(s).filter(i=>docs.some(d=>d.number===i.documentNumber));
  return {docs,allFound:required.length>0&&matches.every(m=>m.length),issues:linkedIssues,reason:!required.length?'Não há regra automática para este item. Vincule a evidência manualmente.':!docs.length?'Evidência não localizada neste recorte. Não comprova ausência no processo.':matches.some(m=>!m.length)?'Há evidências parciais; confira os demais requisitos.':'Documentos candidatos localizados. O conteúdo e a adequação ainda exigem conferência.'};
 }
 function latestSuccessful(snapshots){return snapshots.filter(s=>s.status!=='failed').slice().sort((a,b)=>Date.parse(b.capturedAt)-Date.parse(a.capturedAt))[0]||null}
 const api={read,compare,issues,suggest,latestSuccessful,isSei,number};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CopelReview=api;
})(typeof globalThis!=='undefined'?globalThis:this);
