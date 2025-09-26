import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import InfoIcon from "@mui/icons-material/Info";
import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import type { Job, MatchRequest, PresetResume } from "../lib/api";
import { readFile } from "../utils/fileReader";
import { JobDetailsCard } from "./JobDetailsCard";

type MatchFormProps = {
  isSubmitting: boolean;
  job?: Job | null;
  onSubmit: (payload: MatchRequest) => Promise<void> | void;
  presetResumes: Array<PresetResume>;
  resetKey?: number;
};

type FormErrors = {
  job?: string;
  resume?: string;
};

export function MatchForm(props: MatchFormProps) {
  const { isSubmitting, job, onSubmit, presetResumes, resetKey } = props;

  const [errors, setErrors] = useState<FormErrors>({});
  const [resumeText, setResumeText] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string>("");

  useEffect(() => {
    setResumeText("");
    setSelectedPreset("");
    setErrors({});
  }, [resetKey, job?.id]);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setResumeText(event.target.value);
  };

  const loadResumeFromFile = async (file: File) => {
    const content = await readFile(file);
    setResumeText(content);
  };

  const handlePresetSelection = (event: SelectChangeEvent<string>) => {
    const presetId = event.target.value;
    setSelectedPreset(presetId);

    if (!presetId) {
      setResumeText("");
      return;
    }

    const preset = presetResumes.find((item) => item.id === presetId);
    if (preset) {
      setResumeText(preset.markdown);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedResume = resumeText.trim();
    const nextErrors: FormErrors = {};

    if (!job) {
      nextErrors.job = "Não foi possível carregar a vaga. Atualize a página e tente novamente.";
    }

    if (!trimmedResume) {
      nextErrors.resume = "Informe o currículo em Markdown.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});

    await onSubmit({
      job,
      resumeMarkdown: trimmedResume,
      source: selectedPreset ? "preset" : "manual",
    });
  };

  return (
    <Paper
      component="form"
      elevation={3}
      onSubmit={handleSubmit}
      sx={{ display: "flex", flexDirection: "column", gap: 3, p: 3 }}
    >
      <Box>
        <Typography component="h2" gutterBottom variant="h5">
          Analisar Vaga e Currículo
        </Typography>
        <Typography color="text.secondary" variant="body2">
          Visualize a vaga selecionada abaixo e forneça o currículo em Markdown (texto) para calcular o match.
        </Typography>
      </Box>

      <Stack spacing={1.5}>
        {!job ? <Skeleton animation="wave" height={200} variant="rounded" /> : <JobDetailsCard job={job} />}
        {errors.job ? (
          <Alert icon={<InfoIcon fontSize="small" />} severity="error">
            {errors.job}
          </Alert>
        ) : null}
      </Stack>

      <Stack spacing={1}>
        <Stack alignItems="center" direction={{ sm: "row", xs: "column" }} spacing={1}>
          <Typography variant="subtitle1">Currículo em Markdown</Typography>
          <Button component="label" size="small" startIcon={<CloudUploadIcon sx={{ mt: -0.1 }} />} variant="outlined">
            Carregar arquivo
            <input
              accept="text/markdown,text/plain,.md"
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
          multiline
          onChange={handleChange}
          placeholder="Cole aqui o conteúdo do currículo em Markdown (ou selecione/carregue um arquivo acima)"
          rows={7}
          sx={{ "& textarea": { maxHeight: 240, overflowY: "auto" } }}
          value={resumeText}
        />
      </Stack>

      <Box display="flex" justifyContent="flex-end">
        <Button disabled={isSubmitting || !job} size="large" type="submit" variant="contained">
          {isSubmitting ? "Calculando..." : "Calcular Match"}
        </Button>
      </Box>
    </Paper>
  );
}
