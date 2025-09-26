import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';

import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';

import type { MatchRequest, PresetResume } from '../lib/api';

type MatchFormProps = {
  isSubmitting: boolean;
  presetResumes: PresetResume[];
  onSubmit: (payload: MatchRequest) => Promise<void> | void;
  resetKey?: number;
};

type FormErrors = {
  job?: string;
  resume?: string;
};

const initialState = {
  jobText: '',
  resumeText: '',
  candidateName: '',
  candidateId: '',
};

export function MatchForm({ isSubmitting, presetResumes, onSubmit, resetKey }: MatchFormProps) {
  const [formState, setFormState] = useState(initialState);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    setFormState(initialState);
    setSelectedPreset('');
    setErrors({});
  }, [resetKey]);

  const handleChange = (field: keyof typeof initialState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormState((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const loadJobFromFile = async (file: File) => {
    const content = await readFile(file);
    setFormState((prev) => ({ ...prev, jobText: content }));
  };

  const loadResumeFromFile = async (file: File) => {
    const content = await readFile(file);
    setFormState((prev) => ({ ...prev, resumeText: content }));
  };

  const handlePresetSelection = (event: SelectChangeEvent<string>) => {
    const presetId = event.target.value;
    setSelectedPreset(presetId);

    if (!presetId) {
      return;
    }

    const preset = presetResumes.find((item) => item.id === presetId);
    if (preset) {
      setFormState((prev) => ({ ...prev, resumeText: preset.markdown }));
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedResume = formState.resumeText.trim();
    const nextErrors: FormErrors = {};

    if (!formState.jobText.trim()) {
      nextErrors.job = 'Informe a vaga em formato JSON.';
    }

    if (!trimmedResume) {
      nextErrors.resume = 'Informe o currículo em Markdown.';
    }

    let jobPayload: unknown;

    if (!nextErrors.job) {
      try {
        jobPayload = JSON.parse(formState.jobText);
      } catch {
        nextErrors.job = 'JSON da vaga inválido.';
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});

    await onSubmit({
      job: jobPayload,
      resumeMarkdown: trimmedResume,
      candidate: {
        id: formState.candidateId.trim() || undefined,
        name: formState.candidateName.trim() || undefined,
      },
      source: selectedPreset ? 'preset' : 'manual',
    });
  };

  return (
    <Paper component="form" elevation={3} onSubmit={handleSubmit} sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Box>
          <Typography component="h2" variant="h5" gutterBottom>
            Analisar Vaga e Currículo
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Cole os dados da vaga em JSON, o currículo em Markdown ou utilize um currículo pré-definido.
          </Typography>
        </Box>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            label="Nome do candidato (opcional)"
            fullWidth
            value={formState.candidateName}
            onChange={handleChange('candidateName')}
          />
          <TextField
            label="ID do candidato (opcional)"
            fullWidth
            value={formState.candidateId}
            onChange={handleChange('candidateId')}
          />
        </Stack>

        <Stack spacing={1}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
            <Typography variant="subtitle1">JSON da vaga</Typography>
            <Button
              component="label"
              startIcon={<CloudUploadIcon />}
              variant="outlined"
              size="small"
            >
              Carregar arquivo
              <input
                type="file"
                hidden
                accept="application/json"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    await loadJobFromFile(file);
                    event.target.value = '';
                  }
                }}
              />
            </Button>
          </Stack>
          <TextField
            aria-label="Vaga em JSON"
            multiline
            minRows={8}
            value={formState.jobText}
            onChange={handleChange('jobText')}
            error={Boolean(errors.job)}
            helperText={errors.job}
            placeholder="Cole o JSON completo da vaga aqui"
          />
        </Stack>

        <Stack spacing={1}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
            <Typography variant="subtitle1">Currículo em Markdown</Typography>
            <Button
              component="label"
              startIcon={<CloudUploadIcon />}
              variant="outlined"
              size="small"
            >
              Carregar arquivo
              <input
                type="file"
                hidden
                accept="text/markdown,text/plain"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    await loadResumeFromFile(file);
                    setSelectedPreset('');
                    event.target.value = '';
                  }
                }}
              />
            </Button>
          </Stack>

          {presetResumes.length > 0 && (
            <FormControl fullWidth size="small">
              <InputLabel id="preset-resume-label">Currículos de exemplo</InputLabel>
              <Select
                labelId="preset-resume-label"
                value={selectedPreset}
                label="Currículos de exemplo"
                onChange={handlePresetSelection}
                disabled={isSubmitting}
              >
                <MenuItem value="">
                  <em>Nenhum</em>
                </MenuItem>
                {presetResumes.map((resume) => (
                  <MenuItem key={resume.id} value={resume.id}>
                    {resume.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <TextField
            aria-label="Currículo em Markdown"
            multiline
            minRows={12}
            value={formState.resumeText}
            onChange={handleChange('resumeText')}
            error={Boolean(errors.resume)}
            helperText={errors.resume}
            placeholder="Cole aqui o conteúdo do currículo em Markdown"
          />
        </Stack>

        <Box display="flex" justifyContent="flex-end">
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Calculando...' : 'Calcular Match'}
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}

async function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, 'utf-8');
  });
}
