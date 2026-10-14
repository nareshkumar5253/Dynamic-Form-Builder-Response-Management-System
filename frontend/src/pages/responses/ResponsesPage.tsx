
import { useCallback, useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";
import HistoryIcon from "@mui/icons-material/History";

import { getForms } from "../../api/forms";
import type { FormItem } from "../../api/forms";

import {
  getFormResponses,
  getFormResponse,
  getResponseHistory,
} from "../../api/responses";

import type {
  FormResponseItem,
  ResponseHistoryItem,
} from "../../api/responses";

export default function ResponsesPage() {
  const [forms, setForms] = useState<FormItem[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<number | "">("");

  const [responses, setResponses] = useState<FormResponseItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [loading, setLoading] = useState(false);
  const [formsLoading, setFormsLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedResponse, setSelectedResponse] =
    useState<FormResponseItem | null>(null);

  const [history, setHistory] = useState<ResponseHistoryItem[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadForms = useCallback(async () => {
    setFormsLoading(true);
    setError("");

    try {
      const data = await getForms();
      setForms(data);

      if (data.length > 0) {
        setSelectedFormId((current) =>
          current === "" ? data[0].id : current
        );
      }
    } catch (err) {
      console.error(err);
      setError("Unable to load forms. Please check the backend.");
    } finally {
      setFormsLoading(false);
    }
  }, []);

  const loadResponses = useCallback(async () => {
    if (selectedFormId === "") {
      setResponses([]);
      setTotal(0);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await getFormResponses(selectedFormId, {
        page,
        page_size: pageSize,
        search: search.trim() || undefined,
        status_filter: statusFilter || undefined,
      });

      setResponses(result.responses);
      setTotal(result.total);
    } catch (err) {
      console.error(err);
      setResponses([]);
      setTotal(0);
      setError(
        "Unable to load responses for this form. Check the API and permissions."
      );
    } finally {
      setLoading(false);
    }
  }, [selectedFormId, page, pageSize, search, statusFilter]);

  useEffect(() => {
    void loadForms();
  }, [loadForms]);

  useEffect(() => {
    void loadResponses();
  }, [loadResponses]);

  const openResponseDetails = async (response: FormResponseItem) => {
    if (selectedFormId === "") return;

    setDetailOpen(true);
    setDetailLoading(true);
    setSelectedResponse(response);

    try {
      const result = await getFormResponse(
        selectedFormId,
        response.id
      );
      setSelectedResponse(result);
    } catch (err) {
      console.error(err);
      setError("Unable to load response details.");
    } finally {
      setDetailLoading(false);
    }
  };

  const openHistory = async (response: FormResponseItem) => {
    if (selectedFormId === "") return;

    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistory([]);

    try {
      const result = await getResponseHistory(
        selectedFormId,
        response.id
      );
      setHistory(result);
    } catch (err) {
      console.error(err);
      setError("Unable to load response history.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const formatDate = (value: string) => {
    const parsed = new Date(value);

    return Number.isNaN(parsed.getTime())
      ? value
      : parsed.toLocaleString();
  };

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined || value === "") {
      return "—";
    }

    if (typeof value === "object") {
      return JSON.stringify(value);
    }

    return String(value);
  };

  const statusColor = (
    status: string
  ): "success" | "warning" | "default" | "info" | "error" => {
    switch (status.toUpperCase()) {
      case "SUBMITTED":
        return "success";
      case "UPDATED":
        return "info";
      case "DRAFT":
        return "warning";
      case "REJECTED":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1500, mx: "auto" }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={2}
        sx={{ mb: 4 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Responses
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Review submitted responses and inspect response history.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => {
            void loadForms();
            void loadResponses();
          }}
        >
          Refresh
        </Button>
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

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Total Responses
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ mt: 1 }}>
                {total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Typography fontWeight={700} sx={{ mb: 2 }}>
                Select Form
              </Typography>

              {formsLoading ? (
                <CircularProgress size={24} />
              ) : (
                <FormControl fullWidth size="small">
                  <InputLabel id="responses-form-label">
                    Form
                  </InputLabel>

                  <Select
                    labelId="responses-form-label"
                    value={selectedFormId}
                    label="Form"
                    onChange={(event) => {
                      const value = event.target.value;
                      setSelectedFormId(
                        value === "" ? "" : Number(value)
                      );
                      setPage(1);
                    }}
                  >
                    {forms.map((form) => (
                      <MenuItem key={form.id} value={form.id}>
                        {form.title} (ID: {form.id})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {!formsLoading && forms.length === 0 && (
                <Typography color="text.secondary" variant="body2">
                  No forms are available yet.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card variant="outlined">
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Typography variant="h6" fontWeight={750} sx={{ mb: 2 }}>
            Submitted Responses
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 8 }}>
              <TextField
                fullWidth
                size="small"
                label="Search response values"
                placeholder="Enter a name, email, or response value"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="response-status-label">
                  Status
                </InputLabel>

                <Select
                  labelId="response-status-label"
                  value={statusFilter}
                  label="Status"
                  onChange={(event) => {
                    setStatusFilter(event.target.value);
                    setPage(1);
                  }}
                >
                  <MenuItem value="">All statuses</MenuItem>
                  <MenuItem value="SUBMITTED">Submitted</MenuItem>
                  <MenuItem value="UPDATED">Updated</MenuItem>
                  <MenuItem value="DRAFT">Draft</MenuItem>
                  <MenuItem value="REJECTED">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {loading ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <CircularProgress />
              <Typography color="text.secondary" sx={{ mt: 2 }}>
                Loading responses...
              </Typography>
            </Box>
          ) : responses.length === 0 ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <Typography variant="h6" fontWeight={700}>
                No responses found
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Submitted responses for the selected form will appear here.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <Box sx={{ minWidth: 750 }}>
                <Grid
                  container
                  spacing={1}
                  sx={{
                    px: 1,
                    py: 1.5,
                    bgcolor: "action.hover",
                    borderRadius: 1,
                    mb: 1,
                  }}
                >
                  <Grid size={1.5}>
                    <Typography fontWeight={700} variant="body2">
                      Response ID
                    </Typography>
                  </Grid>

                  <Grid size={2}>
                    <Typography fontWeight={700} variant="body2">
                      Submitted By
                    </Typography>
                  </Grid>

                  <Grid size={2}>
                    <Typography fontWeight={700} variant="body2">
                      Status
                    </Typography>
                  </Grid>

                  <Grid size={3}>
                    <Typography fontWeight={700} variant="body2">
                      Submitted At
                    </Typography>
                  </Grid>

                  <Grid size={3.5}>
                    <Typography fontWeight={700} variant="body2">
                      Actions
                    </Typography>
                  </Grid>
                </Grid>

                {responses.map((response) => (
                  <Box key={response.id}>
                    <Grid
                      container
                      spacing={1}
                      alignItems="center"
                      sx={{ px: 1, py: 1.5 }}
                    >
                      <Grid size={1.5}>
                        <Typography fontWeight={700}>
                          #{response.id}
                        </Typography>
                      </Grid>

                      <Grid size={2}>
                        <Typography variant="body2">
                          {response.submitted_by ?? "Unknown"}
                        </Typography>
                      </Grid>

                      <Grid size={2}>
                        <Chip
                          size="small"
                          label={response.status}
                          color={statusColor(response.status)}
                        />
                      </Grid>

                      <Grid size={3}>
                        <Typography variant="body2">
                          {formatDate(response.submitted_at)}
                        </Typography>
                      </Grid>

                      <Grid size={3.5}>
                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<VisibilityIcon />}
                            onClick={() => void openResponseDetails(response)}
                          >
                            View
                          </Button>

                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<HistoryIcon />}
                            onClick={() => void openHistory(response)}
                          >
                            History
                          </Button>
                        </Stack>
                      </Grid>
                    </Grid>

                    <Divider />
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mt: 3 }}
            spacing={2}
          >
            <Typography variant="body2" color="text.secondary">
              {total === 0
                ? "No results"
                : `Showing ${(page - 1) * pageSize + 1}–${Math.min(
                    page * pageSize,
                    total
                  )} of ${total}`}
            </Typography>

            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => current - 1)}
              >
                Previous
              </Button>

              <Button
                variant="outlined"
                disabled={loading || page * pageSize >= total}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Response details */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Response Details
          {selectedResponse && ` — #${selectedResponse.id}`}
        </DialogTitle>

        <DialogContent dividers>
          {detailLoading ? (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <CircularProgress />
            </Box>
          ) : selectedResponse ? (
            <Stack spacing={2}>
              <Typography>
                <strong>Form ID:</strong> {selectedResponse.form_id}
              </Typography>

              <Typography>
                <strong>Submitted By:</strong>{" "}
                {selectedResponse.submitted_by ?? "Unknown"}
              </Typography>

              <Typography>
                <strong>Status:</strong> {selectedResponse.status}
              </Typography>

              <Typography>
                <strong>Submitted At:</strong>{" "}
                {formatDate(selectedResponse.submitted_at)}
              </Typography>

              <Divider />

              <Typography variant="h6" fontWeight={700}>
                Field Values
              </Typography>

              {selectedResponse.details.length === 0 ? (
                <Typography color="text.secondary">
                  No field values are available.
                </Typography>
              ) : (
                selectedResponse.details.map((detail) => (
                  <Card key={detail.id} variant="outlined">
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        Field ID: {detail.field_id}
                      </Typography>

                      <Typography sx={{ mt: 1, overflowWrap: "anywhere" }}>
                        {formatValue(detail.value)}
                      </Typography>
                    </CardContent>
                  </Card>
                ))
              )}
            </Stack>
          ) : null}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Response history */}
      <Dialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Response History
          {selectedResponse && ` — #${selectedResponse.id}`}
        </DialogTitle>

        <DialogContent dividers>
          {historyLoading ? (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <CircularProgress />
            </Box>
          ) : history.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 3 }}>
              No history records found for this response.
            </Typography>
          ) : (
            <Stack spacing={2}>
              {history.map((item) => (
                <Card key={item.id} variant="outlined">
                  <CardContent>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      flexWrap="wrap"
                      gap={1}
                    >
                      <Chip
                        size="small"
                        label={item.action}
                        color="info"
                      />

                      <Typography variant="body2" color="text.secondary">
                        {formatDate(item.changed_at)}
                      </Typography>
                    </Stack>

                    <Typography sx={{ mt: 2 }}>
                      <strong>Field ID:</strong> {item.field_id}
                    </Typography>

                    <Typography sx={{ mt: 1, overflowWrap: "anywhere" }}>
                      <strong>Old value:</strong>{" "}
                      {formatValue(item.old_value)}
                    </Typography>

                    <Typography sx={{ mt: 1, overflowWrap: "anywhere" }}>
                      <strong>New value:</strong>{" "}
                      {formatValue(item.new_value)}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      Changed by: {item.changed_by ?? "Unknown"}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setHistoryOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
