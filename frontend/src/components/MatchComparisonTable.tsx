import {
  Button,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import type { MatchSummary } from "../lib/api";

type MatchComparisonTableProps = {
  bestScore: number;
  matches: Array<MatchSummary>;
  onSelectMatch: (id: string) => void;
  selectedMatchId: null | string;
};

/** Componente que exibe uma tabela comparativa de análises de compatibilidade (matches).
 * Destaca o candidato com a melhor pontuação e permite selecionar uma análise para ver detalhes.
 * @param bestScore - A melhor pontuação entre os candidatos.
 * @param matches - Um array de resumos das análises de compatibilidade.
 * @param onSelectMatch - Função chamada ao selecionar uma análise, recebendo o ID da análise.
 * @param selectedMatchId - O ID da análise atualmente selecionada, ou null se nenhuma estiver selecionada.
 * @returns Um componente React que renderiza a tabela comparativa.
 */
export function MatchComparisonTable(props: MatchComparisonTableProps) {
  const { bestScore, matches, onSelectMatch, selectedMatchId } = props;

  return (
    <Paper elevation={3} sx={{ p: 2 }}>
      <Table aria-label="Comparação de candidatos" size="small">
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell align="right">Score</TableCell>
            <TableCell>Origem da análise</TableCell>
            <TableCell>Gerado em</TableCell>
            <TableCell align="right">Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {matches.length === 0 ? (
            <TableRow>
              <TableCell align="center" colSpan={6}>
                Nenhum match calculado ainda.
              </TableCell>
            </TableRow>
          ) : null}
          {matches.map((summary) => {
            const highlight = summary.overallScore === bestScore && bestScore > 0;

            return (
              <TableRow hover key={summary.id} selected={selectedMatchId === summary.id}>
                <TableCell>{summary.candidateId}</TableCell>
                <TableCell align="right">
                  <Stack alignItems="center" direction="row" justifyContent="flex-end" spacing={1}>
                    {highlight ? <Chip color="success" label="Top" size="small" /> : null}
                    <Typography variant="body1">{summary.overallScore}</Typography>
                  </Stack>
                </TableCell>
                <TableCell>{summary.analysisSource === "openai" ? "OpenAI" : "Heurística"}</TableCell>
                <TableCell>{new Date(summary.createdAt).toLocaleString()}</TableCell>
                <TableCell align="right">
                  <Button onClick={() => onSelectMatch(summary.id)} size="small">
                    Ver detalhes
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Paper>
  );
}
