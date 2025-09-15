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
   - Screenshots ou vídeo curto demonstrando a solução

3. **Uso de IA DevTools**
   - Logs dos prompts e screenshots
   - Comentários sobre:
     1. Como você usou ferramentas de IA no desenvolvimento?
     2. Onde a IA ajudou mais e onde você preferiu código manual?
