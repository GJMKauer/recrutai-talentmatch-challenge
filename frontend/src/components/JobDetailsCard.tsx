import InsertInvitationIcon from "@mui/icons-material/InsertInvitation";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import WorkIcon from "@mui/icons-material/Work";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import type { Job } from "../lib/api";

type JobDetailsCardProps = {
  job: Job;
};

export function JobDetailsCard(props: JobDetailsCardProps) {
  const { job } = props;

  const mustHave = job.requirements?.mandatory ?? [];
  const niceToHave = job.requirements?.desirable ?? [];

  const renderRequirementGroup = (label: string, groups: typeof mustHave, color: "primary" | "secondary") => {
    if (groups.length === 0) {
      return null;
    }

    return (
      <Box>
        <Typography color="text.secondary" gutterBottom variant="subtitle2">
          {label}
        </Typography>
        <Stack alignItems="flex-start" direction="row" flexWrap="wrap" gap={1}>
          {groups.flatMap((group) =>
            group.items.map((item) => {
              const text = typeof item === "string" ? item : `${item.language} (${item.level})`;
              return (
                <Chip color={color} key={`${group.category}-${text}`} label={text} size="small" variant="outlined" />
              );
            })
          )}
        </Stack>
      </Box>
    );
  };

  return (
    <Card sx={{ maxHeight: 280, overflowY: "auto" }} variant="outlined">
      <CardContent>
        <Stack spacing={1.5}>
          <Box>
            <Stack alignItems="center" direction="row" spacing={1}>
              <WorkIcon color="primary" fontSize="small" />
              <Typography color="text.secondary" variant="subtitle2">
                Vaga selecionada
              </Typography>
            </Stack>
            <Typography gutterBottom mt={0.5} variant="h6">
              {job.title}
            </Typography>
            <Stack alignItems="center" direction="row" flexWrap="wrap" spacing={1}>
              {job.company?.name ? (
                <Typography color="text.secondary" variant="body2">
                  {job.company.name}
                </Typography>
              ) : null}
              {job.location ? (
                <Stack alignItems="center" direction="row" spacing={0.5}>
                  <LocationOnIcon color="disabled" fontSize="inherit" />
                  <Typography color="text.secondary" variant="body2">
                    {[job.location.city, job.location.state, job.location.type].filter(Boolean).join(" • ")}
                  </Typography>
                </Stack>
              ) : null}
              {job.seniority_level ? (
                <Stack alignItems="center" direction="row" spacing={0.5}>
                  <InsertInvitationIcon color="disabled" fontSize="inherit" />
                  <Typography color="text.secondary" variant="body2">
                    {job.seniority_level}
                  </Typography>
                </Stack>
              ) : null}
            </Stack>
          </Box>

          {job.description ? (
            <Typography color="text.secondary" variant="body2">
              {job.description}
            </Typography>
          ) : null}

          {job.responsibilities && job.responsibilities.length > 0 ? (
            <Box>
              <Typography color="text.secondary" gutterBottom variant="subtitle2">
                Responsabilidades principais
              </Typography>
              <List dense disablePadding>
                {job.responsibilities.slice(0, 5).map((responsibility) => (
                  <ListItem disableGutters key={responsibility}>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <TaskAltIcon color="primary" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={responsibility} primaryTypographyProps={{ variant: "body2" }} />
                  </ListItem>
                ))}
              </List>
            </Box>
          ) : null}

          {renderRequirementGroup("Obrigatórios", mustHave, "primary")}

          {niceToHave.length > 0 ? <Divider flexItem /> : null}

          {renderRequirementGroup("Desejáveis", niceToHave, "secondary")}
        </Stack>
      </CardContent>
    </Card>
  );
}
