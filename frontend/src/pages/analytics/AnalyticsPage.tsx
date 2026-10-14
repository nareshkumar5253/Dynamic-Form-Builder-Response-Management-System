
import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  getDashboardAnalytics,
  getFormAnalytics,
  type DashboardAnalytics,
  type FormAnalytics,
} from "../../api/analytics";

import { getForms, type FormItem } from "../../api/forms";

const chartColors = [
  "#2563eb",
  "#0d9488",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
];

function MetricCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: number;
  subtitle: string;
}) {
  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        border: "1px solid #e2e8f0",
        borderRadius: 3,
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography color="text.secondary" variant="body2">
          {title}
        </Typography>

        <Typography
          variant="h4"
          fontWeight={800}
          sx={{ mt: 1, mb: 1, color: "#172033" }}
        >
          {value}
        </Typography>

        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const [dashboard, setDashboard] =
    useState<DashboardAnalytics | null>(null);

  const [forms, setForms] = useState<FormItem[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<number | "">("");
  const [formAnalytics, setFormAnalytics] =
    useState<FormAnalytics | null>(null);

  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const [dashboardData, formsData] = await Promise.all([
          getDashboardAnalytics(),
          getForms(),
        ]);

        if (!active) return;

        setDashboard(dashboardData);
        setForms(formsData);

        if (formsData.length > 0) {
          setSelectedFormId(formsData[0].id);
        }
      } catch (err: any) {
        if (active) {
          setError(
            err?.response?.data?.detail ||
              "Unable to load analytics. Please check your login and backend."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (selectedFormId === "") {
      setFormAnalytics(null);
      return;
    }

    let active = true;

    async function loadFormAnalytics() {
      setDetailLoading(true);

      try {
        const data = await getFormAnalytics(
          Number(selectedFormId),
          days
        );

        if (active) {
          setFormAnalytics(data);
        }
      } catch (err: any) {
        if (active) {
          setError(
            err?.response?.data?.detail ||
              "Unable to load selected form analytics."
          );
        }
      } finally {
        if (active) setDetailLoading(false);
      }
    }

    loadFormAnalytics();

    return () => {
      active = false;
    };
  }, [selectedFormId, days]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: 300,
          display: "grid",
          placeItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!dashboard) {
    return (
      <Alert severity="error">
        {error || "Analytics data is unavailable."}
      </Alert>
    );
  }

  const { summary } = dashboard;

  const statusData = [
    {
      name: "Submitted",
      value: summary.submitted_responses,
    },
    {
      name: "Updated",
      value: summary.updated_responses,
    },
    {
      name: "Other",
      value: Math.max(
        0,
        summary.total_responses -
          summary.submitted_responses -
          summary.updated_responses
      ),
    },
  ].filter((item) => item.value > 0);

  return (
    <Box sx={{ maxWidth: 1500, mx: "auto" }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={2}
        sx={{ mb: 4 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Analytics
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Monitor forms, submissions, trends, and field responses.
          </Typography>
        </Box>
      </Stack>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}

      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            title="Total Forms"
            value={summary.total_forms}
            subtitle="All created forms"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            title="Active Forms"
            value={summary.enabled_forms}
            subtitle="Currently enabled"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            title="Total Responses"
            value={summary.total_responses}
            subtitle="Across all forms"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            title="Submitted"
            value={summary.submitted_responses}
            subtitle={`${summary.updated_responses} updated responses`}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card
            elevation={0}
            sx={{
              border: "1px solid #e2e8f0",
              borderRadius: 3,
              height: "100%",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700}>
                Submission Trend
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 3 }}
              >
                Daily submissions over the last seven days
              </Typography>

              <Box sx={{ width: "100%", height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboard.submission_trend}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value: string) =>
                        value.slice(5)
                      }
                    />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar
                      dataKey="count"
                      name="Responses"
                      fill="#2563eb"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card
            elevation={0}
            sx={{
              border: "1px solid #e2e8f0",
              borderRadius: 3,
              height: "100%",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700}>
                Response Status
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2 }}
              >
                Distribution of all responses
              </Typography>

              <Box sx={{ width: "100%", height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={95}
                      label
                    >
                      {statusData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={chartColors[index % chartColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card
        elevation={0}
        sx={{
          border: "1px solid #e2e8f0",
          borderRadius: 3,
          mb: 4,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", sm: "center" }}
            spacing={2}
            sx={{ mb: 3 }}
          >
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Form Analytics
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Inspect submissions and answers for a selected form.
              </Typography>
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel id="analytics-form-label">
                  Select Form
                </InputLabel>

                <Select
                  labelId="analytics-form-label"
                  value={selectedFormId}
                  label="Select Form"
                  onChange={(event) => {
                    setError("");
                    setSelectedFormId(
                      event.target.value === ""
                        ? ""
                        : Number(event.target.value)
                    );
                  }}
                >
                  {forms.map((form) => (
                    <MenuItem key={form.id} value={form.id}>
                      {form.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel id="analytics-days-label">
                  Period
                </InputLabel>

                <Select
                  labelId="analytics-days-label"
                  value={days}
                  label="Period"
                  onChange={(event) =>
                    setDays(Number(event.target.value))
                  }
                >
                  <MenuItem value={7}>Last 7 days</MenuItem>
                  <MenuItem value={30}>Last 30 days</MenuItem>
                  <MenuItem value={90}>Last 90 days</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Stack>

          {detailLoading ? (
            <Box
              sx={{
                minHeight: 180,
                display: "grid",
                placeItems: "center",
              }}
            >
              <CircularProgress />
            </Box>
          ) : formAnalytics ? (
            <>
              <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box
                    sx={{
                      p: 2.5,
                      bgcolor: "#eff6ff",
                      borderRadius: 2,
                    }}
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Selected Form
                    </Typography>

                    <Typography
                      variant="h6"
                      fontWeight={700}
                      sx={{ mt: 1 }}
                    >
                      {formAnalytics.form_title}
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box
                    sx={{
                      p: 2.5,
                      bgcolor: "#f0fdfa",
                      borderRadius: 2,
                    }}
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Total Responses
                    </Typography>

                    <Typography
                      variant="h4"
                      fontWeight={800}
                      sx={{ mt: 1 }}
                    >
                      {formAnalytics.total_responses}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Typography
                variant="h6"
                fontWeight={700}
                sx={{ mb: 2 }}
              >
                Field Answer Distribution
              </Typography>

              {formAnalytics.field_analytics.length === 0 ? (
                <Alert severity="info">
                  This form has no fields to analyze yet.
                </Alert>
              ) : (
                <Grid container spacing={3}>
                  {formAnalytics.field_analytics.map((field) => (
                    <Grid
                      size={{ xs: 12, md: 6 }}
                      key={field.field_id}
                    >
                      <Card
                        variant="outlined"
                        sx={{ borderRadius: 2, height: "100%" }}
                      >
                        <CardContent>
                          <Typography
                            variant="subtitle1"
                            fontWeight={700}
                          >
                            {field.field_label}
                          </Typography>

                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {field.field_type} ·{" "}
                            {field.answer_count} answers
                          </Typography>

                          {field.answer_distribution.length === 0 ? (
                            <Typography
                              color="text.secondary"
                              sx={{ mt: 2 }}
                            >
                              No answers available.
                            </Typography>
                          ) : (
                            <Box sx={{ mt: 2, width: "100%", height: 230 }}>
                              <ResponsiveContainer
                                width="100%"
                                height="100%"
                              >
                                <BarChart
                                  data={field.answer_distribution}
                                  layout="vertical"
                                  margin={{
                                    left: 15,
                                    right: 15,
                                  }}
                                >
                                  <CartesianGrid
                                    strokeDasharray="3 3"
                                    horizontal={false}
                                  />
                                  <XAxis
                                    type="number"
                                    allowDecimals={false}
                                  />
                                  <YAxis
                                    type="category"
                                    dataKey="value"
                                    width={120}
                                    tick={{ fontSize: 11 }}
                                  />
                                  <Tooltip />
                                  <Bar
                                    dataKey="count"
                                    name="Answers"
                                    fill="#0d9488"
                                    radius={[0, 5, 5, 0]}
                                  />
                                </BarChart>
                              </ResponsiveContainer>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </>
          ) : (
            <Alert severity="info">
              Select a form to view its analytics.
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card
        elevation={0}
        sx={{ border: "1px solid #e2e8f0", borderRadius: 3 }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            Recent Submissions
          </Typography>

          {dashboard.recent_submissions.length === 0 ? (
            <Typography color="text.secondary">
              No submissions found.
            </Typography>
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Response ID</TableCell>
                    <TableCell>Form</TableCell>
                    <TableCell>Submitted By</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Submitted At</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {dashboard.recent_submissions.map((response) => (
                    <TableRow key={response.response_id}>
                      <TableCell>#{response.response_id}</TableCell>
                      <TableCell>{response.form_title}</TableCell>
                      <TableCell>{response.submitted_by}</TableCell>
                      <TableCell>{response.status}</TableCell>
                      <TableCell>
                        {new Date(
                          response.submitted_at
                        ).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
