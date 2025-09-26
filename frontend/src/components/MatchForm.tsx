import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";

import CloudUploadIcon from "@mui/icons-material/CloudUpload";
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
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";

import type { MatchRequest, PresetResume } from "../lib/api";

type MatchFormProps = {
  isSubmitting: boolean;
  onSubmit: (payload: MatchRequest) => Promise<void> | void;
  presetResumes: Array<PresetResume>;
  resetKey?: number;
};

type FormErrors = {
  job?: string;
  resume?: string;
};

const initialState = {
  candidateId: "",
  candidateName: "",
  jobText: "",
  resumeText: "",
};

export function MatchForm({ isSubmitting, onSubmit, presetResumes, resetKey }: MatchFormProps) {
  const [formState, setFormState] = useState(initialState);
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    setFormState(initialState);
    setSelectedPreset("");
    setErrors({});
  }, [resetKey]);

  const handleChange =
    (field: keyof typeof initialState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      nextErrors.job = "Informe a vaga em formato JSON.";
    }

    if (!trimmedResume) {
      nextErrors.resume = "Informe o currículo em Markdown.";
    }

    let jobPayload: unknown;

    if (!nextErrors.job) {
      try {
        jobPayload = JSON.parse(formState.jobText);
      } catch {
        nextErrors.job = "JSON da vaga inválido.";
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});

    await onSubmit({
      candidate: {
        id: formState.candidateId.trim() || undefined,
        name: formState.candidateName.trim() || undefined,
      },
      job: jobPayload,
      resumeMarkdown: trimmedResume,
      source: selectedPreset ? "preset" : "manual",
    });
  };

  return (
    <Paper component="form" elevation={3} onSubmit={handleSubmit} sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Box>
          <Typography component="h2" gutterBottom variant="h5">
            Analisar Vaga e Currículo
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Cole os dados da vaga em JSON, o currículo em Markdown ou utilize um currículo pré-definido.
          </Typography>
        </Box>

        <Stack direction={{ md: "row", xs: "column" }} spacing={2}>
          <TextField
            fullWidth
            label="Nome do candidato (opcional)"
            onChange={handleChange("candidateName")}
            value={formState.candidateName}
          />
          <TextField
            fullWidth
            label="ID do candidato (opcional)"
            onChange={handleChange("candidateId")}
            value={formState.candidateId}
          />
        </Stack>

        <Stack spacing={1}>
          <Stack alignItems={{ sm: "center" }} direction={{ sm: "row", xs: "column" }} spacing={1}>
            <Typography variant="subtitle1">JSON da vaga</Typography>
            <Button component="label" size="small" startIcon={<CloudUploadIcon />} variant="outlined">
              Carregar arquivo
              <input
                accept="application/json"
                hidden
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    await loadJobFromFile(file);
                    event.target.value = "";
                  }
                }}
                type="file"
              />
            </Button>
          </Stack>
          <TextField
            aria-label="Vaga em JSON"
            error={Boolean(errors.job)}
            helperText={errors.job}
            minRows={8}
            multiline
            onChange={handleChange("jobText")}
            placeholder="Cole o JSON completo da vaga aqui"
            value={formState.jobText}
          />
        </Stack>

        <Stack spacing={1}>
          <Stack alignItems={{ sm: "center" }} direction={{ sm: "row", xs: "column" }} spacing={1}>
            <Typography variant="subtitle1">Currículo em Markdown</Typography>
            <Button component="label" size="small" startIcon={<CloudUploadIcon />} variant="outlined">
              Carregar arquivo
              <input
                accept="text/markdown,text/plain"
                hidden
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    await loadResumeFromFile(file);
                    setSelectedPreset("");
                    event.target.value = "";
                  }
                }}
                type="file"
              />
            </Button>
          </Stack>

          {presetResumes.length > 0 ? (
            <FormControl fullWidth size="small">
              <InputLabel id="preset-resume-label">Currículos de exemplo</InputLabel>
              <Select
                disabled={isSubmitting}
                label="Currículos de exemplo"
                labelId="preset-resume-label"
                onChange={handlePresetSelection}
                value={selectedPreset}
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
          ) : null}

          <TextField
            aria-label="Currículo em Markdown"
            error={Boolean(errors.resume)}
            helperText={errors.resume}
            minRows={12}
            multiline
            onChange={handleChange("resumeText")}
            placeholder="Cole aqui o conteúdo do currículo em Markdown"
            value={formState.resumeText}
          />
        </Stack>

        <Box display="flex" justifyContent="flex-end">
          <Button disabled={isSubmitting} size="large" type="submit" variant="contained">
            {isSubmitting ? "Calculando..." : "Calcular Match"}
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}

async function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, "utf-8");
  });
}
