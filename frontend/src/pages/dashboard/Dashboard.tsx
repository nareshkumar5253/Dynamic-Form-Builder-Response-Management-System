
import { useEffect, useState } from "react";

import {
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";

import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

interface DashboardSummary {
  total_forms: number;
  enabled_forms: number;
  disabled_forms: number;
  total_responses: number;
}

interface DashboardForm {
  form_id: number;
  title: string;
  is_enabled: boolean;
  response_count: number;
}

interface RecentSubmission {
  response_id: number;
  form_id: number;
  form_title: string;
  submitted_by: string | null;
  status: string;
  submitted_at: string;
}

interface DashboardData {
  summary: DashboardSummary;
  forms: DashboardForm[];
  recent_submissions: RecentSubmission[];
}

const emptySummary: DashboardSummary = {
  total_forms: 0,
  enabled_forms: 0,
  disabled_forms: 0,
  total_responses: 0,
};

const statStyles = [
  {
    title: "Total Forms",
    subtitle: "Forms created",
    icon: DescriptionOutlinedIcon,
    color: "#2563eb",
    background: "#eff6ff",
  },
  {
    title: "Active Forms",
    subtitle: "Currently enabled",
    icon: CheckCircleOutlinedIcon,
    color: "#059669",
    background: "#ecfdf5",
  },
  {
    title: "Disabled Forms",
    subtitle: "Currently unavailable",
    icon: AssignmentTurnedInOutlinedIcon,
    color: "#d97706",
    background: "#fffbeb",
  },
  {
    title: "Total Responses",
    subtitle: "Submissions received",
    icon: TrendingUpOutlinedIcon,
    color: "#7c3aed",
    background: "#f5f3ff",
  },
];

const formatDate = (value: string) => {
  if (!value || Number.isNaN(new Date(value).getTime())) {
    return "Date unavailable";
  }

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const panelSx = {
  height: "100%",
  minWidth: 0,
  border: "1px solid #e8edf5",
  borderRadius: "18px",
  bgcolor: "#ffffff",
  boxShadow: "0 4px 18px rgba(15, 23, 42, 0.025)",
};

export default function DashboardPage() {
  const { logout } = useAuth();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        const response = await api.get<DashboardData>(
          "/dashboard/analytics"
        );

        if (mounted) {
          setData(response.data);
          setError("");
        }
      } catch (err: any) {
        if (!mounted) return;

        const status = err.response?.status;

        if (status === 403) {
          setError(
            "Your account does not have permission to view dashboard analytics. Please sign in with an administrator account."
          );
        } else if (status === 401) {
          logout();
        } else {
          setError(
            err.response?.data?.detail ||
              "Unable to load dashboard data. Check that the backend is running."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      mounted = false;
    };
  }, [logout]);

  const summary = data?.summary ?? emptySummary;

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 1500,
        mx: "auto",
        minWidth: 0,
        pb: 4,
      }}
    >
      {/* Page heading */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
        sx={{ mb: 4 }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: { xs: 26, md: 32 },
              fontWeight: 800,
              letterSpacing: "-1px",
              color: "#172033",
            }}
          >
            Dashboard
          </Typography>

          <Typography
            sx={{ color: "#748096", mt: 0.75, fontSize: 14 }}
          >
            Welcome back! Here&apos;s your forms and submissions overview.
          </Typography>
        </Box>

        <Chip
          icon={<AccessTimeRoundedIcon />}
          label={new Date().toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
          sx={{
            bgcolor: "#ffffff",
            border: "1px solid #e5eaf2",
            color: "#526078",
            fontWeight: 600,
            borderRadius: "10px",
            height: 38,
            px: 0.5,
          }}
        />
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Stack
          alignItems="center"
          justifyContent="center"
          spacing={2}
          sx={{ py: 12 }}
        >
          <CircularProgress />
          <Typography color="text.secondary">
            Loading dashboard analytics...
          </Typography>
        </Stack>
      ) : (
        <>
          {/* Statistics */}
          <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
            {statStyles.map((stat, index) => {
              const Icon = stat.icon;
              const values = [
                summary.total_forms,
                summary.enabled_forms,
                summary.disabled_forms,
                summary.total_responses,
              ];

              return (
                <Grid item xs={12} sm={6} xl={3} key={stat.title}>
                  <Card
                    elevation={0}
                    sx={{
                      height: "100%",
                      border: "1px solid #e8edf5",
                      borderRadius: "18px",
                      bgcolor: "#fff",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        transform: "translateY(-3px)",
                        boxShadow: "0 12px 28px rgba(15,23,42,0.07)",
                        borderColor: "#d9e2f0",
                      },
                    }}
                  >
                    <CardContent
                      sx={{ p: 2.75, "&:last-child": { pb: 2.75 } }}
                    >
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        spacing={2}
                      >
                        <Typography
                          sx={{
                            color: "#68758c",
                            fontWeight: 650,
                            fontSize: 14,
                          }}
                        >
                          {stat.title}
                        </Typography>

                        <Avatar
                          variant="rounded"
                          sx={{
                            width: 46,
                            height: 46,
                            bgcolor: stat.background,
                            color: stat.color,
                            borderRadius: "13px",
                          }}
                        >
                          <Icon />
                        </Avatar>
                      </Stack>

                      <Typography
                        sx={{
                          mt: 2.5,
                          mb: 1,
                          color: "#172033",
                          fontSize: { xs: 32, md: 38 },
                          lineHeight: 1.15,
                          fontWeight: 800,
                          letterSpacing: "-1.2px",
                        }}
                      >
                        {values[index]}
                      </Typography>

                      <Typography
                        sx={{ color: "#8994a7", fontSize: 13 }}
                      >
                        {stat.subtitle}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {/* Main dashboard panels */}
          <Grid container spacing={2.5} alignItems="stretch">
            {/* Forms panel */}
            <Grid item xs={12} lg={7}>
              <Card elevation={0} sx={panelSx}>
                <CardContent
                  sx={{ p: { xs: 2, sm: 3 }, "&:last-child": { pb: 3 } }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    spacing={2}
                    sx={{ mb: 0.75 }}
                  >
                    <Typography
                      sx={{ fontSize: 19, fontWeight: 800, color: "#172033" }}
                    >
                      Your Forms
                    </Typography>

                    <Avatar
                      variant="rounded"
                      sx={{
                        width: 38,
                        height: 38,
                        bgcolor: "#eff6ff",
                        color: "#2563eb",
                        borderRadius: "11px",
                      }}
                    >
                      <InsertDriveFileOutlinedIcon />
                    </Avatar>
                  </Stack>

                  <Typography sx={{ fontSize: 13, color: "#7b879b", mb: 2.5 }}>
                    Overview of created forms and their responses
                  </Typography>

                  <Divider />

                  {!data?.forms?.length ? (
                    <Stack alignItems="center" spacing={1.5} sx={{ py: 7 }}>
                      <Avatar
                        sx={{
                          width: 58,
                          height: 58,
                          bgcolor: "#f3f6fb",
                          color: "#8994a7",
                        }}
                      >
                        <DescriptionOutlinedIcon />
                      </Avatar>
                      <Typography fontWeight={700} color="#344054">
                        No forms found yet
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        textAlign="center"
                      >
                        Your created forms will appear here.
                      </Typography>
                    </Stack>
                  ) : (
                    data.forms.map((form) => (
                      <Box key={form.form_id}>
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          justifyContent="space-between"
                          alignItems={{ xs: "flex-start", sm: "center" }}
                          spacing={1.5}
                          sx={{
                            py: 2.25,
                            gap: 1.5,
                            transition: "background 0.2s",
                          }}
                        >
                          <Stack
                            direction="row"
                            alignItems="flex-start"
                            spacing={1.5}
                            sx={{ minWidth: 0, flex: 1 }}
                          >
                            <Avatar
                              variant="rounded"
                              sx={{
                                width: 40,
                                height: 40,
                                bgcolor: "#f3f6fb",
                                color: "#64748b",
                                borderRadius: "11px",
                              }}
                            >
                              <DescriptionOutlinedIcon fontSize="small" />
                            </Avatar>

                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography
                                sx={{
                                  fontWeight: 700,
                                  fontSize: 14,
                                  color: "#273449",
                                  overflowWrap: "anywhere",
                                }}
                              >
                                {form.title}
                              </Typography>

                              <Typography
                                sx={{
                                  mt: 0.6,
                                  fontSize: 12.5,
                                  color: "#8490a3",
                                }}
                              >
                                {form.response_count} responses
                              </Typography>
                            </Box>
                          </Stack>

                          <Chip
                            size="small"
                            label={form.is_enabled ? "Active" : "Disabled"}
                            color={form.is_enabled ? "success" : "default"}
                            variant="outlined"
                            sx={{
                              fontWeight: 650,
                              fontSize: 11,
                              borderRadius: "8px",
                            }}
                          />
                        </Stack>

                        <Divider />
                      </Box>
                    ))
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Recent submissions panel */}
            <Grid item xs={12} lg={5}>
              <Card elevation={0} sx={panelSx}>
                <CardContent
                  sx={{ p: { xs: 2, sm: 3 }, "&:last-child": { pb: 3 } }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    spacing={2}
                    sx={{ mb: 0.75 }}
                  >
                    <Typography
                      sx={{ fontSize: 19, fontWeight: 800, color: "#172033" }}
                    >
                      Recent Submissions
                    </Typography>

                    <Avatar
                      variant="rounded"
                      sx={{
                        width: 38,
                        height: 38,
                        bgcolor: "#ecfdf5",
                        color: "#059669",
                        borderRadius: "11px",
                      }}
                    >
                      <TrendingUpOutlinedIcon />
                    </Avatar>
                  </Stack>

                  <Typography sx={{ fontSize: 13, color: "#7b879b", mb: 2.5 }}>
                    Latest responses received
                  </Typography>

                  <Divider />

                  {!data?.recent_submissions?.length ? (
                    <Stack alignItems="center" spacing={1.5} sx={{ py: 7 }}>
                      <Avatar
                        sx={{
                          width: 58,
                          height: 58,
                          bgcolor: "#f3f6fb",
                          color: "#8994a7",
                        }}
                      >
                        <AssignmentTurnedInOutlinedIcon />
                      </Avatar>
                      <Typography fontWeight={700} color="#344054">
                        No submissions yet
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        textAlign="center"
                      >
                        New form responses will appear here.
                      </Typography>
                    </Stack>
                  ) : (
                    data.recent_submissions.map((submission) => (
                      <Box key={submission.response_id}>
                        <Box sx={{ py: 2.25 }}>
                          <Typography
                            sx={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: "#273449",
                              overflowWrap: "anywhere",
                            }}
                          >
                            {submission.form_title || "Untitled form"}
                          </Typography>

                          <Typography
                            sx={{
                              mt: 0.75,
                              fontSize: 12.5,
                              color: "#8490a3",
                              overflowWrap: "anywhere",
                            }}
                          >
                            By: {submission.submitted_by || "Unknown"}
                          </Typography>

                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            spacing={1}
                            sx={{ mt: 1.5, flexWrap: "wrap", rowGap: 1 }}
                          >
                            <Chip
                              size="small"
                              label={submission.status || "Submitted"}
                              color={
                                submission.status?.toUpperCase() === "SUBMITTED"
                                  ? "success"
                                  : "default"
                              }
                              variant="outlined"
                              sx={{
                                fontSize: 10.5,
                                fontWeight: 650,
                                borderRadius: "8px",
                              }}
                            />

                            <Typography
                              sx={{ fontSize: 11.5, color: "#8994a7" }}
                            >
                              {formatDate(submission.submitted_at)}
                            </Typography>
                          </Stack>
                        </Box>

                        <Divider />
                      </Box>
                    ))
                  )}

                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="flex-end"
                    spacing={0.5}
                    sx={{ pt: 2 }}
                  >
                    <Typography
                      sx={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}
                    >
                      Latest activity
                    </Typography>
                    <ArrowForwardRoundedIcon
                      sx={{ fontSize: 16, color: "#64748b" }}
                    />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}
