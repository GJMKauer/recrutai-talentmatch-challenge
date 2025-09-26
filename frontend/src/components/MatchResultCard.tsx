import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import Grid from '@mui/material/GridLegacy';
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
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';

import type { MatchResult } from '../lib/api';

dayjs.extend(relativeTime);

type MatchResultCardProps = {
  result: MatchResult;
};

export function MatchResultCard({ result }: MatchResultCardProps) {
  const createdAtLabel = dayjs(result.createdAt).isValid()
    ? dayjs(result.createdAt).fromNow()
    : null;

  const scoreColor = result.overallScore >= 80 ? 'success' : result.overallScore >= 60 ? 'warning' : 'error';

  return (
    <Card elevation={3} sx={{ height: '100%' }}>
      <CardHeader
        title={result.candidateName ?? `Candidato ${result.candidateId}`}
        subheader={
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              {result.job?.title ?? 'Vaga analisada'}
            </Typography>
            {result.job?.company?.name && (
              <Typography variant="body2" color="text.secondary">
                · {result.job.company.name}
              </Typography>
            )}
            {createdAtLabel && (
              <Typography variant="body2" color="text.secondary">
                · {createdAtLabel}
              </Typography>
            )}
          </Stack>
        }
        action={<Chip label={result.analysisSource === 'openai' ? 'OpenAI' : 'Heurístico'} color="default" />}
      />
      <CardContent>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h2" component="p" color={`${scoreColor}.main`}>
              {result.overallScore}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Score geral de aderência
            </Typography>
            <LinearProgress
              variant="determinate"
              value={result.overallScore}
              color={scoreColor}
              sx={{ mt: 1, height: 10, borderRadius: 5 }}
            />
          </Box>

          <Box>
            <Typography variant="h6">Insights</Typography>
            <Typography color="text.secondary" mt={1} whiteSpace="pre-line">
              {result.insights}
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Forças
              </Typography>
              <List dense>
                {result.strengths.length === 0 && (
                  <ListItem>
                    <ListItemText primary="Nenhum ponto forte destacado" />
                  </ListItem>
                )}
                {result.strengths.map((item) => (
                  <ListItem key={item}>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText primary={item} />
                  </ListItem>
                ))}
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Lacunas
              </Typography>
              <List dense>
                {result.gaps.length === 0 && (
                  <ListItem>
                    <ListItemText primary="Nenhuma lacuna relevante" />
                  </ListItem>
                )}
                {result.gaps.map((item) => (
                  <ListItem key={item}>
                    <ListItemIcon>
                      <HighlightOffIcon color="error" />
                    </ListItemIcon>
                    <ListItemText primary={item} />
                  </ListItem>
                ))}
              </List>
            </Grid>
          </Grid>

          <Divider />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Skills aderentes
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {result.matchedSkills.length === 0 && (
                  <Chip label="Sem correspondências" variant="outlined" />
                )}
                {result.matchedSkills.map((skill) => (
                  <Chip key={skill} label={skill} color="success" variant="outlined" />
                ))}
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Skills faltantes
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {result.missingSkills.length === 0 && (
                  <Chip label="Nenhuma lacuna" variant="outlined" />
                )}
                {result.missingSkills.map((skill) => (
                  <Chip key={skill} label={skill} color="warning" variant="outlined" />
                ))}
              </Stack>
            </Grid>
          </Grid>

          {result.suggestedQuestions && result.suggestedQuestions.length > 0 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
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
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
