
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  createForm,
  deleteForm,
  disableForm,
  enableForm,
  getForms,
  updateForm,
  type FormItem,
} from "../../api/forms";

interface FormValues {
  title: string;
  description: string;
  is_public: boolean;
}

const emptyForm: FormValues = {
  title: "",
  description: "",
  is_public: false,
};

export default function FormsPage() {
  const [forms, setForms] = useState<FormItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<FormItem | null>(null);
  const [values, setValues] = useState<FormValues>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<FormItem | null>(null);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const notify = (message: string, severity: "success" | "error" = "success") => {
    setNotification({ open: true, message, severity });
  };

  async function loadForms() {
    setLoading(true);
    try {
      const data = await getForms();
      setForms(data);
    } catch {
      notify("Could not load forms. Please check your login and backend.", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadForms();
  }, []);

  const filteredForms = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return forms;

    return forms.filter(
      (form) =>
        form.title.toLowerCase().includes(term) ||
        (form.description ?? "").toLowerCase().includes(term),
    );
  }, [forms, search]);

  function openCreateDialog() {
    setEditingForm(null);
    setValues(emptyForm);
    setDialogOpen(true);
  }

  function openEditDialog(form: FormItem) {
    setEditingForm(form);
    setValues({
      title: form.title,
      description: form.description ?? "",
      is_public: form.is_public,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (values.title.trim().length < 2) {
      notify("Form title must contain at least 2 characters.", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: values.title.trim(),
        description: values.description.trim() || null,
        is_public: values.is_public,
      };

      if (editingForm) {
        await updateForm(editingForm.id, payload);
        notify("Form updated successfully.");
      } else {
        await createForm(payload);
        notify("Form created successfully.");
      }

      setDialogOpen(false);
      await loadForms();
    } catch (error: any) {
      notify(
        error?.response?.data?.detail ?? "Unable to save the form.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(form: FormItem) {
    try {
      if (form.is_enabled) {
        await disableForm(form.id);
        notify(`"${form.title}" has been disabled.`);
      } else {
        await enableForm(form.id);
        notify(`"${form.title}" has been enabled.`);
      }
      await loadForms();
    } catch (error: any) {
      notify(
        error?.response?.data?.detail ?? "Unable to change form status.",
        "error",
      );
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    try {
      await deleteForm(deleteTarget.id);
      setDeleteTarget(null);
      notify("Form deleted successfully.");
      await loadForms();
    } catch (error: any) {
      notify(
        error?.response?.data?.detail ??
          "Unable to delete this form. Your account may require administrator permission.",
        "error",
      );
    }
  }

  const activeCount = forms.filter((form) => form.is_enabled).length;
  const disabledCount = forms.length - activeCount;

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto", p: { xs: 2, md: 4 } }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={2}
        sx={{ mb: 4 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Form Management
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Create, organize, and manage your dynamic forms.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreateDialog}
          sx={{ alignSelf: { xs: "flex-start", sm: "auto" }, py: 1.2 }}
        >
          Create Form
        </Button>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(3, minmax(0, 1fr))",
          },
          gap: 2,
          mb: 4,
        }}
      >
        {[
          { label: "Total Forms", value: forms.length },
          { label: "Active Forms", value: activeCount },
          { label: "Disabled Forms", value: disabledCount },
        ].map((item) => (
          <Paper key={item.label} variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
            <Typography color="text.secondary" variant="body2">
              {item.label}
            </Typography>
            <Typography variant="h4" fontWeight={800} sx={{ mt: 1 }}>
              {item.value}
            </Typography>
          </Paper>
        ))}
      </Box>

      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Typography variant="h6" fontWeight={700}>
            Your Forms
          </Typography>

          <TextField
            size="small"
            placeholder="Search forms..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            slotProps={{
              input: {
                startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />,
              },
            }}
            sx={{ width: { xs: "100%", sm: 300 } }}
          />
        </Stack>

        {loading ? (
          <Box sx={{ display: "grid", placeItems: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : filteredForms.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Typography variant="h6" fontWeight={700}>
              {search ? "No matching forms found" : "No forms created yet"}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
              {search
                ? "Try another search term."
                : "Create your first form to get started."}
            </Typography>
            {!search && (
              <Button variant="contained" onClick={openCreateDialog} startIcon={<AddIcon />}>
                Create your first form
              </Button>
            )}
          </Box>
        ) : (
          <Stack spacing={2}>
            {filteredForms.map((form) => (
              <Paper
                key={form.id}
                variant="outlined"
                sx={{
                  p: 2.5,
                  borderRadius: 2.5,
                  transition: "border-color 0.2s",
                  "&:hover": { borderColor: "primary.main" },
                }}
              >
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  justifyContent="space-between"
                  alignItems={{ xs: "stretch", md: "center" }}
                  spacing={2}
                >
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      flexWrap="wrap"
                      useFlexGap
                    >
                      <Typography variant="subtitle1" fontWeight={700}>
                        {form.title}
                      </Typography>
                      <Chip
                        size="small"
                        label={form.is_enabled ? "Active" : "Disabled"}
                        color={form.is_enabled ? "success" : "default"}
                      />
                      <Chip
                        size="small"
                        variant="outlined"
                        label={form.is_public ? "Public" : "Private"}
                      />
                    </Stack>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1, overflowWrap: "anywhere" }}
                    >
                      {form.description || "No description provided."}
                    </Typography>

                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
                      Form ID: {form.id} · Created:{" "}
                      {new Date(form.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>

                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent={{ xs: "flex-start", md: "flex-end" }}
                    spacing={0.5}
                  >
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Switch
                        checked={form.is_enabled}
                        onChange={() => void handleToggle(form)}
                        inputProps={{ "aria-label": `Toggle ${form.title}` }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {form.is_enabled ? "Enabled" : "Disabled"}
                      </Typography>
                    </Stack>

                    <IconButton
                      aria-label={`Edit ${form.title}`}
                      color="primary"
                      onClick={() => openEditDialog(form)}
                    >
                      <EditOutlinedIcon />
                    </IconButton>

                    <IconButton
                      aria-label={`Delete ${form.title}`}
                      color="error"
                      onClick={() => setDeleteTarget(form)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>

      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle fontWeight={800}>
          {editingForm ? "Edit Form" : "Create New Form"}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <TextField
              label="Form Title"
              required
              fullWidth
              value={values.title}
              onChange={(event) =>
                setValues((previous) => ({ ...previous, title: event.target.value }))
              }
              inputProps={{ maxLength: 200 }}
            />

            <TextField
              label="Description"
              fullWidth
              multiline
              minRows={3}
              value={values.description}
              onChange={(event) =>
                setValues((previous) => ({
                  ...previous,
                  description: event.target.value,
                }))
              }
              placeholder="Describe the purpose of this form..."
            />

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box sx={{ pr: 2 }}>
                  <Typography fontWeight={700}>Public Form</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {values.is_public
                      ? "Public access is enabled."
                      : "Keep this form private."}
                  </Typography>
                </Box>
                <Switch
                  checked={values.is_public}
                  onChange={(event) =>
                    setValues((previous) => ({
                      ...previous,
                      is_public: event.target.checked,
                    }))
                  }
                  inputProps={{ "aria-label": "Public form" }}
                />
              </Stack>
            </Paper>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Saving..." : editingForm ? "Save Changes" : "Create Form"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle fontWeight={800}>Delete Form?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Are you sure you want to delete{" "}
            <strong>{deleteTarget?.title}</strong>? This action may also remove
            related data and cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => void handleDelete()}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification((previous) => ({ ...previous, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={notification.severity}
          variant="filled"
          onClose={() => setNotification((previous) => ({ ...previous, open: false }))}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
