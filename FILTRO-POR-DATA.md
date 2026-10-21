# Acompanhamento por data — Central 0.6.2 / Extensão 0.4.2

1. Exporte um backup JSON na Central atual.
2. Atualize os arquivos da Central no mesmo endereço e recarregue com Ctrl+F5.
3. Atualize a extensão na mesma pasta e clique em Recarregar em chrome://extensions. Evite deixar duas versões ativas.
4. No cartão Monitoramento do SEI, escolha “Acompanhar novidades a partir de” e clique em Aplicar.
5. Aguarde a mensagem “Aplicado a todos os processos”. A extensão também mostra a data aplicada.

A primeira configuração usa o dia atual no fuso de Brasília. A data é salva e não avança sozinha. O período inclui o dia escolhido inteiro.

Somente documentos novos e assinaturas geram avisos. Para documentos, vale a data de inclusão no SEI; para assinaturas, a data da assinatura. Um documento de agosto assinado hoje pode gerar aviso, mesmo com o filtro começando hoje. O horário de detecção não substitui a data do evento.

O filtro vale para os avisos existentes, o contador, os destaques NOVO/ASSINADO e as notificações de desktop. Itens anteriores ou sem data identificada ficam fora dos avisos, mas continuam disponíveis nas consultas e no histórico. Alterar a data não apaga os dados nem marca as novidades como lidas. Avisos que já foram marcados como vistos continuam vistos.

A alteração retroativa pode mostrar avisos preservados no histórico disponível. Ela não recupera dados que já foram descartados pelos limites de retenção nem transforma a primeira leitura de referência em alerta.

Sem novidades elegíveis, a consulta segue para o próximo processo sem criar um aviso para conferir. A extensão ainda precisa consultar o SEI para identificar datas e possíveis assinaturas em documentos antigos; o filtro não impede a leitura da árvore e do histórico.

Para que o filtro também controle os alertas de desktop, atualize os dois componentes e abra a Central ao menos uma vez para sincronizar a data. Com a Central fechada, a extensão continua usando a última data recebida. O monitor exige Chrome em execução, computador ligado e uma aba do SEI autenticada.

## Verificação

Testes de comparação, persistência do monitor, filtro por data, fuso de Brasília, assinaturas recentes em documentos antigos, datas desconhecidas, mudança retroativa e entradas inválidas passaram. A interface foi conferida em Chromium no desktop e celular com comunicação simulada da extensão. O funcionamento na sessão real do SEI e as notificações do Windows ainda precisam ser validados no ambiente de vocês.
