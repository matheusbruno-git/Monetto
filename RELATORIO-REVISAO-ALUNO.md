# Monetto — revisão visual da área do aluno

Entrega de 10 de novembro de 2026. As alterações foram feitas nos arquivos do projeto extraído de `App.zip`, exclusivamente na área do aluno.

Atualização: o menu lateral permanece oculto em todas as resoluções e aparece com animação somente ao clicar no ícone do canto superior esquerdo. O ícone também fecha o menu; Escape e clique fora continuam funcionando. Esta atualização altera somente `student-ui.css` na aplicação, preservando os scripts existentes.

## 1. Arquivos modificados

| Página | CSS reestruturado | HTML atualizado |
| --- | --- | --- |
| Dashboard | `App/frontend/student/dashboard-aluno/dashboard-aluno.css` | `App/frontend/student/dashboard-aluno/dashboard-aluno.html` |
| Tarefas | `App/frontend/student/tarefas-aluno/tarefas-aluno.css` | `App/frontend/student/tarefas-aluno/tarefas-aluno.html` |
| Aprendizado | `App/frontend/student/modulo-aprendizado/modulo-aprendizado.css` | `App/frontend/student/modulo-aprendizado/modulo-aprendizado.html` |
| Jogos e quiz | `App/frontend/student/jogos-quiz/jogos-quiz.css` | `App/frontend/student/jogos-quiz/jogos-quiz.html` |
| Recompensas | `App/frontend/student/recompensas/recompensas.css` | `App/frontend/student/recompensas/recompensas.html` |
| Configurações | `App/frontend/student/configuracoes/configuracoes.css` | `App/frontend/student/configuracoes/configuracoes.html` |

Novo arquivo: `App/frontend/student/student-ui.css`, que centraliza cores, temas, tipografia, espaçamentos, bordas, sombras, navegação e componentes comuns do aluno.

A entrega também contém este relatório, `validation/check-student.cjs`, `validation/results.json`, `validation/integrity.json` e 34 capturas em `validation/screenshots/`.

## 2. Problemas identificados

- Os seis CSS do aluno repetiam estilos de navegação, variáveis e blocos de sobrescritas abrangentes. Havia 1.038 ocorrências de `!important` nesses arquivos.
- `shared/redesign.css` era carregado depois do CSS local, com 418 ocorrências de `!important`. Isso impunha cores, dimensões, superfícies e estados genéricos aos componentes específicos.
- O layout misturava alturas de viewport, áreas internas de rolagem, dimensões rígidas e regras contraditórias de navegação. No dashboard havia uma coluna com altura inline de `74vh`.
- Cores e efeitos de transparência antigos prejudicavam a troca de tema. Medalhas e aulas bloqueadas recebiam opacidade inline que reduzia a legibilidade.
- O quiz gerava as classes `correct`, `wrong` e `disabled`, sem cobertura visual adequada no CSS anterior. O botão de fechar estava vazio.
- Campos informativos de escola e turma cortavam nomes longos. As seis opções de avatar tinham conteúdo e valores `data-avatar` vazios.
- Alguns controles eram `div` clicáveis, sem operação nativa pelo teclado; faltavam associações entre labels e campos.

O inventário completo inclui 11 CSS originais e 12 finais, com hashes e contagem de `!important`, em `validation/integrity.json`. `main-style.css` foi examinado, mas não era uma referência direta das seis páginas do aluno.

## 3. Correções por página

