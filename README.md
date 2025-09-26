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


---

## Decisões Técnicas e trade-offs
TODO.


## IA DevTools
- Codex
- GPT
- Copilot
- Lovable