# Central COPEL — versão 0.3

## Atualizar o site

1. Extraia o ZIP e envie seu conteúdo para a raiz do mesmo repositório GitHub, substituindo os arquivos anteriores. Preserve a pasta assets. Não envie somente o ZIP.
2. Aguarde o GitHub Pages concluir a publicação e atualize a página com Ctrl+F5.
3. No sistema, abra **Importar Trello** e selecione **COPEL-dados-Trello-2026-10-20.json**, entregue separadamente, ou o JSON original exportado do Trello.
4. Confira a prévia e clique em **Importar estes cartões**.
5. Abra **Processos**. As situações aparecem em abas separadas. O exemplo inicial é removido ao importar.
6. Faça um backup em Relatórios após conferir os dados.

**O JSON com dados dos processos deve ser carregado dentro do sistema, não enviado ao repositório público.** O pacote do site contém somente o aplicativo, a logo e dados ilustrativos de referência já existentes na versão anterior. Não contém a exportação do quadro nem os anexos originais.

## O que foi acrescentado

- Importação com prévia de listas, cartões, checklists, membros, etiquetas, vínculos de anexos e histórico disponível.
- Separação entre acompanhamento, finalização, cancelados, modelos e arquivados.
- Atualização por ID do cartão: reimportar não cria duplicatas. Cartões com o mesmo SEI permanecem distintos quando seus IDs diferem.
- Tempo na etapa calculado apenas quando há movimentação compatível com a lista atual ou alteração local registrada.
- Datas do Trello preservadas separadamente, sem inferir o significado. Classifique como disputa, assinatura, entrega ou outro marco.
- Aviso de finalização com checklist pendente e meta opcional de dias corridos por etapa.
- Ficha com membros do Trello separados do responsável único definido localmente.
- Histórico com data, autor e identificação dos comentários copiados.
- Links de anexos, sujeitos às permissões originais do Trello. Os arquivos não são incorporados.

## Reimportação e alterações locais

A exportação atualiza a etapa, os itens importados e o histórico dos cartões presentes. Mantém o responsável único local, prazo de acompanhamento, classificação da data, situação local explicitamente definida e tarefas adicionadas localmente. A meta na etapa é mantida somente se a etapa continuar a mesma. Marcas locais em itens importados serão substituídas pelas marcas do Trello; use backup antes de reimportar.

Cartões de uma importação anterior que não apareçam no novo arquivo são preservados com aviso para conferência. A atualização não envia nada de volta ao Trello.

## Dados preparados em 20/10/2026

A conversão local do seu JSON preservou 136 cartões, 120 checklists com 2.108 itens, 7 membros e 462 registros de anexos. Foram classificados 21 em acompanhamento, 27 em finalização, 9 cancelados, 5 modelos e 74 arquivados. O último grupo inclui um cartão aberto que está em lista arquivada; no arquivo original, 73 cartões têm a marca individual de arquivamento.

O recorte possui 1.000 atividades de 19/08/2026 a 20/10/2026 e 133 movimentações entre listas. O histórico é tratado como parcial. Falta de evento não significa falta de movimentação no processo. Comentários de cópia não determinam entrada em uma etapa.

A conversão omite as descrições da área de modelos e linhas identificadas por termos como senha, password, token, secret ou e-mail COPEL. Isso é um filtro preventivo, não uma garantia de anonimização: o JSON continua contendo dados operacionais e deve ficar fora da hospedagem pública.

## Limites

Os dados permanecem no armazenamento deste navegador, não são compartilhados entre usuários e não sincronizam automaticamente com Trello, SEI ou SIMPAS. Alertas são avisos dentro do painel, sem e-mail ou notificações em segundo plano. O tempo na etapa não comprova paralisação no SEI. As metas são operacionais, definidas por você, e não prazos legais automáticos.

O prazo de acompanhamento é cadastrado em Editar processo. O tipo da data original é definido em Regras de acompanhamento; classificar uma data não a transforma automaticamente em prazo de cobrança.

## Abrir ou compilar

É possível abrir index.html diretamente. O build é opcional e não requer instalação de dependências. Com Node.js:

```
npm run check
npm run build
```

O build gera a pasta dist. Para GitHub Pages por branch e raiz, use os arquivos que já estão na raiz do ZIP. O endereço local e o publicado têm armazenamentos separados.

## Validação

