import { createColumnHelper, tableFeatures, useTable } from "@tanstack/react-table";
import { isRouteErrorResponse, Link, useRevalidator } from "react-router";
import type { Route } from "./+types/users";
import { apiBaseUrl, fetchApi } from "../auth.server";
import { SidebarNavigation } from "../components/sidebar-navigation";
import "../monitored-users.css";

type DjangoUser = {
  url: string;
  username: string;
  email: string;
  groups: string[];
};

type DjangoUsersResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: DjangoUser[];
};

const features = tableFeatures({});
const columnHelper = createColumnHelper<typeof features, DjangoUser>();
const columns = columnHelper.columns([
  columnHelper.accessor("username", { header: "Usuario" }),
  columnHelper.accessor("email", { header: "Correo electrónico" }),
  columnHelper.accessor("groups", {
    header: "Grupos",
    cell: ({ getValue }) => {
      const count = getValue().length;
      return count === 0 ? "Sin grupos" : `${count} ${count === 1 ? "grupo" : "grupos"}`;
    },
  }),
]);

export async function loader({ request }: Route.LoaderArgs) {
  const requestUrl = new URL(request.url);
  const requestedPage = Number.parseInt(requestUrl.searchParams.get("page") ?? "1", 10);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const apiUrl = new URL(`${apiBaseUrl}/api/users/`);

  if (page > 1) {
    apiUrl.searchParams.set("page", String(page));
  }

  const response = await fetchApi(request, apiUrl);

  if (!response.ok) {
    throw new Response("No se pudo cargar la lista de usuarios de Django REST.", {
      status: response.status,
    });
  }

  const data = (await response.json()) as DjangoUsersResponse;

  return {
    users: data.results,
    count: data.count,
    page,
    hasNext: Boolean(data.next),
    hasPrevious: Boolean(data.previous),
  };
}

export function meta() {
  return [{ title: "Usuarios de Django | Phishers Monitor" }];
}

export default function UsersPage({ loaderData }: Route.ComponentProps) {
  const revalidator = useRevalidator();
  const { users, count, page, hasNext, hasPrevious } = loaderData;
  const table = useTable({
    features,
    columns,
    data: users,
    getRowId: (user) => user.url,
  });

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
        <p className="eyebrow">VISTA GENERAL <span> / </span> DJANGO</p>
        <div className="intro-row">
          <div>
            <h1 id="page-title">Usuarios de Django</h1>
            <p className="intro-copy">Cuentas registradas y grupos asignados.</p>
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
            <h2 id="users-heading">Cuentas</h2>
            <p>Registros devueltos por UserViewSet</p>
          </div>
          <span className="count-badge">{count} {count === 1 ? "usuario" : "usuarios"}</span>
        </div>

        <div className="table-frame">
          <table>
            <caption className="visually-hidden">Usuarios de Django y sus grupos</caption>
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} scope="col">
                      {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getAllCells().map((cell) => (
                    <td key={cell.id}>
                      {cell.column.id === "username" && <span className="user-dot" aria-hidden="true" />}
                      <table.FlexRender cell={cell} />
                    </td>
                  ))}
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td className="empty-state" colSpan={columns.length}>No hay usuarios registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <nav className="pagination" aria-label="Paginación de usuarios">
          <span>Página {page}</span>
          <div className="pagination-actions">
            {hasPrevious ? (
              <Link className="page-link" to={`/users?page=${page - 1}`}>Anterior</Link>
            ) : (
              <span className="page-link is-disabled" aria-disabled="true">Anterior</span>
            )}
            {hasNext ? (
              <Link className="page-link page-link-next" to={`/users?page=${page + 1}`}>Siguiente</Link>
            ) : (
              <span className="page-link page-link-next is-disabled" aria-disabled="true">Siguiente</span>
            )}
          </div>
        </nav>
      </section>

      <footer className="page-footer">Fuente de datos <code>/api/users/</code></footer>
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
        <Link className="page-link page-link-next" to="/users">Volver a intentar</Link>
      </section>
    </main>
  );
}
