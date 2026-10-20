# Central COPEL — NRS Extremo Sul

Primeira versão do protótipo, com a logo aprovada. HTML, CSS e JavaScript, sem dependências obrigatórias.

## Abrir no computador

Extraia o ZIP inteiro e abra `index.html` no navegador. Mantenha a pasta `assets` ao lado dos outros arquivos. A navegação local funciona sem internet; a tipografia usa a fonte disponível no computador quando o Google Fonts não estiver acessível.

## Colocar no GitHub Pages

1. Crie um repositório no GitHub.
2. Envie **o conteúdo extraído do ZIP**, preservando as pastas. O arquivo `index.html` deve ficar na raiz do repositório, e não dentro de uma pasta adicional. Não envie somente o ZIP.
3. Abra **Settings → Pages**.
4. Em **Source**, escolha **Deploy from a branch**.
5. Selecione a branch **main** (ou a branch em que enviou os arquivos), a pasta **/(root)** e clique em **Save**.
6. Aguarde o processamento e abra o endereço mostrado pelo GitHub Pages.

Não é necessário compilar para esse modo de publicação. Consulte: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

O GitHub Pages normalmente disponibiliza o site na internet. Este protótipo não tem login próprio. O pacote contém referências históricas transcritas dos relatórios enviados; não contém os PDFs originais. Revise os dados antes de publicar. Os cadastros feitos pelo visitante ficam no navegador dele e não são enviados ao repositório.

## Compilação opcional

Se preferir um fluxo de build, com Node.js instalado:

```text
npm run check
npm run build
```

O build copia os arquivos necessários para `dist/`, sem instalar pacotes. Para publicar diretamente da raiz pelo Pages, use os arquivos já incluídos na raiz; a pasta `dist/` é destinada a outras hospedagens ou a um futuro fluxo por Actions.

## Funcionalidades

- Painel com contagem de processos, tarefas, prazos vencidos e conclusões.
- Cadastro e edição de objeto, SEI, modalidade, responsável, prazo, etapa, prioridade e observações.
- Lista com busca e filtro por etapa; visualização Kanban.
- Ficha de processo com tarefas marcáveis e inclusão de novas providências.
- Registro e classificação dos nomes de PDFs vinculados aos processos.
- Comparativo histórico de preços do açúcar e referências de atas.
- Exportação CSV, impressão do painel e backup/restauração JSON.
- Layout adaptado para telas menores.

## Limites desta versão

Os registros usam o armazenamento local do navegador. Não são compartilhados com outros usuários nem sincronizados entre dispositivos. Use o backup para preservá-los. O endereço local e o endereço publicado terão bases separadas.

Os PDFs selecionados têm somente nome, tipo e tamanho registrados; o conteúdo não é enviado, guardado ou extraído. Os cinco relatórios iniciais foram lidos previamente e seus dados foram transcritos no protótipo, com referência em 17/08/2026. O processo de açúcar é um exemplo; etapa e tarefas são sugestões. SEI, modalidade, responsável e prazo não foram inventados.

Ainda não há integração com SIMPAS/SEI, autenticação, banco de dados compartilhado, histórico de alterações ou alertas automáticos. Esta versão serve para validar o fluxo e a apresentação antes dessas integrações.

## Arquivos

`index.html`: estrutura e formulários. `style.css`: identidade visual e responsividade. `app.js`: navegação, dados e ações. `assets/copel.png`: logo aprovada. `scripts/build.mjs`: build opcional.

Validação realizada: sintaxe JavaScript e verificação de renderização das rotas por execução isolada. A conferência visual no navegador ficou pendente devido ao bloqueio da conexão local no ambiente de desenvolvimento.
