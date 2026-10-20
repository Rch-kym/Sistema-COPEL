# Central COPEL — versão 0.4

## Atualizar o site

1. Antes de atualizar, exporte um backup em Relatórios na Central atual.
2. Extraia Central-COPEL-v0.4-GitHub.zip e envie o conteúdo extraído para a raiz do mesmo repositório GitHub. Substitua os arquivos antigos e preserve a pasta assets. Não envie apenas o ZIP.
3. Aguarde a publicação do GitHub Pages e atualize o site com Ctrl+F5.
4. Os dados continuam no mesmo navegador e endereço. Não limpe os dados do navegador. Não precisa importar o Trello novamente se os processos já estão cadastrados.
5. Instale o conector v0.2 seguindo seu LEIA-ME. Os pacotes do site e do conector são separados.

Nunca envie o JSON privado do Trello, backups ou consultas dos processos ao repositório público. Este pacote não inclui a exportação real do quadro.

## Revisão na abertura

Com o conector habilitado, uma aba autenticada do SEI aberta e a opção “Revisar os processos ao abrir” marcada, abrir a Central inicia a fila de consultas. O intervalo mínimo padrão é de 15 minutos entre lotes concluídos. “Atualizar agora” permite antecipar uma revisão. O intervalo não agenda consultas com o site fechado.

A tela inicial mostra progresso, novidades ainda não marcadas como vistas, prazos de acompanhamento, metas locais, pendências de checklist, divergências e falhas. Em Atualizações é possível escolher os processos monitorados. Por padrão entram os ativos e os finalizados com checklist pendente; modelos, arquivados e cancelados ficam fora.

O conector usa uma aba separada para pesquisar um processo por vez. A primeira consulta cria uma referência; não anuncia documentos antigos como novos. Nas próximas compara números dos documentos e metadados observados. O painel salva cada consulta antes de autorizar o próximo processo. Entregas repetidas não duplicam o resultado. Mantém até oito consultas por número SEI e os dados continuam locais neste navegador.

Se o login expirar, o lote para com aviso. Entre no SEI e clique em Continuar revisão. Se fechar a Central, a revisão pausa ao detectar a ausência da aba; reabra para continuar. Fechar o Chrome ou recarregar a extensão pode perder a fila temporária; uma nova abertura inicia outra consulta. Os resultados já salvos permanecem.

## Como interpretar

- Documento observado pela primeira vez: apareceu em uma consulta posterior à referência. Não comprova a data em que chegou à sua unidade.
- Prazo vencido / meta excedida: regras locais cadastradas; não são uma avaliação de prazo legal. O tempo de etapa depende do histórico disponível do Trello e de registros locais.
- Evidência localizada: documento candidato para um item de checklist. Requer conferir conteúdo e adequação. Nenhum item é concluído automaticamente.
- Consulta parcial: nem todos os dados puderam ser lidos. Não prova ausência de documentos.
- Falha: a consulta não foi concluída. Não significa que o processo ficou sem alterações.

A leitura usa a interface do SEI; não é integração oficial por API. Lê a árvore de documentos, indicação de assinatura, unidades disponíveis, referência do despacho exibido e histórico de andamento quando acessível. Não lê integralmente todos os PDFs, não assina, não tramita nem altera processos. Mudanças na interface podem exigir ajustes.

## Validação desta entrega

Passaram verificações de sintaxe, construção do pacote e testes simulados de fila única, bloqueio entre abas, confirmação de gravação, reentrega, falha de armazenamento, pausa sem login, comparação de documentos, preservação após importação Trello e renderização de dez telas. O campo e o botão da pesquisa rápida foram conferidos na sessão real do SEI. O lote completo da extensão ainda precisa de teste piloto após instalação; esta entrega não afirma funcionamento integral já validado em produção.

## GitHub / desenvolvimento

O site é estático e pode ser publicado diretamente na raiz, como nas versões anteriores. Também aceita `npm run check` e `npm run build`; a construção gera dist/. Não há dependências externas para instalar. A extensão exige Chrome e só se conecta aos caminhos Sistema-COPEL e Painel-Cordeiro em rch-kym.github.io. Para outro endereço, será necessário ajustar o manifesto e a lista de portais autorizados.
