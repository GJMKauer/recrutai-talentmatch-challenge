import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import relativeTime from "dayjs/plugin/relativeTime";
import type { MatchResult } from "../lib/api";

dayjs.extend(relativeTime);
dayjs.locale("pt-br");

type MatchResultCardProps = {
  result: MatchResult;
};

/** Componente que exibe os detalhes de uma análise de compatibilidade (match) entre um currículo e uma vaga de emprego.
 * Inclui pontuação geral, insights, forças, lacunas, skills aderentes e faltantes, e sugestões de perguntas para entrevista.
 * @param result - O objeto MatchResult contendo os detalhes da análise.
 * @returns Um componente React que renderiza os detalhes da análise de compatibilidade.
 */
export function MatchResultCard(props: MatchResultCardProps) {
  const { result } = props;

  const createdAtLabel = dayjs(result.createdAt).isValid() ? dayjs(result.createdAt).fromNow() : null;

  const getScoreColor = () => {
    if (result.overallScore >= 80) return "success";
    if (result.overallScore >= 60) return "warning";

    return "error";
  };

  const scoreColor = getScoreColor();

  return (
    <Card elevation={3} sx={{ height: "100%" }}>
      <CardHeader
        action={<Chip color="default" label={result.analysisSource === "openai" ? "OpenAI" : "Heurística"} />}
        subheader={
          <Stack alignItems="center" direction="row" spacing={1}>
            <Typography color="text.secondary" variant="body2">
              {result.job?.title ?? "Vaga analisada"}
            </Typography>
            {result.job?.company?.name ? (
              <Typography color="text.secondary" variant="body2">
                · {result.job.company.name}
              </Typography>
            ) : null}
            {createdAtLabel ? (
              <Typography color="text.secondary" variant="body2">
                · {createdAtLabel}
              </Typography>
            ) : null}
          </Stack>
        }
        title={`Candidato ${result.candidateId}`}
      />
      <CardContent>
        <Stack spacing={3}>
          <Box>
            <Typography color={`${scoreColor}.main`} component="p" variant="h2">
              {result.overallScore}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Score geral de aderência
            </Typography>
            <LinearProgress
              color={scoreColor}
              sx={{ borderRadius: 5, height: 10, mt: 1 }}
              value={result.overallScore}
              variant="determinate"
            />
          </Box>

          <Box>
            <Typography variant="h6">Insights</Typography>
            <Typography color="text.secondary" mt={1} whiteSpace="pre-line">
              {result.insights}
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item md={5} xs={12}>
              <Typography gutterBottom variant="subtitle1">
                Forças
              </Typography>
              <List dense>
                {result.strengths.length === 0 ? (
                  <ListItem>
                    <ListItemText primary="Nenhum ponto forte destacado" />
                  </ListItem>
                ) : null}
                {result.strengths.map((item) => (
                  <ListItem key={item}>
                    <CheckCircleIcon color="success" sx={{ mr: 1.5 }} />
                    <ListItemText primary={item} />
                  </ListItem>
                ))}
              </List>
            </Grid>
            <Grid item md={6} xs={12}>
              <Typography gutterBottom variant="subtitle1">
                Lacunas
              </Typography>
              <List dense>
                {result.gaps.length === 0 ? (
                  <ListItem>
                    <ListItemText primary="Nenhuma lacuna relevante" />
                  </ListItem>
                ) : null}
                {result.gaps.map((item) => (
                  <ListItem key={item}>
                    <HighlightOffIcon color="error" sx={{ mr: 1.5 }} />
                    <ListItemText primary={item} />
                  </ListItem>
                ))}
              </List>
            </Grid>
          </Grid>

          <Divider />

          <Grid container spacing={3}>
            <Grid item md={5} xs={12}>
              <Typography gutterBottom variant="subtitle1">
                Skills aderentes
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {result.matchedSkills.length === 0 ? <Chip label="Sem correspondências" variant="outlined" /> : null}
                {result.matchedSkills.map((skill) => (
                  <Chip color="success" key={skill} label={skill} variant="outlined" />
                ))}
              </Stack>
            </Grid>
            <Grid item md={6} xs={12}>
              <Typography gutterBottom variant="subtitle1">
                Skills faltantes
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {result.missingSkills.length === 0 ? <Chip label="Nenhuma lacuna" variant="outlined" /> : null}
                {result.missingSkills.map((skill, index, array) => {
                  if (index <= 10) {
                    return <Chip color="warning" key={skill} label={skill} variant="outlined" />;
                  }
                  if (index === 11) {
                    return (
                      <Chip color="warning" key={skill} label={`E outras ${array.length - 11}`} variant="outlined" />
                    );
                  }

                  return null;
                })}
              </Stack>
            </Grid>
          </Grid>

          {result.suggestedQuestions && result.suggestedQuestions.length > 0 ? (
            <Box>
              <Typography gutterBottom variant="subtitle1">
                Sugestões de perguntas para entrevista
              </Typography>
              <List dense>
                {result.suggestedQuestions.map((question, index) => (
                  <ListItem key={`${question}-${index}`}>
                    <ListItemIcon>
                      <QuestionAnswerIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={question} />
                  </ListItem>
                ))}
              </List>
            </Box>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
