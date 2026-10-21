(function(root){'use strict';
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
function infer(modality,docs){
 const dispensa=/DISPENSA/.test(norm(modality));
 const rules=[
  {re:/MEMORANDO|FORMALIZACAO.*DEMANDA|\bDFD\b|TERMO DE REFERENCIA/,label:'Documentos de preparação',next:'Conferir memorando, autorização, DFD, pesquisa de preços e Termo de Referência.'},
  {re:/RELATORIO.*\bRM\b|REQUISICAO DE MATERIAL/,label:'Requisição de material documentada',next:'Conferir DED, DOD e o cadastro da dotação no SIMPAS. A RM sozinha não confirma delegação ou liberação.'},
  {re:/\bDED\b|\bDOD\b|DECLARACAO.*ORDENADOR|DEMONSTRATIVO.*DESPESA/,label:'Documentos orçamentários localizados',next:'Conferir a adequação dos documentos orçamentários e confirmar se a dotação foi cadastrada no SIMPAS.'},
  ...(dispensa?[{re:/\bSRD\b|DELEGACAO/,label:'Evidência de liberação da requisição',next:'Confirmar delegação, emissão, assinatura, envio/classificação da requisição e geração da SRD antes de acompanhar a disputa.'},{re:/\bLID\b|EXTRATO.*FORNECEDOR|RESULTADO.*DISPENSA/,label:'Evidência da seleção do fornecedor',next:'Conferir resultado, extrato do fornecedor, LID e publicação, conforme o fluxo interno de dispensa.'}]:[]),
  {re:/\bAFM\b|\bAPS\b|AUTORIZACAO.*FORNECIMENTO/,label:'Instrumento de fornecimento localizado',next:'Conferir assinaturas necessárias, liberação à empresa e eventual análise de prospecto. A presença da AFM/APS não confirma todas as assinaturas.'},
  {re:/ATESTADO.*RECEBIMENTO|NOTA FISCAL/,label:'Documento de recebimento ou faturamento localizado',next:'Conferir entrega, nota fiscal, ateste e registros de diligenciamento e no SIMPAS. A nota fiscal, sozinha, não confirma o recebimento.'}
 ];
 let found=null;for(const r of rules){const documents=docs.filter(d=>r.re.test(norm(d.title)));if(documents.length)found={...r,documents}}
 return {...(found||{label:'Sem evidência suficiente para sugerir uma etapa',next:'Confirme a modalidade e registre ou atualize a consulta do processo.',documents:[]}),note:dispensa?'O roteiro de dispensa usa o manual interno como referência operacional.':'O roteiro detalhado de dispensa não é aplicado a esta modalidade; as conferências acima são gerais.'};
}
const api={infer};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CopelWorkflow=api;
})(globalThis);
