import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ApiError } from "../api/client";
import AlertBanner from "../components/ui/AlertBanner";
import GrainOverlay from "../components/ui/GrainOverlay";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
      navigate("/dashboard");
    } catch (err) {
      // Generic message on purpose — never leak which field was wrong.
      if (err instanceof ApiError && err.status === 401) {
        setError("Credenciales inválidas");
      } else {
        setError("Credenciales inválidas");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
      <GrainOverlay />

      <div className="relative w-full max-w-md overflow-hidden rounded-[20px] border border-[var(--color-hairline-dark)] bg-[var(--color-surface-elevated)] p-8">
        {/* Gradient sheen overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: "var(--gradient-surface)" }}
        />
        {/* Red top accent bar */}
        <div
          aria-hidden="true"
          className="absolute left-0 top-0 h-[3px] w-full bg-[var(--color-red)]"
        />

        <div className="relative">
          {/* Brand */}
          <div className="mb-8 flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 rounded-full bg-[var(--color-red)]"
            />
            <h1 className="text-xl font-medium tracking-tight text-[var(--color-ink-on-dark)]">
              LUBRICENTRO
              <span className="text-[var(--color-red)]">G&amp;G</span>
            </h1>
          </div>

          <h2 className="text-2xl font-medium tracking-tight text-[var(--color-ink-on-dark)]">
            Iniciar sesión
          </h2>
          <p className="mt-1 text-sm text-[var(--color-dim-on-dark)]">
            Ingresá tus credenciales para continuar
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="username"
                className="mb-1.5 block text-sm text-[var(--color-mute-on-dark)]"
              >
                Usuario
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                placeholder="usuario"
                className="w-full rounded-[12px] border border-[var(--color-hairline-dark)] bg-[var(--color-surface-deep)] px-4 py-2.5 text-sm text-[var(--color-ink-on-dark)] placeholder:text-[var(--color-faint-on-dark)] focus:border-[var(--color-red)] focus:outline-none focus:ring-1 focus:ring-[var(--color-red)]"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm text-[var(--color-mute-on-dark)]"
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-[12px] border border-[var(--color-hairline-dark)] bg-[var(--color-surface-deep)] px-4 py-2.5 text-sm text-[var(--color-ink-on-dark)] placeholder:text-[var(--color-faint-on-dark)] focus:border-[var(--color-red)] focus:outline-none focus:ring-1 focus:ring-[var(--color-red)]"
              />
            </div>

            {error && <AlertBanner message={error} variant="error" />}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full px-7 py-3 text-sm font-semibold text-[var(--color-ink-on-dark)] transition-all duration-200 bg-[var(--color-red)] hover:brightness-110 hover:shadow-[0_0_20px_color-mix(in_srgb,var(--color-red)_40%,transparent)] active:scale-[0.98] disabled:opacity-50 disabled:hover:shadow-none"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
