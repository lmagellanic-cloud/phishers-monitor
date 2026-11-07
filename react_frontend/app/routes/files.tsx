import { useEffect, useRef, useState } from "react";
import { isRouteErrorResponse, Link, useFetcher, useRevalidator } from "react-router";
import type { Route } from "./+types/files";
import "../files.css";

type StoredFile = {
  name: string;
  path: string;
  size: number;
  modified: string;
};

type StoredFolder = {
  name: string;
  path: string;
};

type FilesResponse = {
  path: string;
  folders: StoredFolder[];
  files: StoredFile[];
};

type FileActionResult = {
  intent?: string;
  message?: string;
  error?: string;
};

const apiBaseUrl = (process.env.DJANGO_API_TARGET ?? "http://localhost:8080").replace(
  /\/+$/,
  "",
);
const filesApiUrl = `${apiBaseUrl}/phishers/files/`;

function encodeStoragePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

async function responseError(response: Response) {
  try {
    const body = (await response.json()) as { detail?: string };
    return body.detail || `Error ${response.status}`;
  } catch {
    return `Error ${response.status}`;
  }
}

export async function loader({ request }: Route.LoaderArgs) {
  const requestedPath = new URL(request.url).searchParams.get("path") ?? "";
  const apiUrl = new URL(filesApiUrl);
  if (requestedPath) apiUrl.searchParams.set("path", requestedPath);

  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Response("No se pudieron cargar los archivos desde Django REST.", {
      status: response.status,
    });
  }

  return {
    ...(await response.json()) as FilesResponse,
    downloadBaseUrl: apiBaseUrl,
  };
}

