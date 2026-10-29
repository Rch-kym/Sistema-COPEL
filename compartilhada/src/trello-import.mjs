const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase();
export const cleanTrelloText=s=>String(s||'').split(/\r?\n/).filter(l=>!/(senha|password|token|secret|credencia|e-mail copel|chave de acesso)/i.test(l)).join('\n');
const numbers=s=>[...new Set(String(s||'').match(/\d{3}\.\d{4,5}\.\d{4}\.\d{7}-\d{2}/g)||[])];
const date=s=>Number.isFinite(Date.parse(s))?Date.parse(s):0;
export function convertTrello(board){
 if(!board||!Array.isArray(board.cards)||!Array.isArray(board.lists)||!Array.isArray(board.checklists))throw Error('Selecione uma exportação JSON de quadro do Trello.');
 if(board.cards.length>10000)throw Error('Quadro acima do limite de importação.');
 const lists=new Map(board.lists.map(l=>[l.id,l])),checks=new Map(board.checklists.map(c=>[c.id,c])),members=new Map((board.members||[]).map(m=>[m.id,m.fullName||m.username||'']));
 const grouped=new Map(),pending=[];let models=0,validCards=0;
 for(const c of board.cards){const list=lists.get(c.idList);if(c.isTemplate||norm(list?.name).includes('MODELO')){models++;continue}const ns=numbers(c.name);if(ns.length!==1){pending.push({cardId:c.id,title:cleanTrelloText(c.name),reason:ns.length?'Mais de um SEI no título':'Número SEI ausente ou inválido no título'});continue}if(!grouped.has(ns[0]))grouped.set(ns[0],[]);grouped.get(ns[0]).push(c);validCards++}
 const processes=[];
 for(const [sei,cards]of grouped){
  cards.sort((a,b)=>Number(!!(a.closed||lists.get(a.idList)?.closed))-Number(!!(b.closed||lists.get(b.idList)?.closed))||date(b.dateLastActivity)-date(a.dateLastActivity)||String(a.id).localeCompare(String(b.id)));
  const c=cards[0],list=lists.get(c.idList),stage=cleanTrelloText(list?.name||'A conferir'),tasks=[],seen=new Set();
  for(const card of cards)for(const id of card.idChecklists||[]){const checklist=checks.get(id);for(const item of [...(checklist?.checkItems||[])].sort((a,b)=>(a.pos||0)-(b.pos||0))){const text=cleanTrelloText(item.name).trim();if(!text||seen.has(norm(text)))continue;seen.add(norm(text));tasks.push({id:item.id,text,done:item.state==='complete',group:cleanTrelloText(checklist.name||'Checklist'),source:'trello'})}}
  const title=cleanTrelloText(c.name),name=title.replace(sei,'').replace(/\(\s*\)/g,'').trim()||title;
  const sources=cards.map(x=>({cardId:x.id,title:cleanTrelloText(x.name),stage:cleanTrelloText(lists.get(x.idList)?.name||''),archived:!!(x.closed||lists.get(x.idList)?.closed),url:/^https:\/\/trello\.com\/[cb]\//.test(x.shortUrl||x.url||'')?(x.shortUrl||x.url):''}));
  processes.push({name:name.slice(0,200),sei,stage:stage.slice(0,100),modality:'A definir',owner:(c.idMembers||[]).map(id=>members.get(id)||'').filter(Boolean).join(', ').slice(0,120),notes:cleanTrelloText(c.desc).slice(0,3000),estimatedCents:0,status:norm(stage).includes('CANCELAD')?'cancelled':c.closed||list?.closed||norm(stage).includes('FINALIZA')?'closed':'active',legacy:{tasks,trello:{boardId:board.id,sources,labels:(c.labels||[]).map(l=>cleanTrelloText(l.name)).filter(Boolean),source:'Exportação JSON do Trello',financialConfirmation:false}}});
 }
 return {processes,seiReviews:{},trelloSummary:{cards:board.cards.length,validCards,processes:processes.length,duplicates:validCards-processes.length,models,pending}};
}
