import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../../../components/ui/Button";
import { PERMISSION_POS, hasPermission } from "../access";
import { authService } from "../services/authService";
import { useAuthStore } from "../hooks/useAuth";

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const session = await authService.login({ username, password });
      setSession(session);
      navigate(hasPermission(session.user, PERMISSION_POS) ? "/cash" : "/");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "No fue posible iniciar sesion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.2fr_0.8fr]">
      <section className="hidden bg-brand-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-normal text-brand-100">Sistema POS</p>
          <h1 className="max-w-xl text-5xl font-semibold leading-tight">Caja rapida, stock trazable y una base lista para crecer.</h1>
        </div>
        <div className="grid grid-cols-3 gap-6 text-sm text-brand-100">
          <div>
            <p className="text-3xl font-semibold text-white">POS</p>
            <p>Ventas rapidas con busqueda y lector.</p>
          </div>
          <div>
            <p className="text-3xl font-semibold text-white">Stock</p>
            <p>Movimientos auditables y ajustes controlados.</p>
          </div>
          <div>
            <p className="text-3xl font-semibold text-white">Base</p>
            <p>Arquitectura local preparada para multiusuario y nube.</p>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-10">
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-panel">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-slate-950">Iniciar sesion</h2>
            <p className="text-sm text-slate-500">Accede al modulo administrativo y al punto de venta.</p>
          </div>

          <div className="space-y-4">
            <label className="block space-y-2 text-sm font-medium text-slate-700">
              <span>Usuario</span>
              <input
                className="h-11 w-full rounded-md border border-slate-200 px-3"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
              />
            </label>

            <label className="block space-y-2 text-sm font-medium text-slate-700">
              <span>Contrasena</span>
              <input
                className="h-11 w-full rounded-md border border-slate-200 px-3"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
            </label>
          </div>

          {error ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? "Ingresando..." : "Entrar"}
          </Button>
        </form>
      </section>
    </main>
  );
}