export async function action({ request }: Route.ActionArgs): Promise<FileActionResult> {
  const formData = await request.formData();
  const intent = formData.get("intent");

  try {
    if (intent === "upload") {
      const uploads = formData.getAll("files").filter((file) => typeof file !== "string");
      if (uploads.length === 0) {
        return { intent, error: "Selecciona al menos un archivo para subir." };
      }

      const path = formData.get("path");
      for (const file of uploads) {
        const uploadData = new FormData();
        uploadData.append("file", file, file.name);
        if (typeof path === "string") uploadData.append("path", path);
        const response = await fetch(filesApiUrl, { method: "POST", body: uploadData });
        if (!response.ok) return { intent, error: await responseError(response) };
      }

      return {
        intent,
        message: uploads.length === 1
          ? `Se ha subido ${uploads[0].name}.`
          : `Se han subido ${uploads.length} archivos.`,
      };
    }

    if (intent === "create-folder") {
      const folderName = formData.get("folderName");
      const path = formData.get("path");
      const folderData = new FormData();
      if (typeof folderName === "string") folderData.set("name", folderName);
      if (typeof path === "string") folderData.set("path", path);

      const response = await fetch(`${filesApiUrl}folders/`, {
        method: "POST",
        body: folderData,
      });
      if (!response.ok) return { intent, error: await responseError(response) };
      return { intent, message: `Se ha creado la carpeta ${String(folderName)}.` };
    }

    if (intent === "delete") {
      const filename = formData.get("filename");
      if (typeof filename !== "string" || !filename) {
        return { intent, error: "No se indicó qué archivo eliminar." };
      }

      const response = await fetch(`${filesApiUrl}${encodeStoragePath(filename)}/`, {
        method: "DELETE",
      });
      if (!response.ok) return { intent, error: await responseError(response) };
      return { intent, message: `Se ha eliminado ${filename}.` };
    }

    return { error: "La acción solicitada no es válida." };
  } catch (error) {
    return {
      intent: typeof intent === "string" ? intent : undefined,
      error: error instanceof Error ? error.message : "No se pudo completar la operación.",
    };
  }
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let size = bytes / 1024;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size < 10 ? 1 : 0)} ${units[unitIndex]}`;
}

export function meta() {
  return [{ title: "Archivos | Phishers Monitor" }];
}

export default function FilesPage({ loaderData }: Route.ComponentProps) {
  const { path, folders, files, downloadBaseUrl } = loaderData;
  const fetcher = useFetcher<FileActionResult>();
  const revalidator = useRevalidator();
  const fileInput = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [dragging, setDragging] = useState(false);
  const [folderFormOpen, setFolderFormOpen] = useState(false);
  const busy = fetcher.state !== "idle";
  const totalBytes = files.reduce((total, file) => total + file.size, 0);
  const searchTerm = search.trim().toLocaleLowerCase();
  const visibleFolders = folders.filter((folder) =>
    folder.name.toLocaleLowerCase().includes(searchTerm),
  );
  const visibleFiles = files.filter((file) =>
    file.name.toLocaleLowerCase().includes(searchTerm),
  );

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.intent === "create-folder" && !fetcher.data.error) {
      setFolderFormOpen(false);
    }
  }, [fetcher.data, fetcher.state]);

  function submitFiles(selectedFiles: FileList | File[]) {
    if (selectedFiles.length === 0) return;
    const formData = new FormData();
    formData.set("intent", "upload");
    formData.set("path", path);
    Array.from(selectedFiles).forEach((file) => formData.append("files", file));
    fetcher.submit(formData, { method: "post", encType: "multipart/form-data" });
    if (fileInput.current) fileInput.current.value = "";
  }

  return (
    <main className="files-page">
      <header className="files-header">
        <Link className="files-brand" to="/" aria-label="Phishers Monitor, inicio">
          <span className="files-brand-mark" aria-hidden="true">PM</span>
          <span>Phishers Monitor</span>
        </Link>
        <div className="header-tools">
          <nav className="app-nav" aria-label="Navegación principal">
            <Link to="/">Usuarios</Link>
            <Link to="/files" aria-current="page">Archivos</Link>
          </nav>
          <span className="files-connection"><span aria-hidden="true" /> Almacenamiento local</span>
        </div>
      </header>

      <section className="files-intro" aria-labelledby="files-title">
        <p className="files-eyebrow">BIBLIOTECA <span>/</span> MEDIA</p>
        <div className="files-title-row">
          <div>
            <h1 id="files-title">Archivos</h1>
            <p>Gestiona los ficheros almacenados en este servidor.</p>
          </div>
          <div className="files-primary-actions">
            <button
              className="files-secondary-button"
              type="button"
              onClick={() => setFolderFormOpen((isOpen) => !isOpen)}
            >
              Nueva carpeta
            </button>
            <button
              className="files-primary-button"
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={busy}
            >
              {busy ? "Procesando..." : "+ Subir archivos"}
            </button>
          </div>
          <input
            ref={fileInput}
            className="files-input-hidden"
            type="file"
            multiple
            aria-label="Seleccionar archivos para subir"
            onChange={(event) => submitFiles(event.currentTarget.files ?? [])}
          />
        </div>
      </section>

      {folderFormOpen && (
        <fetcher.Form className="files-folder-form" method="post">
          <input type="hidden" name="intent" value="create-folder" />
          <input type="hidden" name="path" value={path} />
          <label htmlFor="new-folder-name">Nombre de la carpeta</label>
          <input id="new-folder-name" name="folderName" type="text" required maxLength={120} />
          <button className="files-primary-button" type="submit" disabled={busy}>Crear</button>
          <button className="files-form-cancel" type="button" onClick={() => setFolderFormOpen(false)}>
            Cancelar
          </button>
        </fetcher.Form>
      )}

      <nav className="files-breadcrumbs" aria-label="Ruta de carpetas">
        <Link to="/files">media</Link>
        {path.split("/").filter(Boolean).map((segment, index, segments) => {
          const segmentPath = segments.slice(0, index + 1).join("/");
          const isCurrent = index === segments.length - 1;
          return (
            <span className="files-breadcrumb-item" key={segmentPath}>
              <span aria-hidden="true">/</span>
              {isCurrent ? (
                <span aria-current="page">{segment}</span>
              ) : (
                <Link to={`/files?path=${encodeURIComponent(segmentPath)}`}>{segment}</Link>
              )}
            </span>
          );
        })}
      </nav>

      <section
        className={`files-drop-area${dragging ? " is-dragging" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setDragging(false);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          submitFiles(event.dataTransfer.files);
        }}
      >
        <span className="files-drop-plus" aria-hidden="true">+</span>
        <span>Suelta archivos aquí o</span>
        <button type="button" onClick={() => fileInput.current?.click()} disabled={busy}>
          selecciónalos desde tu equipo
        </button>
      </section>

      <section className="files-library" aria-labelledby="library-title">
        <div className="files-library-heading">
          <div>
            <h2 id="library-title">Contenido de {path ? path.split("/").at(-1) : "media"}</h2>
            <p>{folders.length + files.length} elementos <span>·</span> {formatBytes(totalBytes)} en archivos</p>
          </div>
          <div className="files-library-tools">
            <label className="visually-hidden" htmlFor="file-search">Buscar archivos</label>
            <input
              id="file-search"
              type="search"
              placeholder="Nombre del archivo"
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
            />
            <button
              className="files-refresh-button"
              type="button"
              onClick={() => revalidator.revalidate()}
              disabled={revalidator.state === "loading"}
            >
              {revalidator.state === "loading" ? "Actualizando..." : "Actualizar"}
            </button>
          </div>
        </div>

        {fetcher.data?.error && <p className="files-message is-error" role="alert">{fetcher.data.error}</p>}
        {fetcher.data?.message && <p className="files-message is-success" role="status">{fetcher.data.message}</p>}

        <div className="files-list" aria-label="Archivos guardados">
          <div className="files-list-head" aria-hidden="true">
            <span>Nombre</span><span>Modificado</span><span>Tamaño</span><span>Acciones</span>
          </div>
          {visibleFolders.length === 0 && visibleFiles.length === 0 ? (
            <p className="files-empty">
              {folders.length === 0 && files.length === 0
                ? "Todavía no hay archivos. Sube el primero para empezar."
                : "No hay archivos que coincidan con la búsqueda."}
            </p>
          ) : (
            <>
              {visibleFolders.map((folder) => (
                <article className="files-row files-folder-row" key={`folder:${folder.path}`}>
                  <div className="files-name">
                    <span className="files-folder-mark" aria-hidden="true">DIR</span>
                    <Link
                      className="files-folder-link"
                      to={`/files?path=${encodeURIComponent(folder.path)}`}
                    >
                      {folder.name}
                    </Link>
                  </div>
                  <span className="files-date">Carpeta</span>
                  <span className="files-size">--</span>
                  <div className="files-actions">
                    <Link to={`/files?path=${encodeURIComponent(folder.path)}`}>Abrir</Link>
                  </div>
                </article>
              ))}
              {visibleFiles.map((file) => (
                <article className="files-row" key={file.path}>
              <div className="files-name">
                <span className="files-type-mark" aria-hidden="true">FILE</span>
                <span title={file.name}>{file.name}</span>
              </div>
              <time className="files-date" dateTime={file.modified}>
                {new Date(file.modified).toLocaleString()}
              </time>
              <span className="files-size">{formatBytes(file.size)}</span>
              <div className="files-actions">
                <a href={`${downloadBaseUrl}/phishers/files/${encodeStoragePath(file.path)}/download/`}>
                  Descargar
                </a>
                <fetcher.Form
                  method="post"
                  onSubmit={(event) => {
                    if (!window.confirm(`¿Eliminar ${file.name}?`)) event.preventDefault();
                  }}
                >
                  <input type="hidden" name="intent" value="delete" />
                  <input type="hidden" name="filename" value={file.path} />
                  <button type="submit" disabled={busy}>Eliminar</button>
                </fetcher.Form>
              </div>
            </article>
              ))}
            </>
          )}
        </div>
      </section>

      <footer className="files-footer">
        Los archivos se guardan en <code>django_backend/media</code>.
      </footer>
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
    <main className="files-page files-error-page">
      <Link className="files-brand" to="/">
        <span className="files-brand-mark" aria-hidden="true">PM</span>
        <span>Phishers Monitor</span>
      </Link>
      <section className="files-error" role="alert">
        <p className="files-eyebrow">NO SE PUDO CARGAR</p>
        <h1>Los archivos no están disponibles</h1>
        <p>{description}</p>
        <Link className="files-primary-button" to="/files">Volver a intentar</Link>
      </section>
    </main>
  );
}