| Página | Resultado |
| --- | --- |
| Dashboard | Indicadores alinhados; tarefas e ranking com texto completo; coluna lateral no fluxo natural; progresso e sequência compatíveis com os elementos gerados pelo JavaScript. |
| Tarefas | Busca, matéria e filtros reorganizados; descrições sem espaços de indentação do template; ações em linha própria no celular; estados de conclusão e contagem legíveis. |
| Aprendizado | Coluna de leitura com medida confortável; painel do curso lateral no desktop e empilhado em telas menores; navegação flexível; aulas bloqueadas legíveis. |
| Jogos e quiz | Grades de três, duas e uma coluna; ranking flexível; feedback correto/incorreto visível; fechamento desenhado em CSS; modal com limite de altura e rolagem própria. |
| Recompensas | XP, medalhas, loja e histórico com grades fluidas; bloqueio indicado por aparência própria sem apagar descrições; botões indisponíveis continuam legíveis. |
| Configurações | Navegação adaptável; formulário de duas colunas que passa a uma; nomes de escola/turma com quebra; opções de avatar visíveis; switches e ações utilizáveis por teclado. |

## 4. Conflitos de CSS resolvidos

A ordem nas páginas do aluno passou de **fontes → CSS local → redesign** para **fontes → student-ui.css → CSS local**. Os caminhos dos seis CSS específicos foram preservados. A base do aluno não é carregada pelos demais perfis.

Os arquivos `shared/main-style.css` e `shared/redesign.css` foram preservados byte a byte. Assim, a revisão elimina a interferência deles sobre o aluno sem modificar a aparência dos outros perfis.

Os tokens de tema ficam em um único arquivo, incluindo aliases usados pelo HTML e pelos templates existentes. Os CSS específicos não redefinem o tema nem copiam o shell da aplicação. O conjunto do aluno caiu de 136.198 para 66.853 bytes, incluindo a nova base.

Restaram 17 usos de `!important` no conjunto do aluno: exceções limitadas a estilos inline existentes que precisam respeitar tema/legibilidade e à preferência de movimento reduzido. Essas exceções estão comentadas junto aos seletores.

## 5. Responsividade e temas

Foram verificadas as larguras **1920, 1440, 1366, 1024, 768, 480 e 375 pixels**, nos temas claro e escuro.

- Sidebar escura em gaveta, oculta por padrão em todas as resoluções. O ícone do canto superior esquerdo fica sempre visível e aciona a animação de abertura e fechamento, com fundo de sobreposição. Escape e clique externo também fecham o menu.
- Conteúdo com rolagem natural, largura disponível integral e espaço reservado para o cabeçalho, sem coluna vazia quando o menu está fechado.
- Uso de `minmax(0, 1fr)`, `auto-fit`, `clamp()`, flex com quebra e dimensões mínimas para impedir compressão dos componentes.
- Cabeçalhos, filtros, ações e badges quebram de linha quando necessário.
- Modais respeitam a altura útil da tela, inclusive com conteúdo de pergunta e feedback extensos.
- Textos principais, auxiliares, campos, opções de seleção e estados usam cores vinculadas ao tema.

Nenhum dos 84 cenários de página apresentou rolagem horizontal ou elementos visíveis fora dos limites da janela na medição final.

## 6. Alterações necessárias no HTML

- Referência à nova base visual, antes de cada CSS específico; retirada da referência a `redesign.css` somente nas seis páginas do aluno.
- Remoção da altura de `74vh` do dashboard e de cor inline desnecessária do subtítulo.
- Controles de notificação, filtros de tarefas, navegação de configurações, avatares e preferências convertidos para botões nativos, mantendo classes, dados e eventos.
- Labels associados aos IDs dos campos; nomes acessíveis em busca, filtro, notificações e fechamento do quiz.
- Semântica de diálogo adicionada ao modal do quiz.
- Escola e turma passaram de inputs desabilitados a textareas desabilitados com os mesmos IDs. O preenchimento por `.value` permanece compatível; o tamanho acompanha o conteúdo no Chromium, com linhas de fallback.
- Seis avatares visíveis e com valores distintos, para que os handlers existentes possam selecionar e salvar a opção escolhida.

Nenhum script foi alterado, inclusive os scripts inline dos HTML.

## 7. Testes realizados e evidências

