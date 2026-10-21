# Central COPEL 0.6

Painel local de acompanhamento de processos do NRS Extremo Sul. Use com o Monitor SEI 0.4.

Leia GUIA-ATUALIZACAO.md para atualizar, configurar e executar o teste piloto. VALIDACAO.md informa o que foi conferido e os limites do teste.

## Desenvolvimento

- `npm run check`: verificação de sintaxe.
- `npm test`: testes de tempo, prazos e sugestões por documento/modalidade.
- `npm run build`: gera os arquivos de publicação na pasta dist.

Não exige instalação de pacotes para esses comandos. A publicação também pode usar os arquivos estáticos da raiz, mantendo assets e todos os scripts na mesma estrutura. O fluxo GitHub Actions existente foi preservado.

## Funcionamento

Os dados da Central continuam no navegador. A extensão tem memória própria, consulta em segundo plano e entrega resultados com confirmação de recebimento. Não há base compartilhada, execução com Chrome fechado ou integração direta ao aplicativo Windows SIMPAS. As sugestões do fluxo não alteram etapas automaticamente.
