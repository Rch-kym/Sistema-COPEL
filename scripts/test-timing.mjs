import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const T=createRequire(import.meta.url)('../timing-core.js');
// dias úteis: 2026-10-16 (sex) -> 2026-10-21 (qua) = seg 19, ter 20, qua 21 = 3
assert.equal(T.businessDaysBetween('2026-10-16T12:00:00-03:00','2026-10-21T10:00:00-03:00'),3);
// feriado 12/10/2026 (seg): 09/10 (sex) -> 14/10 (qua) = ter 13 + qua 14 = 2
assert.equal(T.businessDaysBetween('2026-10-09T12:00:00-03:00','2026-10-14T12:00:00-03:00'),2);
// feriado extra informado
assert.equal(T.businessDaysBetween('2026-10-09T12:00:00-03:00','2026-10-14T12:00:00-03:00',['2026-10-13']),1);
// 2 de julho (Bahia) e Sexta Santa 2026 (03/04)
assert.ok(T.holidaysOf(2026).has('2026-07-02')&&T.holidaysOf(2026).has('2026-04-03')&&T.holidaysOf(2026).has('2026-02-16')&&T.holidaysOf(2026).has('2026-06-04'));
// virada de dia em Brasília: 23:30 BRT ainda é o mesmo dia civil
assert.equal(T.dayKey('2026-10-21T02:30:00Z'),'2026-10-20');
// classificação e números (processo não vira documento)
assert.equal(T.classify('Processo remetido pela unidade NRS-EXT.S/COPEL'),'sent');
assert.equal(T.classify('Processo recebido na unidade GECOMP'),'received');
assert.equal(T.classify('Gerado documento público 0012345 (Despacho 5)'),'doc_created');
assert.equal(T.classify('Assinado Documento 0012345 (Despacho 5)'),'doc_signed');
assert.deepEqual(T.docNumbers('Gerado documento público 0012345 no processo 001.01234.2026.0054321-09'),['0012345']);
const mv=[
 {date:'2026-09-01T09:00:00-03:00',unit:'NRS-EXT.S/COPEL',description:'Processo público gerado'},
 {date:'2026-09-02T10:00:00-03:00',unit:'NRS-EXT.S/COPEL',description:'Gerado documento público 0011111 (DFD)'},
 {date:'2026-09-03T10:00:00-03:00',unit:'NRS-EXT.S/COPEL',description:'Processo remetido pela unidade NRS-EXT.S/COPEL'},
 {date:'2026-09-08T10:00:00-03:00',unit:'SAEB/GECOMP',description:'Processo recebido na unidade SAEB/GECOMP'}];
const m=T.metrics([...mv,mv[0]],{now:'2026-10-21T10:00:00-03:00'}); // duplicata ignorada
assert.equal(m.movementCount,4);assert.equal(m.currentUnit,'SAEB/GECOMP');assert.equal(m.startReliable,true);assert.equal(m.concluded,false);
assert.equal(m.sinceLastBusiness,T.businessDaysBetween('2026-09-08T10:00:00-03:00','2026-10-21T10:00:00-03:00'));
assert.ok(m.sinceLastBusiness>=25);
assert.equal(T.stagnation(m,{}, 'x').level,'critical');
assert.equal(T.stagnation(m,{attentionDays:50,criticalDays:60},'x').level,'ok');
assert.equal(T.stagnation(m,{stageDays:{'Assinatura':{attentionDays:1,criticalDays:2}}},'ASSINATURA').thresholds.criticalDays,2);
// em trânsito
const t=T.metrics(mv.slice(0,3),{now:'2026-09-10T10:00:00-03:00'});assert.equal(t.inTransit,true);assert.equal(t.currentUnit,null);
// tempo por unidade: a espera após "remetido" é creditada a quem recebeu
const u=Object.fromEntries(m.unitTimes.map(x=>[x.unit,x.businessDays]));assert.ok(u['SAEB/GECOMP']>u['NRS-EXT.S/COPEL']);
// conclusão
const c=T.metrics([...mv,{date:'2026-09-20T10:00:00-03:00',unit:'SAEB/GECOMP',description:'Conclusão do processo na unidade'}],{now:'2026-10-21T10:00:00-03:00'});
assert.equal(c.concluded,true);assert.equal(T.stagnation(c,{},'x').level,'done');
// reabertura volta a contar
assert.equal(T.metrics([...mv,{date:'2026-09-20T10:00:00-03:00',unit:'A',description:'Conclusão do processo na unidade'},{date:'2026-09-22T10:00:00-03:00',unit:'A',description:'Processo reaberto na unidade'}],{now:'2026-10-21T10:00:00-03:00'}).concluded,false);
// datas de inclusão
assert.equal(T.docDates(mv).get('0011111').date,'2026-09-02T13:00:00.000Z');
// semear sem histórico
assert.equal(T.metrics([]),null);assert.equal(T.stagnation(null,{},'').level,'unknown');
// etapas do Trello
const sd=T.stageDurations([{date:'2026-09-01T12:00:00Z',text:'Movimentação: A → B'},{date:'2026-09-08T12:00:00Z',text:'Movimentação: B → C'},{date:'2026-09-09T12:00:00Z',type:'commentCard',text:'oi'}],'2026-09-15T12:00:00Z');
assert.equal(sd.length,2);assert.equal(sd[0].stage,'B');assert.equal(sd[0].businessDays,4);assert.equal(sd[1].open,true);
// desempenho
const p=T.performance([{stageDurations:sd,metrics:c}]);assert.equal(p.byStage[0].name,'B');assert.equal(p.concluded.n,1);
assert.equal(T.percentile([1,2,3,4,5,6,7,8,9,10],90),9);
// sanitização das configurações
assert.deepEqual(T.timingSettings({attentionDays:-3,criticalDays:'x'}),{attentionDays:5,criticalDays:10,stageDays:{},extraHolidays:[]});
assert.equal(T.timingSettings({attentionDays:8,criticalDays:3}).criticalDays,8);
// CSV: separador, aspas, BOM e fórmulas neutralizadas
const csv=T.toCsv([{label:'Processo',key:'a'},{label:'Obs',key:'b'}],[{a:'=HYPERLINK("x")',b:'a;b "c"'}]);
assert.ok(csv.startsWith('﻿Processo;Obs\r\n')&&csv.includes(`"'=HYPERLINK(""x"")";"a;b ""c"""`));
console.log('timing-core: todos os testes passaram');