Validação executada em Chromium/Chrome 157 com API simulada no contexto de teste. Os arquivos da aplicação não contêm mocks. Não houve conexão ou gravação no banco.

| Verificação | Resultado final |
| --- | --- |
| Seis páginas × sete larguras × dois temas | **84/84 aprovados** |
| Interações de interface | **104/104 aprovadas** |
| Pares centrais de cores, contraste mínimo 4,5:1 | **20/20 aprovados** |
| Auditoria automática de textos renderizados nas páginas testadas | **Nenhuma falha detectada** |
| Erros JavaScript de execução ou recursos locais com erro HTTP | **0** |
| Inspeção visual | **24 capturas de páginas, 6 de modal/feedback/resultado e 4 de navegação aberta** |

As interações verificadas incluem abertura/fechamento do menu, alternância e persistência do tema após recarregar, notificações no celular, busca e filtros de tarefas, chamada do handler de conclusão, seleção de avatar, troca das quatro abas de configurações, acionamento por teclado, toast, leitura integral de escola/turma, avanço de aula e progresso local, quiz completo, registro simulado de XP, resultado, tentativa novamente e fechamento.

O modal foi medido nas sete larguras e nos dois temas. O menu foi confirmado oculto inicialmente nas 84 combinações de página, largura e tema. A abertura por ícone com animação e o fechamento pelo mesmo ícone foram verificados nas sete larguras e nos dois temas. As capturas principais usam 1440px e 375px. Os testes de layout usaram a fonte de fallback local para não depender do carregamento remoto do Google Fonts; as referências às fontes originais permanecem no projeto.

Auditoria independente contra o ZIP original:

- 139 arquivos originais, 127 byte a byte idênticos e 12 modificados somente no aluno; nenhum ausente.
- Único arquivo novo dentro de `App/`: `student-ui.css`.
- Todos os 61 arquivos JavaScript originais preservados.
- Backend, banco/regras de negócio, login, administração, professores, componentes compartilhados e CSS compartilhados intactos.
- IDs, classes originais, atributos de eventos e referências a scripts preservados nos seis HTML; scripts inline byte a byte idênticos.

Na atualização do menu, os hashes finais foram recalculados contra o manifesto original já verificado. Somente `student-ui.css` mudou em relação à primeira entrega; o ZIP de origem não estava disponível para nova leitura nessa atualização.

Resultados detalhados: `validation/results.json`. Inventário e hashes: `validation/integrity.json`. Para repetir em uma máquina com Node e Playwright disponíveis: `node validation/check-student.cjs`. O teste usa Chrome instalado, abre um servidor temporário em `127.0.0.1:4174` e o encerra ao terminar.

## 8. Limites e verificações manuais pendentes

- Login real, permissões, gravações de perfil/senha, tarefas e XP precisam de uma execução final no Electron com o backend/MySQL configurado e uma conta de aluno real. A integridade desses arquivos foi confirmada, mas os testes desta entrega validam o frontend com dados de teste.
- Resgate de prêmios e exclusão de conta já estavam indisponíveis no original; seus estados desabilitados foram preservados. O aprendizado continua usando o progresso local existente, sem alteração das regras de XP.
- Recomenda-se conferir o carregamento das fontes remotas no ambiente de distribuição e a navegação com leitor de tela. A verificação de contraste automatizada e a inspeção visual não substituem uma auditoria completa de acessibilidade.
- A pasta de trabalho no OneDrive recusou gravação mesmo após a tentativa autorizada de extração. Por isso, os arquivos revisados foram gravados na pasta local de entrega do Codex e empacotados em `Monetto-aluno-revisado-v2.zip`. O `App.zip` original foi preservado.

Para aplicar em uma cópia existente, os arquivos de produção necessários são apenas os seis HTML, os seis CSS do aluno e o novo `App/frontend/student/student-ui.css`. O pacote também contém o restante do projeto original intacto e as evidências de validação.
