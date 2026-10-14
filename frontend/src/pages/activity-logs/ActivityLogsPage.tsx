
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import {
  getActivityLogs,
  type ActivityLog,
  type ActivityLogsResponse,
} from "../../api/activityLogs";

const PAGE_SIZE = 10;

export default function ActivityLogsPage() {
  const [result, setResult] = useState<ActivityLogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [userId, setUserId] = useState("");
  const [page, setPage] = useState(1);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getActivityLogs({
        action: action.trim() || undefined,
        entity_type: entityType || undefined,
        user_id: userId.trim() ? Number(userId) : undefined,
        page,
        page_size: PAGE_SIZE,
      });

      setResult(data);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? String(
              (err as { response?: { data?: { detail?: string } } })
                .response?.data?.detail || "Unable to load activity logs."
            )
          : "Unable to load activity logs. Please try again.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }, [action, entityType, userId, page]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const resetFilters = () => {
    setAction("");
    setEntityType("");
    setUserId("");
    setPage(1);
  };

  const formatDate = (value: string) => {
    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleString();
  };

  const getActionColor = (
    value: string
  ): "success" | "error" | "warning" | "info" | "default" => {
    const normalized = value.toLowerCase();

    if (
      normalized.includes("delete") ||
      normalized.includes("remove")
    ) {
      return "error";
    }

    if (
      normalized.includes("create") ||
      normalized.includes("submit") ||
      normalized.includes("login")
    ) {
      return "success";
    }

    if (
      normalized.includes("update") ||
      normalized.includes("edit")
    ) {
      return "warning";
    }

    if (
      normalized.includes("disable") ||
      normalized.includes("logout")
    ) {
      return "default";
    }

    return "info";
  };

  const logs: ActivityLog[] = result?.logs ?? [];

  return (
    <Box sx={{ width: "100%" }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Activity Logs
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Monitor user actions and changes across your forms and responses.
          </Typography>
        </Box>

        <Button
          variant="contained"
          onClick={() => void loadLogs()}
          disabled={loading}
        >
          Refresh
        </Button>
      </Stack>

      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            Activity Overview
          </Typography>

          <Typography variant="h3" fontWeight={800} color="primary">
            {loading && result === null ? "—" : result?.total ?? 0}
          </Typography>

          <Typography color="text.secondary">
            Total matching activity records
          </Typography>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            Filter Activity
          </Typography>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ md: "center" }}
          >
            <TextField
              label="Search action"
              placeholder="e.g. create, update, submit"
              value={action}
              onChange={(event) => {
                setAction(event.target.value);
                setPage(1);
              }}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel id="entity-type-label">
                Entity Type
              </InputLabel>

              <Select
                labelId="entity-type-label"
                value={entityType}
                label="Entity Type"
                onChange={(event) => {
                  setEntityType(event.target.value);
                  setPage(1);
                }}
              >
                <MenuItem value="">All entities</MenuItem>
                <MenuItem value="form">Form</MenuItem>
                <MenuItem value="field">Field</MenuItem>
                <MenuItem value="response">Response</MenuItem>
                <MenuItem value="user">User</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="User ID"
              type="number"
              value={userId}
              inputProps={{ min: 1 }}
              onChange={(event) => {
                setUserId(event.target.value);
                setPage(1);
              }}
              fullWidth
            />

            <Button
              variant="outlined"
              onClick={resetFilters}
              sx={{ minWidth: 120 }}
            >
              Clear Filters
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            Activity History
          </Typography>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : logs.length === 0 ? (
            <Alert severity="info">
              No activity logs found. Try clearing the filters.
            </Alert>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>ID</strong></TableCell>
                      <TableCell><strong>Action</strong></TableCell>
                      <TableCell><strong>Entity</strong></TableCell>
                      <TableCell><strong>User ID</strong></TableCell>
                      <TableCell><strong>Description</strong></TableCell>
                      <TableCell><strong>Date &amp; Time</strong></TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id} hover>
                        <TableCell>#{log.id}</TableCell>

                        <TableCell>
                          <Chip
                            label={log.action}
                            color={getActionColor(log.action)}
                            size="small"
                          />
                        </TableCell>

                        <TableCell>
                          <Typography fontWeight={600}>
                            {log.entity_type}
                          </Typography>

                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {log.entity_id != null
                              ? `ID: ${log.entity_id}`
                              : "No entity ID"}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          {log.user_id ?? "System"}
                        </TableCell>

                        <TableCell sx={{ minWidth: 220, maxWidth: 360 }}>
                          <Typography variant="body2">
                            {log.description || "No description"}
                          </Typography>
                        </TableCell>

                        <TableCell sx={{ minWidth: 180 }}>
                          {formatDate(log.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems="center"
                spacing={2}
                sx={{ mt: 3 }}
              >
                <Typography variant="body2" color="text.secondary">
                  Page {result?.page ?? 1} of {result?.total_pages ?? 1}
                  {" · "}
                  {result?.total ?? 0} records
                </Typography>

                <Pagination
                  count={Math.max(result?.total_pages ?? 0, 1)}
                  page={page}
                  onChange={(_, nextPage) => setPage(nextPage)}
                  color="primary"
                  disabled={loading}
                />
              </Stack>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
