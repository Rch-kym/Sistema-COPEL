# Central COPEL compartilhada — 0.8.0

Aplicação para GitHub Pages com Supabase. O sistema anterior permanece na raiz do repositório; esta aplicação está em `compartilhada/`.

## Já aplicado ao projeto Supabase

Projeto `phfhfshzfuzxescndlyv`: tabelas COPEL, RLS, validação de lançamentos, auditoria e rotina diária de prazos às 08h de Brasília (11h UTC). O administrador reservado é `akymrocha@gmail.com`. A conta só é vinculada depois da confirmação do e-mail no Supabase Auth. Nenhuma conta real foi criada e nenhuma senha foi definida pelo desenvolvimento.

A chave em `src/config.ts` é publicável. A proteção dos dados é aplicada no banco. Não adicionar chaves secretas, `service_role`, senha de banco ou chave da Casa dos Dados ao frontend.

## Executar e conferir

```sh
cd compartilhada
npm ci --ignore-scripts
npm run check
npm test
npm run build
npm run dev
```

`?demo=1` abre dados fictícios para conferir a interface. A demonstração não permite gravar dados. O site normal exige login; somente o administrador pode alterar registros e liberar e-mails de leitores.

## Publicação pendente no GitHub

1. Enviar estas alterações ao repositório `Rch-kym/Sistema-COPEL`.
2. Em Settings > Pages, selecionar **GitHub Actions** como origem. O workflow `Central COPEL compartilhada` compila e publica `compartilhada/dist`.
3. No Supabase > Authentication > URL Configuration, configurar Site URL e Redirect URLs com a URL real do GitHub Pages, incluindo o caminho `/Sistema-COPEL/`. Essas configurações do Auth não foram alteradas por esta migração. A aplicação solicita retorno para a URL em que foi aberta, mas o Supabase exige que ela esteja autorizada.
4. Abrir o site publicado, selecionar **Primeiro acesso? Criar conta**, cadastrar `akymrocha@gmail.com` com uma senha própria e confirmar o e-mail. A reserva no banco vincula automaticamente essa conta como administradora.
5. Importar um backup JSON do sistema anterior em Configurações. Um backup `copel-cloud-v1` só pode ser restaurado com a base vazia, com validação em uma única transação. A importação antiga preserva processos existentes e pode ser repetida após falha de conexão.

A atualização ainda não está publicada no repositório remoto. Não mudar o domínio do site anterior até conferir a nova versão e importar os dados necessários. O piloto anterior e sua rotina permanecem disponíveis durante essa transição; pausar sua rotina após concluir a migração, para evitar manter duas bases ativas.

## O que está conectado

- Banco central, autenticação e acesso por administrador/leitor.
- Processos, fornecedores, AFMs, recebimentos parciais e pagamentos.
- Limite de valores recebido/pago por AFM aplicado também no banco.
- Registro de assinatura do fornecedor separado de assinaturas observadas no SEI.
- Prazo por dias corridos/úteis e feriados, avisos sem duplicação e verificação diária pelo pg_cron.
- Filtro de novidades por data efetiva; prazos vencidos permanecem visíveis.
- Importação de JSON da versão anterior e de consultas do SEI; exportação dos registros da nova base.

## Ainda pendente

Envio de e-mails de alerta (provedor e remetente), consulta automática ao SEI e API da Casa dos Dados. A interface identifica essas conexões como pendentes. A rotina do Supabase verifica os dados já cadastrados; não busca documentos no SEI. A importação de atestado sugere conferência; só o administrador confirma recebimento.

Os arquivos SQL em `sql/` documentam o que foi aplicado. Não reaplicá-los em um projeto já configurado. `sql/test-permissions.sql` testa com usuários fictícios em transação e termina com rollback. A auditoria técnica fica no esquema privado e não é incluída na exportação comum da interface. Preferências e avisos do backup não substituem as regras e permissões da nova base.
