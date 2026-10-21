const assert=require('node:assert/strict'),W=require('../workflow-core.js');
const doc=title=>({number:'00152332285',title});
assert.match(W.infer('Pregão eletrônico',[doc('Relatório RM')]).next,/DED/);
assert.equal(W.infer('Pregão eletrônico',[doc('SRD')]).documents.length,0);
assert.equal(W.infer('Registro de preços',[doc('SRD')]).documents.length,0);
assert.equal(W.infer('Dispensa eletrônica',[doc('SRD')]).label,'Evidência de liberação da requisição');
assert.match(W.infer('Pregão eletrônico',[doc('AFM')]).next,/assinaturas/);
assert.match(W.infer('A definir',[]).label,/Sem evidência/);
console.log('workflow-core: roteiros, RM e assinaturas passaram.');
