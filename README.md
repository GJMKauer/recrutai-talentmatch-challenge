# Desafio Técnico: Match de Candidatos

## Contexto
Desenvolver um MVP de um sistema de matching entre candidatos e vagas para plataforma de recrutamento automatizado. O sistema deve analisar currículos de candidatos e determinar o quão adequados eles são para uma vaga específica.

## Requisitos Funcionais

1. **Backend API** com os seguintes endpoints:
   - `POST /api/match` - Recebe um CV (texto) e uma vaga (JSON) e retorna um score de compatibilidade
   - `GET /api/match/report/:id` - Retorna detalhes da análise de match

2. **Frontend** com:
   - Tela para upload de CVs (texto simples)
   - Dashboard mostrando resultados do matching com:
     - Score de compatibilidade (0-100)
     - Skills correspondentes destacadas
     - Skills faltantes
   - Opcionalmente incluir um resumo com insights sobre o candidato e sugestões de perguntas para entrevista

## Requisitos Técnicos

### Obrigatórios
- **Backend**: Node.js (Express/Fastify) ou Python (FastAPI/Flask)
- **Frontend**: React
- **Banco de Dados**: pode usar in-memory para o MVP
- **Documentação**: README com instruções de setup e execução
- **AI DevTools**: uso de ferramentas como Cursor, Windsurf, Claude Code, Codex, Lovable

### Desejáveis
- Testes unitários para lógica crítica

## Materiais Fornecidos
- 3 exemplos de CVs em formato Markdown
- 1 Job Description em formato JSON estruturado
- Estrutura sugerida de resposta da API (pode ser adaptada)

```json
{
  "candidateId": "string",
  "jobId": "string",
  "overallScore": 85,
  "matchedSkills": ["Python", "AWS", "Docker"],
  "missingSkills": ["Kubernetes", "Terraform"],
  "insights": "string",
  "suggestedQuestions": ["array de strings (opcional)"]
}
```

## Critérios de Avaliação
- Qualidade do Código
- Funcionalidade
- Uso de IA

## Entrega

1. **Código fonte** em repositório Git (GitHub, GitLab, etc)

2. **README** incluindo:
   - Instruções de instalação e execução
   - Decisões técnicas e trade-offs

3. **Uso de IA DevTools**
   - Logs dos prompts e screenshots
   - Comentários sobre:
     1. Como você usou ferramentas de IA no desenvolvimento?
     2. Onde a IA ajudou mais e onde você preferiu código manual?

---

## Visão Geral da Implementação

O projeto entrega um MVP full-stack totalmente em TypeScript dividido em dois pacotes (`backend/` e `frontend/`) coordenados via workspaces do npm.

- **Backend (Fastify + MSC)**: expõe `POST /api/match`, `GET /api/match` e `GET /api/match/report/:id`, persiste resultados apenas em memória e mantém um fallback heurístico quando a chave da OpenAI não está disponível. A service layer encapsula a chamada à IA e registra métricas básicas (modelo, tokens, duração).
- **Frontend (React + Vite + MUI)**: página única com formulário para JSON da vaga e currículo (upload/colagem ou seleção de presets), dashboard individual com cards de insights e modo comparativo em tabela para vários candidatos.
- **Testes**: casos unitários em `backend/test/matchService.test.mjs` cobrem a service de matching, verificando fallback heurístico, ordenação e injeção de analisadores.

## Requisitos de Ambiente

- Node.js ≥ 20
- npm ≥ 10

Clone o repositório e instale tudo de uma vez na raiz:

```bash
npm install
```

## Variáveis de Ambiente

No backend copie `.env.example`:

```bash
cp backend/.env.example backend/.env
```

Configure `OPENAI_API_KEY` para habilitar a análise usando o modelo informado em `OPENAI_MATCH_MODEL`. Quando ausente, o serviço passa automaticamente para o modo heurístico.

`PRESET_RESUME_DIR` pode ser ajustado caso os currículos de exemplo sejam movidos.

## Scripts Principais

| Comando                     | Descrição |
|-----------------------------|-----------|
| `npm run dev:backend`       | Inicia o Fastify em modo watch (porta 3333) |
| `npm run dev:frontend`      | Inicia o Vite dev server com proxy para `/api` |
| `npm run build`             | Compila o backend (tsc) e gera o bundle do frontend |
| `npm run lint`              | Lint em ambos os pacotes |
| `npm run test`              | Executa os testes unitários do backend |

Durante o desenvolvimento rode backend e frontend em terminais separados.

## Estrutura de Pastas

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

1. Controller valida o payload com Zod, delega para a service.
2. Service normaliza o JSON da vaga, roda `analyzeMatch` e persiste o resultado em memória (Map).
3. `analyzeMatch` usa OpenAI (`responses.create`) quando configurado; caso contrário aplica heurística baseada em keywords da vaga.
4. Logs registram origem (`openai` ou `fallback`), tokens e duração.
5. Endpoints auxiliares: `/api/match` (lista resumos), `/api/presets/resumes` (currículos mockados), `/api/status` (exibe se OpenAI está ativo).

## Experiência do Frontend

- Upload de arquivos `.json` (vaga) e `.md`/`.txt` (currículo) ou seleção de presets carregados do backend.
- Campos opcionais para nome/ID do candidato.
- Snackbar de feedback para sucesso/erro, mensagens de fallback quando a análise heurística está ativa.
- Visualização individual com cards de score, forças, lacunas e perguntas sugeridas; modo comparativo mostra todos os matches em uma tabela com destaque para o melhor score.
- Layout responsivo usando MUI Grid Legacy (12 colunas) e acessibilidade básica (`aria-label` em textareas, botões com `aria-label`).

## Testes

```bash
npm run test        # compila e executa node --test sobre a service de matching
```

Os testes trocam o analisador da service (`setMatchAnalyzer`) para simular respostas da OpenAI e garantem ordenação/armazenamento em memória.

## Observabilidade e Logs

- Logs Fastify registram cada match persistido, a origem da análise e, quando disponível, estatísticas de tokens.
- Endpoint `/api/status` permite ao frontend exibir se a chave da OpenAI está ativa.

## Próximos Passos sugeridos

1. Persistência em banco (PostgreSQL) com repositórios dedicados.
2. Autenticação e segregação por empresa/recrutador.
3. Cache para reusar resultados de matches repetidos e expor métricas via Prometheus.
4. Evoluir heurística para considerar pesos por categoria enquanto a chave da OpenAI estiver ausente.
