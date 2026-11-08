import { isRouteErrorResponse, Link, useRevalidator } from "react-router";
import type { Route } from "./+types/monitored-users";
import { apiBaseUrl, fetchApi } from "../auth.server";
import { SidebarNavigation } from "../components/sidebar-navigation";
import "../monitored-users.css";

type MonitoredUser = {
  username: string;
  user_data: string;
};

type MonitoredUsersResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: MonitoredUser[];
};

export async function loader({ request }: Route.LoaderArgs) {
  const requestUrl = new URL(request.url);
  const requestedPage = Number.parseInt(requestUrl.searchParams.get("page") ?? "1", 10);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const apiUrl = new URL(`${apiBaseUrl}/phishers/monitored_users/`);

  if (page > 1) {
    apiUrl.searchParams.set("page", String(page));
  }

  const response = await fetchApi(request, apiUrl);

  if (!response.ok) {
    throw new Response("No se pudo cargar la lista desde Django REST.", {
      status: response.status,
    });
  }

  const data = (await response.json()) as MonitoredUsersResponse;

  return {
    users: data.results,
    count: data.count,
    page,
    hasNext: Boolean(data.next),
    hasPrevious: Boolean(data.previous),
  };
}

export function meta() {
  return [{ title: "Usuarios monitorizados | Phishers Monitor" }];
}

export default function MonitoredUsersPage({ loaderData }: Route.ComponentProps) {
  const revalidator = useRevalidator();
  const { users, count, page, hasNext, hasPrevious } = loaderData;

  return (
    <main className="monitor-page">
      <header className="page-header">
        <SidebarNavigation />
        <a className="brand" href="/" aria-label="Phishers Monitor, inicio">
          <span className="brand-mark" aria-hidden="true">PM</span>
          <span>Phishers Monitor</span>
        </a>
        <span className="connection-state"><span aria-hidden="true" /> Django REST</span>
      </header>

      <section className="page-intro" aria-labelledby="page-title">
        <p className="eyebrow">VISTA GENERAL <span> / </span> USUARIOS</p>
        <div className="intro-row">
          <div>
            <h1 id="page-title">Usuarios monitorizados</h1>
            <p className="intro-copy">Perfiles y datos disponibles para revisión.</p>
          </div>
          <button
            className="refresh-button"
            type="button"
            onClick={() => revalidator.revalidate()}
            disabled={revalidator.state === "loading"}
          >
            {revalidator.state === "loading" ? "Actualizando..." : "Actualizar lista"}
          </button>
        </div>
      </section>

      <section className="users-section" aria-labelledby="users-heading">
        <div className="section-heading">
          <div>
            <h2 id="users-heading">Perfiles</h2>
            <p>Registros devueltos por la API</p>
          </div>
          <span className="count-badge">{count} {count === 1 ? "usuario" : "usuarios"}</span>
        </div>

        <div className="table-frame">
          <table>
            <caption className="visually-hidden">Usuarios monitorizados y sus archivos de datos</caption>
            <thead>
              <tr>
                <th scope="col">Usuario</th>
                <th scope="col">Datos</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.username}>
                  <th scope="row"><span className="user-dot" aria-hidden="true" />{user.username}</th>
                  <td>
                    <a className="data-link" href={user.user_data} target="_blank" rel="noreferrer">
                      Abrir JSON
                    </a>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td className="empty-state" colSpan={2}>No hay usuarios monitorizados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <nav className="pagination" aria-label="Paginación de usuarios">
          <span>Página {page}</span>
          <div className="pagination-actions">
            {hasPrevious ? (
              <Link className="page-link" to={`/?page=${page - 1}`}>Anterior</Link>
            ) : (
              <span className="page-link is-disabled" aria-disabled="true">Anterior</span>
            )}
            {hasNext ? (
              <Link className="page-link page-link-next" to={`/?page=${page + 1}`}>Siguiente</Link>
            ) : (
              <span className="page-link page-link-next is-disabled" aria-disabled="true">Siguiente</span>
            )}
          </div>
        </nav>
      </section>

      <footer className="page-footer">Fuente de datos <code>/phishers/monitored_users/</code></footer>
    </main>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const description = isRouteErrorResponse(error)
    ? `${error.status}: ${error.data || error.statusText}`
    : error instanceof Error
      ? error.message
      : "Error inesperado al consultar Django REST.";

  return (
    <main className="monitor-page error-page">
      <a className="brand" href="/">
        <span className="brand-mark" aria-hidden="true">PM</span>
        <span>Phishers Monitor</span>
      </a>
      <section className="error-message" role="alert">
        <p className="eyebrow">NO SE PUDO CARGAR</p>
        <h1>La lista no está disponible</h1>
        <p>{description}</p>
        <Link className="page-link page-link-next" to="/">Volver a intentar</Link>
      </section>
    </main>
  );
}