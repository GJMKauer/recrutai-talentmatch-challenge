## Visão Geral da Implementação

O projeto entrega um MVP full-stack totalmente em TypeScript dividido em dois pacotes (`backend/` e `frontend/`) coordenados via workspaces do npm.

- **Backend (Fastify + MSC)**: expõe `POST /api/match`, `GET /api/match` e `GET /api/match/report/:id`, persiste resultados apenas em memória e mantém um fallback heurístico quando a chave da OpenAI não está disponível. A service layer encapsula a chamada à IA e registra métricas básicas (modelo, tokens, duração).
- **Frontend (React + Vite + MUI)**: página única com descrição da vaga e currículo (upload/colagem ou seleção de presets), dashboard individual com cards de insights e modo comparativo em tabela para vários candidatos.
- **Testes**: casos unitários em `backend/test/matchService.test.mjs` cobrem a service de matching, verificando fallback heurístico, ordenação e injeção de analisadores.

## Requisitos de Ambiente

- Node.js ≥ 20
- npm ≥ 10

Clone o repositório e instale as dependências a partir da raiz do projeto:

```bash
cd ./backend && npm install && cd ../frontend && npm install && cd ..
```

## Variáveis de Ambiente

Copie o arquivo `.env.example` para a raiz do backend do projeto:

```bash
cp backend/.env.example backend/.env
```

Configure `OPENAI_API_KEY` com uma chave válida para habilitar a análise usando o modelo informado em `OPENAI_MATCH_MODEL`. Quando ausente, o serviço passa automaticamente para o modo heurístico.

## Scripts Principais

| Comando                     | Descrição |
|-----------------------------|-----------|
| `npm run dev:backend`       | Inicia o Fastify em modo watch (porta 3333) |
| `npm run dev:frontend`      | Inicia o Vite dev server com proxy para `/api` |
| `npm run build`             | Compila o backend (tsc) e gera o bundle do frontend |
| `npm run lint`              | Lint em ambos os pacotes |
| `npm run test`              | Executa os testes unitários do backend |

## Estrutura de Pastas (arquivos principais)

```
backend/
  src/
    controllers/
    models/
    routes/
    services/
    server.ts
  test/matchService.test.mjs
  package.json
frontend/
  src/
    components/
    lib/
    pages/
    main.tsx
  package.json
mocks/
  cvs/
  jobs/
README.md
```

## Fluxo do Backend

1. Controller valida o payload com Zod, e delega a regra de negócio e outras validações para a service.
2. Service normaliza o JSON da vaga, roda `analyzeMatch` e persiste o resultado em memória através do uso de Map.
3. `analyzeMatch` usa OpenAI (`responses.create`) quando configurado; caso contrário aplica heurística baseada em keywords da vaga.
4. Logs registram origem (`openai` ou `fallback`), tokens e duração.
5. Endpoints auxiliares: `/api/match` (lista resumos), `/api/presets/resumes` (currículos mockados), `/api/status` (exibe se OpenAI está ativo).

## Experiência do Frontend

- Upload de arquivos `.md`/`.txt` (currículo) ou seleção de presets carregados do backend.
- Snackbar de feedback para sucesso/erro, mensagens de fallback quando a análise heurística está ativa.
- Visualização individual com cards de score, qualidades, lacunas e perguntas sugeridas; modo comparativo mostra todos os matches em uma tabela com destaque para o melhor score.
- Layout responsivo utilizando MUI, com acessibilidade básica (`aria-label` em textareas, botões com `aria-label`).

## Testes

```bash
npm run test
```

Os testes trocam o analisador da service (`setMatchAnalyzer`) para simular respostas da OpenAI e garantem ordenação/armazenamento em memória.

## Observabilidade e Logs

- Logs registram cada match persistido, a origem da análise e, quando disponível, estatísticas de tokens.
- Endpoint `/api/status` permite ao frontend exibir se a chave da OpenAI está ativa.

## Próximos Passos sugeridos

1. Persistência em banco (PostgreSQL) com repositórios dedicados.
2. Autenticação e segregação por empresa/recrutador.
3. Cache para reutilizar resultados de matches repetidos.
4. Evoluir ferramentas de leitura para permitir imagens e/ou PDFs (extração de conteúdo textual para a leitura).
5. Aprimoramentos e refinamentos no prompt/treinamento da IA para uma validação mais precisa.


## Decisões Técnicas e trade-offs
### Frontend

- **Stack:** React + Vite
- **Por quê:** Inicialização rápida do projeto, *Developer Experience* simples e familiaridade prévia.
- **Trade-offs:** Vite facilita a configuração inicial e HMR, mas exige alguns ajustes de build para cenários mais complexos (ex.: SSR ou integrações específicas - não é o caso desse MVP).

### Estilização

- **Biblioteca:** Material UI (MUI)
- **Por quê:** Legibilidade alta e amplo catálogo de componentes prontos, acelerando o MVP sem CSS extensivo.
- **Trade-offs:** MUI entrega produtividade imediata; Tailwind daria controle granular, porém com maior custo inicial de design system.

### Backend

- **Stack:** Node.js + Fastify
- **Por quê:** Alinhamento com a stack utilizada pela Recrut.AI e objetivo de reciclar experiência com Node no backend. O Fastify foi escolhido em relação ao Express pelas validações nativas, performance e uma estrutura de rotas/handlers mais amigável.
- **Trade-offs:** Sem necessidade de middlewares específicos, o Express não traria vantagens claras neste MVP.

### IA para Análise de Currículos

- **Serviço:** OpenAI API
- **Por quê:** Integração simples em Node/Python, modelo robusto para análise textual e geração de saídas padronizadas.
- **Trade-offs:** Dependência externa (custo/latência) — mitigado com fallback heurístico e contrato de resposta consistente.

### Ferramentas de Apoio
- **Lovable:** Referência de estrutura de componentes, apresentação em tela e modelagem de dados amigável ao usuário.
- **Codex (VSCode):** Geração da maior parte do código e lógica do MVP, otimizando tempo de desenvolvimento.

### Contribuições Manuais

- Regras de **ESLint** e **Prettier** ajustadas para padronização do código.
- Testes e correções visuais pontuais.
- **Documentação**: melhorias no README do desafio e docstrings em funções, métodos e componentes.

## IA DevTools
- Codex
- GPT
- Copilot
- Lovable