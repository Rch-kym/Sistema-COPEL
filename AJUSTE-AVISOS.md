# Atualização: avisos essenciais

Central 0.6.1 e Conector 0.4.1.

1. Exporte um backup da Central antes de atualizar.
2. Substitua os arquivos do site pelos arquivos da pasta Central e atualize com Ctrl+F5. Use o mesmo endereço e perfil do Chrome.
3. Extraia a pasta Conector. Em chrome://extensions, recarregue a extensão existente apontando para a mesma pasta atualizada. Não remova a extensão nem limpe o armazenamento.
4. Abra a Central para sincronizar e execute Consultar agora.

Somente documentos novos e assinaturas entram nos avisos. Alterações de bloco, tramitações e metadados deixam a contagem, preservando o histórico e as consultas anteriores. Os avisos são agrupados por processo.

A primeira consulta cria a referência, sem alertar sobre documentos antigos. Consultas parciais não apagam documentos já observados. Assinaturas são identificadas pela mudança da indicação visível ou por registro explícito de assinatura de documento no histórico. Uma segunda assinatura depende desse registro explícito no histórico. Alterações em blocos não contam como assinatura.

Quando disponível no histórico, mostramos a data/hora da inclusão ou assinatura no SEI. Se indisponível, informamos isso e mostramos separadamente quando a novidade foi detectada. Não inferimos a data de inclusão pela data da consulta.

O Chrome deve continuar em execução e o SEI autenticado para as consultas periódicas. Os testes de lógica e de interface usaram dados simulados. É necessário validar a coleta no SEI real, incluindo a inclusão de documento e sua assinatura após uma leitura de referência.
