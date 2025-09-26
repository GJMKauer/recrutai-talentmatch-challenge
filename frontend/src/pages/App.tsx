import AssessmentIcon from "@mui/icons-material/Assessment";
import ListAltIcon from "@mui/icons-material/ListAlt";
import RefreshIcon from "@mui/icons-material/Refresh";
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
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MatchForm } from "../components/MatchForm";
import { MatchResultCard } from "../components/MatchResultCard";
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
} from "../lib/api";
type ViewMode = "comparison" | "individual";
type MatchDetailDictionary = Record<string, MatchResult>;

/** Componente principal da aplicação. */
export function App() {
  const matchDetailsRef = useRef<MatchDetailDictionary>({});

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formResetKey, setFormResetKey] = useState(0);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSubmittingMatch, setIsSubmittingMatch] = useState(false);
  const [matchDetails, setMatchDetails] = useState<MatchDetailDictionary>({});
  const [matches, setMatches] = useState<Array<MatchSummary>>([]);
  const [presetResumes, setPresetResumes] = useState<Array<PresetResume>>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [status, setStatus] = useState<{ ai: { openaiConfigured: boolean } } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("individual");

  const selectedMatch = selectedMatchId ? matchDetails[selectedMatchId] : undefined;

  useEffect(() => {
    matchDetailsRef.current = matchDetails;
  }, [matchDetails]);

  const bestScore = useMemo(() => {
    return matches.reduce((max, summary) => Math.max(max, summary.overallScore), 0);
  }, [matches]);

  /** Carrega o relatório detalhado de um match, utilizando cache se disponível. */
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
      setErrorMessage((error as Error).message ?? "Não foi possível carregar o relatório.");
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
      setErrorMessage((error as Error).message ?? "Falha ao carregar dados iniciais.");
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
    setIsSubmittingMatch(true);

    try {
      const summary = await createMatch(payload);
      setInfoMessage("Match calculado com sucesso.");

      await refreshSummaries();
      setSelectedMatchId(summary.id);
      setViewMode("individual");
      setFormResetKey((value) => value + 1);

      const detail = await fetchMatchReport(summary.id);
      setMatchDetails((prev) => {
        const next = { ...prev, [summary.id]: detail };
        matchDetailsRef.current = next;
        return next;
      });
    } catch (error) {
      setErrorMessage((error as Error).message ?? "Não foi possível calcular o match.");
    } finally {
      setIsSubmittingMatch(false);
    }
  };

  const refreshSummaries = async () => {
    try {
      const summaries = await fetchMatchSummaries();
      setMatches(summaries);
    } catch (error) {
      setErrorMessage((error as Error).message ?? "Falha ao atualizar os resultados.");
    }
  }

  const handleViewModeChange = (_: unknown, nextValue: ViewMode | null) => {
    if (nextValue) {
      setViewMode(nextValue);
    }
  };

  const handleSelectMatch = (matchId: string) => {
    setSelectedMatchId(matchId);
    setViewMode("individual");
    loadMatchDetail(matchId).catch(() => {
      // Erro já exibido em toast
    });
  };

  const renderComparisonTable = () => (
    <Paper elevation={3} sx={{ p: 2 }}>
      <Table aria-label="Comparação de candidatos" size="small">
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
          {matches.length === 0 ? (
            <TableRow>
              <TableCell align="center" colSpan={6}>
                Nenhum match calculado ainda.
              </TableCell>
            </TableRow>
          ) : null}
          {matches.map((summary) => {
            const isBest = summary.overallScore === bestScore && bestScore > 0;
            return (
              <TableRow hover key={summary.id} selected={selectedMatchId === summary.id}>
                <TableCell>{summary.candidateName ?? "Sem nome"}</TableCell>
                <TableCell>{summary.candidateId}</TableCell>
                <TableCell align="right">
                  <Stack alignItems="center" direction="row" justifyContent="flex-end" spacing={1}>
                    {isBest ? <Chip color="success" label="Top" size="small" /> : null}
                    <Typography variant="body1">{summary.overallScore}</Typography>
                  </Stack>
                </TableCell>
                <TableCell>{summary.analysisSource === "openai" ? "OpenAI" : "Heurístico"}</TableCell>
                <TableCell>{new Date(summary.createdAt).toLocaleString()}</TableCell>
                <TableCell align="right">
                  <Button onClick={() => handleSelectMatch(summary.id)} size="small">
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
        <Paper elevation={2} sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6">Nenhum match selecionado</Typography>
          <Typography color="text.secondary" mt={1}>
            Calcule um match ou selecione um candidato na lista para visualizar detalhes.
          </Typography>
        </Paper>
      );
    }

    if (!selectedMatch) {
      return (
        <Box alignItems="center" display="flex" justifyContent="center" minHeight={240}>
          {isLoadingDetails ? <CircularProgress /> : <Typography>Nenhum detalhe disponível.</Typography>}
        </Box>
      );
    }

    return <MatchResultCard result={selectedMatch} />;
  };

  const renderMainContent = () => {
    switch (true) {
      case !initialLoadComplete:
        return (
          <Box alignItems="center" display="flex" flexGrow={1} justifyContent="center">
            <CircularProgress />
          </Box>
        );
      case viewMode === "comparison":
        return renderComparisonTable();
      case viewMode === "individual":
        return renderIndividualResult();
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Grid alignItems="stretch" container spacing={4}>
        <Grid item lg={4} md={5} xs={12}>
          <Stack spacing={2} sx={{ height: "100%" }}>
            <MatchForm
              isSubmitting={isSubmittingMatch}
              onSubmit={handleMatchSubmit}
              presetResumes={presetResumes}
              resetKey={formResetKey}
            />
            <Paper elevation={1} sx={{ p: 2 }}>
              <Stack alignItems="center" direction="row" spacing={2}>
                <Typography variant="subtitle1">Status da IA</Typography>
                {status?.ai.openaiConfigured ? (
                  <Chip color="success" label="OpenAI configurado" size="small" />
                ) : (
                  <Chip color="warning" label="Modo heurístico" size="small" />
                )}
                <Tooltip title="Atualizar status">
                  <span>
                    <IconButton
                      aria-label="Atualizar status"
                      onClick={async () => {
                        try {
                          const backendStatus = await fetchBackendStatus();
                          setStatus(backendStatus);
                          setInfoMessage("Status atualizado.");
                        } catch (error) {
                          setErrorMessage((error as Error).message ?? "Falha ao atualizar status.");
                        }
                      }}
                      size="small"
                    >
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
            </Paper>
          </Stack>
        </Grid>
        <Grid item lg={8} md={7} xs={12}>
          <Stack spacing={2} sx={{ height: "100%" }}>
            {status && !status.ai.openaiConfigured ? (
              <Alert severity="info">
                A chave da OpenAI não está configurada. Utilizando análise heurística para gerar os resultados.
              </Alert>
            ) : null}
            <Stack alignItems={{ sm: "center" }} direction={{ sm: "row", xs: "column" }} spacing={2}>
              <Typography component="h2" variant="h5">
                Resultados
              </Typography>
              <ToggleButtonGroup
                aria-label="Modo de visualização"
                exclusive
                onChange={handleViewModeChange}
                size="small"
                value={viewMode}
              >
                <ToggleButton aria-label="Visualizar resultado individual" value="individual">
                  <AssessmentIcon fontSize="small" sx={{ mr: 1 }} /> Individual
                </ToggleButton>
                <ToggleButton aria-label="Visualizar comparação de resultados" value="comparison">
                  <ListAltIcon fontSize="small" sx={{ mr: 1 }} /> Comparativo
                </ToggleButton>
              </ToggleButtonGroup>
            </Stack>

            {renderMainContent()}
          </Stack>
        </Grid>
      </Grid>
      <Snackbar autoHideDuration={6000} onClose={() => setErrorMessage(null)} open={Boolean(errorMessage)}>
        <Alert onClose={() => setErrorMessage(null)} severity="error" sx={{ width: "100%" }}>
          {errorMessage}
        </Alert>
      </Snackbar>
      <Snackbar autoHideDuration={4000} onClose={() => setInfoMessage(null)} open={Boolean(infoMessage)}>
        <Alert onClose={() => setInfoMessage(null)} severity="success" sx={{ width: "100%" }}>
          {infoMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}
export default App;
