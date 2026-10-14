
import { useState, type FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password.length > 72) {
      setError("Password cannot exceed 72 characters.");
      return;
    }

    setSubmitting(true);

    try {
      await register(name.trim(), email.trim(), password);
      navigate("/login", {
        replace: true,
        state: { message: "Account created successfully. Please sign in." },
      });
    } catch (err: unknown) {
      const responseError =
        typeof err === "object" && err !== null && "response" in err
          ? String(
              (err as { response?: { data?: { detail?: unknown } } })
                .response?.data?.detail || "Registration failed."
            )
          : "";

      setError(
        responseError ||
          (err instanceof Error
            ? err.message
            : "Registration failed. Please try again.")
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={4} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 4 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" fontWeight={800} gutterBottom>
              Create your account
            </Typography>
            <Typography color="text.secondary">
              Get started with the Dynamic Form Builder.
            </Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              <TextField
                label="Full name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                inputProps={{ minLength: 2, maxLength: 100 }}
                required
                fullWidth
              />

              <TextField
                label="Email address"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                fullWidth
              />

              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                inputProps={{ minLength: 8, maxLength: 72 }}
                helperText="Use 8–72 characters."
                required
                fullWidth
              />

              <TextField
                label="Confirm password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                required
                fullWidth
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={submitting}
              >
                {submitting ? "Creating account..." : "Create Account"}
              </Button>
            </Stack>
          </Box>

          <Typography textAlign="center">
            Already registered? <Link to="/login">Sign in</Link>
          </Typography>
        </Stack>
      </Paper>
    </Container>
  );
}
