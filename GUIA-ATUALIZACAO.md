# Central COPEL 0.6 + Monitor SEI 0.4

## O que muda para você

O monitor consulta os processos no intervalo escolhido, guarda resultados mesmo com a Central fechada e pode mostrar notificações na área de trabalho. Quando você volta à Central, as consultas são sincronizadas automaticamente. O painel informa última conclusão, próxima tentativa, consultas parciais e falhas. Documentos ainda não lidos recebem a etiqueta NOVO.

A seção “Onde o processo está caminhando”, na revisão de cada processo, relaciona títulos documentais às próximas conferências. A etapa cadastrada continua sendo uma decisão de vocês. O roteiro detalhado de dispensa usa o manual interno; ele não é aplicado ao pregão ou ao registro de preços.

## Atualizar sem perder a base

1. Na Central atual, exporte um backup JSON e guarde-o.
2. Publique o conteúdo de Central-COPEL-v0.6-GitHub.zip no mesmo repositório/endereço já utilizado. Mantenha os arquivos e a estrutura da publicação. Não mude o endereço, o perfil do Chrome ou limpe os dados do site: os registros continuam locais.
3. Extraia COPEL-Conector-SEI-v0.4.zip. De preferência, substitua os arquivos na mesma pasta da extensão 0.3.
4. Em chrome://extensions, recarregue a extensão existente. Usar a mesma extensão e pasta preserva suas configurações. Autorize a nova permissão de notificações, se o Chrome solicitar. Evite deixar duas versões ativas.
5. Atualize a Central com Ctrl+F5. O rodapé deve indicar versão 0.6. Recarregar a página também restabelece a comunicação com a extensão.
6. Entre no SEI Bahia e mantenha uma aba autenticada aberta.
7. Abra o ícone da extensão COPEL. Marque “Habilitar consultas” e “Monitorar em segundo plano”. Escolha um intervalo, por exemplo, 15 minutos, e salve.
8. Abra a Central ao menos uma vez para sincronizar a seleção de processos. Clique em “Consultar agora” e aguarde a conclusão.

A extensão atende aos endereços já autorizados em rch-kym.github.io/Sistema-COPEL/ e rch-kym.github.io/Painel-Cordeiro/. O monitor fica vinculado à primeira instalação sincronizada. Ele não mistura resultados entre os dois endereços. Nesta versão não há troca de instalação pela interface: use o endereço vinculado. Se precisar migrar de endereço, preserve o backup e os resultados antes de planejar a migração.

## Teste piloto recomendado

1. Conclua uma consulta de referência de um processo de teste.
2. Feche apenas a aba da Central. Mantenha o Chrome e o SEI abertos.
3. Inclua um documento de teste apropriado no SEI.
4. Aguarde o intervalo e o tempo necessário para terminar a consulta daquele processo. A extensão pode abrir uma aba de consulta em segundo plano, sem mudar o foco.
5. Confira a notificação, se habilitada, e o contador no ícone da extensão.
6. Reabra a Central: confira o aviso em Atualizações e a etiqueta NOVO na tabela da revisão do processo.
7. Consulte de novo sem alterar nada: o mesmo documento não deve gerar outro aviso.
8. Marque as novidades como vistas: o destaque desaparece, mas a referência fica preservada.
9. Faça logout no SEI e consulte: o monitor deve pedir uma nova entrada, preservando os dados anteriores. Após entrar, clique em Consultar agora ou aguarde a próxima tentativa.

## Como interpretar a tela

- **Agendado:** existe uma próxima tentativa; isso não comprova que a sessão do SEI está válida.
- **Consultando:** mostra quantos processos já tiveram a consulta salva no ciclo atual.
- **Precisa de atenção:** sessão inválida ou dificuldade para salvar/executar. Leia a orientação exibida.
- **Completa:** a árvore de documentos foi informada como completa pela interface consultada. Não significa leitura integral dos PDFs.
- **Parcial:** a coleta não confirmou cobertura completa. Não significa documento ausente.
- **Novo documento identificado:** ainda não constava na memória de consultas. O horário do aviso é o da detecção, não necessariamente o da inclusão no SEI.
- **Dados do documento atualizados:** mudança de título, unidade ou nova indicação visível de assinatura. Não garante detectar edição de texto dentro do documento.

## Limites desta entrega

- Chrome em execução, computador ligado e sessão válida são necessários. Não funciona com o Chrome encerrado ou o computador suspenso.
- Os intervalos são aproximados; o Chrome pode adiar alarmes. Cada ciclo consulta em sequência, sem iniciar um segundo ciclo simultâneo.
- Não existe acesso por servidor, compartilhamento automático com outro computador, leitura integral de PDFs ou conexão direta ao programa SIMPAS.
- Alertas de desktop dependem também das permissões e configurações de notificação do Chrome e do Windows.
- A memória da extensão fica neste perfil do Chrome. Ela continua funcionando sem a Central aberta, mas precisa de uma aba autenticada do SEI como ponto de partida.
- Consultas aguardam confirmação da Central antes de sair da fila local. Com 1.000 consultas pendentes, o monitor para e pede para abrir a Central. O histórico de alertas na extensão mantém até 500 eventos; na Central, até 2.000 eventos. Abra a Central regularmente para preservar as novidades.
- Remover um processo da seleção vale para o próximo ciclo. Para parar o ciclo atual, use “Interromper este ciclo”; para parar os próximos, desative o monitoramento no ícone da extensão.
- O monitor consulta a interface. Não assina documentos, não tramita processos e não conclui checklists.

## Dados e backup

Os cadastros anteriores usam a mesma chave local da Central. As consultas recentes, linhas de tempo e os recursos de tempo e prazos foram preservados. Avisos não lidos existentes são migrados. Resultados de processos removidos da base ficam em monitorArchive no backup, em vez de serem descartados silenciosamente.

Esta entrega não inclui o manual completo, suas credenciais ou dados de sessões do SEI. A extensão usa a sessão do próprio navegador.
