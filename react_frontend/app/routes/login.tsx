import { Form, isRouteErrorResponse, redirect } from "react-router";
import type { Route } from "./+types/login";
import {
  apiBaseUrl,
  commitSession,
  getSession,
  redirectAuthenticatedUser,
} from "../auth.server";
import "../login.css";

type LoginActionResult = {
  error?: string;
};

function safeRedirectTo(value: FormDataEntryValue | string | null) {
  if (typeof value !== "string" || !value.startsWith("/")) return "/";

  const destination = new URL(value, "http://localhost");
  if (destination.origin !== "http://localhost") return "/";
  return `${destination.pathname}${destination.search}${destination.hash}`;
}

export async function loader({ request }: Route.LoaderArgs) {
  await redirectAuthenticatedUser(request);
  const url = new URL(request.url);
  return { redirectTo: safeRedirectTo(url.searchParams.get("redirectTo")) };
}

export async function action({ request }: Route.ActionArgs): Promise<LoginActionResult | Response> {
  const formData = await request.formData();
  const username = formData.get("username");
  const password = formData.get("password");

  if (typeof username !== "string" || !username.trim() || typeof password !== "string" || !password) {
    return { error: "Introduce tu usuario y contraseña." };
  }

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}/api/auth/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim(), password }),
    });
  } catch {
    return { error: "No se pudo conectar con el servicio de autenticación." };
  }

  if (!response.ok) return { error: "El usuario o la contraseña no son válidos." };

  const payload = (await response.json()) as { token?: string };
  if (!payload.token) return { error: "El servicio de autenticación devolvió una respuesta no válida." };

  const session = await getSession(request.headers.get("Cookie"));
  session.set("token", payload.token);
  return redirect(safeRedirectTo(formData.get("redirectTo")), {
    headers: { "Set-Cookie": await commitSession(session) },
  });
}

export function meta() {
  return [{ title: "Iniciar sesión | Phishers Monitor" }];
}

export default function LoginPage({ loaderData, actionData }: Route.ComponentProps) {
  return (
    <main className="login-page">
      <section className="login-panel" aria-labelledby="login-title">
        <a className="login-brand" href="/" aria-label="Phishers Monitor">
          <span className="login-brand-mark" aria-hidden="true">PM</span>
          <span>Phishers Monitor</span>
        </a>
        <p className="login-eyebrow">ACCESO SEGURO</p>
        <h1 id="login-title">Iniciar sesión</h1>
        <p className="login-description">Accede a los perfiles y archivos monitorizados.</p>

        <Form className="login-form" method="post">
          <input type="hidden" name="redirectTo" value={loaderData.redirectTo} />
          <label htmlFor="username">Usuario</label>
          <input
            autoComplete="username"
            autoFocus
            id="username"
            name="username"
            required
          />
          <label htmlFor="password">Contraseña</label>
          <input
            autoComplete="current-password"
            id="password"
            name="password"
            required
            type="password"
          />
          {actionData?.error && <p className="login-error" role="alert">{actionData.error}</p>}
          <button type="submit">Entrar <span aria-hidden="true">→</span></button>
        </Form>
      </section>
      <p className="login-footer">Phishers Monitor <span>·</span> Entorno privado</p>
    </main>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const message = isRouteErrorResponse(error)
    ? `${error.status}: ${error.statusText}`
    : "No se pudo abrir la página de acceso.";

  return (
    <main className="login-page">
      <section className="login-panel" role="alert">
        <h1>Acceso no disponible</h1>
        <p>{message}</p>
      </section>
    </main>
  );
}