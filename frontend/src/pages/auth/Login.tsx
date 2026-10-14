
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

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(email.trim(), password);
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      const message =
        typeof err === "object" &&
        err !== null &&
        "response" in err
          ? String(
              (err as { response?: { data?: { detail?: string } } })
                .response?.data?.detail || "Login failed. Please try again."
            )
          : err instanceof Error
            ? err.message
            : "Login failed. Please try again.";

      setError(message);
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
              Welcome back
            </Typography>
            <Typography color="text.secondary">
              Sign in to manage your dynamic forms and responses.
            </Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
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
                autoComplete="current-password"
                required
                fullWidth
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={submitting}
              >
                {submitting ? "Signing in..." : "Sign In"}
              </Button>
            </Stack>
          </Box>

          <Typography textAlign="center">
            Don't have an account?{" "}
            <Link to="/register">Create account</Link>
          </Typography>
        </Stack>
      </Paper>
    </Container>
  );
}
