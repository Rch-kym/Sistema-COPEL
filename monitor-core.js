(function(root){
 'use strict';
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const movementKey=m=>JSON.stringify([m.date,m.unit||'',m.description]);
 function evidence(m){
  const text=norm(m.description);
  // Ação sobre bloco não comprova assinatura de documento.
  if(/bloco|cancel|exclu|retir|disponibil|libera|solicita|aguard|pendente/.test(text))return null;
  const number=String(m.description||'').match(/\b\d{6,20}\b/)?.[0];
  if(!number)return null;
  if(/assinatura.*(?:realizada|registrada)|(?:documento|assinatura).*assinad|assinado.*documento/.test(text))return {kind:'signature',number};
  if(/(?:inclu|inser|gerad|anexa|recebid).*documento|documento.*(?:inclu|inser|gerad|anexa|recebid)/.test(text))return {kind:'document',number};
  return null;
 }
 function relevant(e){return !!e&&['document','signature'].includes(e.kind)&&/^\d{6,20}$/.test(e.number||'')}
 function dates(movements,number,kind){return (movements||[]).filter(m=>{const e=evidence(m);return e?.number===number&&e.kind===kind&&Number.isFinite(Date.parse(m.date))}).sort((a,b)=>Date.parse(a.date)-Date.parse(b.date))}
 function observe(previous,snapshot){
  if(snapshot.status==='failed')return {baseline:previous,events:[]};
  const baseline=previous?structuredClone(previous):{documents:{},movements:[]};
  const events=[],moves=snapshot.movements||[],known=new Set(baseline.movements||[]);
  const historyReady=previous&&(previous.historyReady===true||(previous.movements||[]).length>0);
  for(const d of snapshot.documents){
   const old=baseline.documents[d.number],inserted=dates(moves,d.number,'document')[0];
   if(previous&&!old)events.push({kind:'document',number:d.number,title:d.title,occurredAt:inserted?.date||null});
   const signatures=dates(moves,d.number,'signature');
   const fresh=historyReady?signatures.filter(m=>!known.has(movementKey(m))):[];
   if(old){
    if(fresh.length)for(const m of fresh)events.push({kind:'signature',number:d.number,title:d.title,occurredAt:m.date,detail:m.description,eventKey:movementKey(m)});
    else if(old.signatureStatus!=='observed'&&d.signatureStatus==='observed')events.push({kind:'signature',number:d.number,title:d.title,occurredAt:signatures.at(-1)?.date||null});
   }
   baseline.documents[d.number]={...old,title:d.title,unit:d.unit||'',insertedAt:old?.insertedAt||inserted?.date||null,signatureStatus:old?.signatureStatus==='observed'||signatures.length?'observed':d.signatureStatus};
  }
  for(const m of moves)known.add(movementKey(m));
  baseline.movements=[...known].slice(-10000);
  baseline.historyReady=!!historyReady||moves.length>0||snapshot.movementsComplete===true;
  return {baseline,events};
 }
 function localDay(value=new Date()){
  if(typeof value==='string'&&validSince(value))return value;
  const d=new Date(value);if(!Number.isFinite(d.getTime()))return null;
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);
  const get=type=>parts.find(p=>p.type===type).value;return get('year')+'-'+get('month')+'-'+get('day');
 }
 function validSince(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const d=new Date(value+'T12:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value}
 function eventDate(event,movements=[],baseline=null){
  if(event?.occurredAt&&Number.isFinite(Date.parse(event.occurredAt)))return event.occurredAt;
  if(!relevant(event))return null;
  const history=[...movements];for(const key of baseline?.movements||[])try{const [date,unit,description]=JSON.parse(key);history.push({date,unit,description})}catch{}
  const found=dates(history,event.number,event.kind);
  if(event.kind==='signature'&&event.eventKey){try{const [date]=JSON.parse(event.eventKey);if(Number.isFinite(Date.parse(date)))return date}catch{}}
  return (event.kind==='document'?found[0]?.date||baseline?.documents?.[event.number]?.insertedAt:found.at(-1)?.date)||null;
 }
 function inPeriod(event,since,movements=[],baseline=null){if(!relevant(event)||!validSince(since))return false;const occurredAt=eventDate(event,movements,baseline);return !!occurredAt&&localDay(occurredAt)>=since}
 const api={observe,evidence,relevant,dates,localDay,validSince,eventDate,inPeriod};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CopelMonitor=api;
})(globalThis);
