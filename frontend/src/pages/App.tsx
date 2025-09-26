import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import AssessmentIcon from '@mui/icons-material/Assessment';
import ListAltIcon from '@mui/icons-material/ListAlt';
import RefreshIcon from '@mui/icons-material/Refresh';
import Grid from '@mui/material/GridLegacy';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';

import { MatchForm } from '../components/MatchForm';
import { MatchResultCard } from '../components/MatchResultCard';
import {
  createMatch,
  fetchBackendStatus,
  fetchMatchReport,
  fetchMatchSummaries,
  fetchPresetResumes,
  type MatchRequest,
  type MatchResult,
  type MatchSummary,
  type PresetResume,
} from '../lib/api';

type ViewMode = 'individual' | 'comparison';

type MatchDetailDictionary = Record<string, MatchResult>;

export function App() {
  const [presetResumes, setPresetResumes] = useState<PresetResume[]>([]);
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [matchDetails, setMatchDetails] = useState<MatchDetailDictionary>({});
  const matchDetailsRef = useRef<MatchDetailDictionary>({});
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('individual');
  const [isSubmittingMatch, setIsSubmittingMatch] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<{ ai: { openaiConfigured: boolean } } | null>(null);
  const [formResetKey, setFormResetKey] = useState(0);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const selectedMatch = selectedMatchId ? matchDetails[selectedMatchId] : undefined;

  useEffect(() => {
    matchDetailsRef.current = matchDetails;
  }, [matchDetails]);

  const bestScore = useMemo(() => {
    return matches.reduce((max, summary) => Math.max(max, summary.overallScore), 0);
  }, [matches]);

  const loadMatchDetail = useCallback(async (matchId: string) => {
    if (matchDetailsRef.current[matchId]) {
      return matchDetailsRef.current[matchId];
    }

    setIsLoadingDetails(true);
    try {
      const detail = await fetchMatchReport(matchId);
      setMatchDetails((prev) => {
        const next = { ...prev, [matchId]: detail };
        matchDetailsRef.current = next;
        return next;
      });
      return detail;
    } catch (error) {
      setErrorMessage((error as Error).message ?? 'Não foi possível carregar o relatório.');
      throw error;
    } finally {
      setIsLoadingDetails(false);
    }
  }, []);

  const fetchInitialData = useCallback(async () => {
    try {
      const controller = new AbortController();
      const [resumes, backendStatus, summaries] = await Promise.all([
        fetchPresetResumes(controller.signal),
        fetchBackendStatus(controller.signal).catch(() => ({ ai: { openaiConfigured: false } })),
        fetchMatchSummaries(controller.signal).catch(() => []),
      ]);

      setPresetResumes(resumes);
      setStatus(backendStatus);
      setMatches(summaries);

      if (summaries.length > 0) {
        const firstMatch = summaries[0];
        setSelectedMatchId(firstMatch.id);
        await loadMatchDetail(firstMatch.id);
      }
    } catch (error) {
      setErrorMessage((error as Error).message ?? 'Falha ao carregar dados iniciais.');
    } finally {
      setInitialLoadComplete(true);
    }
  }, [loadMatchDetail]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    if (!selectedMatchId || matchDetails[selectedMatchId]) {
      return;
    }

    loadMatchDetail(selectedMatchId).catch(() => {
      /* erro já tratado */
    });
  }, [selectedMatchId, matchDetails, loadMatchDetail]);

  const handleMatchSubmit = async (payload: MatchRequest) => {
    try {
      setIsSubmittingMatch(true);
      const summary = await createMatch(payload);
      setInfoMessage('Match calculado com sucesso.');

      await refreshSummaries();
      setSelectedMatchId(summary.id);
      setViewMode('individual');
      setFormResetKey((value) => value + 1);

      const detail = await fetchMatchReport(summary.id);
      setMatchDetails((prev) => {
        const next = { ...prev, [summary.id]: detail };
        matchDetailsRef.current = next;
        return next;
      });
    } catch (error) {
      setErrorMessage((error as Error).message ?? 'Não foi possível calcular o match.');
    } finally {
      setIsSubmittingMatch(false);
    }
  };

  async function refreshSummaries() {
    try {
      const summaries = await fetchMatchSummaries();
      setMatches(summaries);
    } catch (error) {
      setErrorMessage((error as Error).message ?? 'Falha ao atualizar os resultados.');
    }
  }

  const handleViewModeChange = (_: unknown, nextValue: ViewMode | null) => {
    if (nextValue) {
      setViewMode(nextValue);
    }
  };

  const handleSelectMatch = (matchId: string) => {
    setSelectedMatchId(matchId);
    setViewMode('individual');
    loadMatchDetail(matchId).catch(() => {
      // Erro já exibido em toast
    });
  };

  const renderComparisonTable = () => (
    <Paper elevation={3} sx={{ p: 2 }}>
      <Table size="small" aria-label="Comparação de candidatos">
        <TableHead>
          <TableRow>
            <TableCell>Candidato</TableCell>
            <TableCell>ID</TableCell>
            <TableCell align="right">Score</TableCell>
            <TableCell>Origem da análise</TableCell>
            <TableCell>Obtido</TableCell>
            <TableCell align="right">Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {matches.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} align="center">
                Nenhum match calculado ainda.
              </TableCell>
            </TableRow>
          )}
          {matches.map((summary) => {
            const isBest = summary.overallScore === bestScore && bestScore > 0;
            return (
              <TableRow key={summary.id} hover selected={selectedMatchId === summary.id}>
                <TableCell>{summary.candidateName ?? 'Sem nome'}</TableCell>
                <TableCell>{summary.candidateId}</TableCell>
                <TableCell align="right">
                  <Stack direction="row" justifyContent="flex-end" spacing={1} alignItems="center">
                    {isBest && <Chip label="Top" color="success" size="small" />}
                    <Typography variant="body1">{summary.overallScore}</Typography>
                  </Stack>
                </TableCell>
                <TableCell>{summary.analysisSource === 'openai' ? 'OpenAI' : 'Heurístico'}</TableCell>
                <TableCell>{new Date(summary.createdAt).toLocaleString()}</TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={() => handleSelectMatch(summary.id)}>
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

  const renderIndividualResult = () => {
    if (!selectedMatchId) {
      return (
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6">Nenhum match selecionado</Typography>
          <Typography color="text.secondary" mt={1}>
            Calcule um match ou selecione um candidato na lista para visualizar detalhes.
          </Typography>
        </Paper>
      );
    }

    if (!selectedMatch) {
      return (
        <Box display="flex" alignItems="center" justifyContent="center" minHeight={240}>
          {isLoadingDetails ? <CircularProgress /> : <Typography>Nenhum detalhe disponível.</Typography>}
        </Box>
      );
    }

    return <MatchResultCard result={selectedMatch} />;
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Grid container spacing={4} alignItems="stretch">
        <Grid item xs={12} md={5} lg={4}>
          <Stack spacing={2} sx={{ height: '100%' }}>
            <MatchForm
              isSubmitting={isSubmittingMatch}
              onSubmit={handleMatchSubmit}
              presetResumes={presetResumes}
              resetKey={formResetKey}
            />
            <Paper elevation={1} sx={{ p: 2 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="subtitle1">Status da IA</Typography>
                {status?.ai.openaiConfigured ? (
                  <Chip label="OpenAI configurado" color="success" size="small" />
                ) : (
                  <Chip label="Modo heurístico" color="warning" size="small" />
                )}
                <Tooltip title="Atualizar status">
                  <span>
                    <IconButton
                      size="small"
                      aria-label="Atualizar status"
                      onClick={async () => {
                        try {
                          const backendStatus = await fetchBackendStatus();
                          setStatus(backendStatus);
                          setInfoMessage('Status atualizado.');
                        } catch (error) {
                          setErrorMessage((error as Error).message ?? 'Falha ao atualizar status.');
                        }
                      }}
                    >
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
            </Paper>
          </Stack>
        </Grid>
        <Grid item xs={12} md={7} lg={8}>
          <Stack spacing={2} sx={{ height: '100%' }}>
            {status && !status.ai.openaiConfigured && (
              <Alert severity="info">
                A chave da OpenAI não está configurada. Utilizando análise heurística para gerar os resultados.
              </Alert>
            )}

            <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} spacing={2}>
              <Typography variant="h5" component="h2">
                Resultados
              </Typography>
              <ToggleButtonGroup
                exclusive
                size="small"
                value={viewMode}
                onChange={handleViewModeChange}
                aria-label="Modo de visualização"
              >
                <ToggleButton value="individual" aria-label="Visualizar resultado individual">
                  <AssessmentIcon fontSize="small" sx={{ mr: 1 }} /> Individual
                </ToggleButton>
                <ToggleButton value="comparison" aria-label="Visualizar comparação de resultados">
                  <ListAltIcon fontSize="small" sx={{ mr: 1 }} /> Comparativo
                </ToggleButton>
              </ToggleButtonGroup>
            </Stack>

            {!initialLoadComplete ? (
              <Box display="flex" alignItems="center" justifyContent="center" flexGrow={1}>
                <CircularProgress />
              </Box>
            ) : viewMode === 'comparison' ? (
              renderComparisonTable()
            ) : (
              renderIndividualResult()
            )}
          </Stack>
        </Grid>
      </Grid>

      <Snackbar
        open={Boolean(errorMessage)}
        autoHideDuration={6000}
        onClose={() => setErrorMessage(null)}
      >
        <Alert onClose={() => setErrorMessage(null)} severity="error" sx={{ width: '100%' }}>
          {errorMessage}
        </Alert>
      </Snackbar>

      <Snackbar
        open={Boolean(infoMessage)}
        autoHideDuration={4000}
        onClose={() => setInfoMessage(null)}
      >
        <Alert onClose={() => setInfoMessage(null)} severity="success" sx={{ width: '100%' }}>
          {infoMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}
export default App;
