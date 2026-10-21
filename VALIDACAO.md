# Validação da entrega

## Verificado automaticamente

- Sintaxe JavaScript da Central e da extensão; geração da pasta dist.
- Testes de tempo e prazos que já acompanhavam a Central.
- Orquestração real do monitor com interface do SEI simulada: consultas sem aba da Central, fila persistente, retomada do service worker, comparação de documentos, novidades, assinaturas, consultas parciais, falhas, expiração de sessão, confirmação idempotente, preservação do agendamento e bloqueio entre instalações.
- Regras indicativas por documento: RM sugere conferência orçamentária; SRD no roteiro de dispensa não é aplicada ao pregão.

## Interface conferida

A Central foi aberta em Chromium com dados de teste e comunicação com a extensão simulada. Foram verificados desktop e celular, oito rotas, estados de agendamento e sessão expirada, faixa de novidades, etiqueta NOVO, sugestões de conferência, marcação de leitura e janela da extensão. As capturas foram inspecionadas visualmente; os testes não registraram erros JavaScript ou transbordamento horizontal da página. Tabelas largas têm rolagem própria.

## Requer teste no ambiente de vocês

A navegação real do SEI Bahia, a sessão autenticada e os avisos do Windows não foram testados nesta entrega. Mudanças na interface do SEI, permissões de acesso e políticas do computador podem interferir. Siga o teste piloto do guia antes de depender do monitor no acompanhamento diário.