Testes com o JSON real: contagem de cartões/checklists/anexos, entrada da água mineral, divergência do açúcar, reimportação sem duplicatas, manutenção de responsável/tarefa local, preservação da ausência de datas e renderização de oito rotas.

No Chrome: fluxo de prévia e confirmação, persistência após recarregar, filtros, ficha e gravação de meta/classificação de data, com base fictícia. A extensão bloqueou o carregamento automatizado do arquivo real; não foram alteradas permissões do navegador. O arquivo real foi validado pela rotina de conversão local.


## Novo na versão 0.3 — Revisões SEI

Atualize o conteúdo do repositório com este ZIP e aguarde o Pages publicar. Os registros anteriores são preservados no mesmo navegador/endereço. Faça um backup antes da atualização.

### Piloto com o açúcar

1. Abra **Revisões SEI** e escolha o cartão atual de açúcar, conferindo o número SEI e a situação (evite cópias arquivadas).
2. Selecione o arquivo separado **SEI-acucar-referencia-parcial-2026-10-20.json**.
3. Confira a prévia e clique em **Registrar esta consulta**.
4. O sistema mostrará a referência inicial parcial, os 17 documentos inventariados na Pasta II, a indicação de assinatura observada em três documentos e a divergência de referência no despacho.
5. Nenhum documento dessa primeira consulta é anunciado como novo. A última tramitação não foi verificada.

O arquivo é uma transcrição assistida da consulta realizada na sessão autorizada, não uma coleta automática completa. Seu horário é o de preparação do registro. Guarde-o fora do repositório público.

### Novas consultas

O **Coletor assistido SEI** é entregue em outro ZIP. Depois de instalado manualmente, atua somente quando você clica nele na aba autenticada do SEI. Leia o guia da extensão, abra todas as pastas do processo e gere o JSON. Na Central, importe o resultado na ficha de revisão do mesmo processo.

O painel compara números identificadores e metadados (título, unidade, indicação de assinatura e referências ao processo observadas no documento aberto). Não compara o conteúdo integral dos PDFs nem detecta toda mudança textual. “Primeira vez observado” não afirma a data de chegada à unidade. “Não visível agora” não significa exclusão.

A referência é a última consulta anterior com dados, ignorando falhas. Falhas são mantidas no histórico e não geram mensagem de “sem novidades”. Arquivos de outro processo, documentos duplicados e consultas com a mesma data/hora são recusados. Consultas antigas podem ser registradas no histórico sem substituir a consulta mais recente da tela.

### Checklist com evidência

Há sugestões iniciais para DFD, TR, autorização, DED/DOD, AFM, instrumento contratual, LID, recebimento, atesto com fotografia e conjunto financeiro com despacho. São correspondências de tipos documentais, não análises jurídicas. Regras não cobertas permitem conferência e vínculo manual.

Cada decisão exige justificativa e confirmação. Para concluir com evidência, selecione o documento principal e confira todas as obrigações do item. A decisão e sua data ficam registradas localmente. Um item pode ficar pendente, com documento localizado, concluído com evidência ou não aplicável com justificativa. Divergências de processo nas evidências bloqueiam a conclusão pelo formulário; isso não impede a análise humana do contexto ou a correção na origem.

A Central não altera o SEI nem o Trello. Reimportar o Trello preserva consultas e decisões locais, mantendo a origem de cada evidência. O backup JSON inclui as consultas e as decisões.

### O que ainda não existe

Não há revisão em segundo plano, banco compartilhado, agendamento autônomo, notificações externas, captura de todo o histórico de tramitação ou login automático. Sessões expiradas devem ser renovadas pelo usuário. O coletor precisa de teste piloto após sua instalação manual; não foi executado no SEI real.

### Validação desta versão

Foram testados localmente: primeira referência, diferenças de documentos, indicação de assinatura, desaparecimento do recorte, falha de consulta, divergência de número, rejeição de entradas inválidas, sugestões de checklist, prevenção de consulta duplicada, vínculo por processo, nove rotas, preservação após reimportar Trello e leitura do coletor em uma árvore fictícia, sem cookies ou rede. O registro parcial do açúcar foi validado pelo leitor do módulo.

A abertura da prévia local no Chrome não foi autorizada nesta etapa. A conferência visual da versão 0.3 permanece pendente. Nenhuma proteção ou permissão do navegador foi alterada para contornar esse bloqueio.
