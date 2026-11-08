import { useEffect, useRef, useState } from "react";
import { Form, isRouteErrorResponse, Link, useFetcher, useRevalidator } from "react-router";
import type { Route } from "./+types/files";
import { apiBaseUrl, fetchApi } from "../auth.server";
import { SidebarNavigation } from "../components/sidebar-navigation";
import { calculateMd5 } from "../file-integrity";
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

type TransferProgress = {
  phase: string;
  filename: string;
  progress: number;
};

type UploadedFile = {
  name: string;
  md5: string;
};

type FilePreview = {
  file: StoredFile;
  kind: "image" | "video";
};

const imageExtensions = new Set(["avif", "gif", "jpeg", "jpg", "png", "webp"]);
const videoExtensions = new Set(["mp4", "ogg", "webm"]);

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

function sendFileUpload(
  file: File,
  path: string,
  md5: string,
  onProgress: (progress: number) => void,
  onVerifying: () => void,
) {
  return new Promise<UploadedFile>((resolve, reject) => {
    const formData = new FormData();
    formData.set("file", file, file.name);
    formData.set("path", path);
    formData.set("md5", md5);

    const request = new XMLHttpRequest();
    request.open("POST", "/upload");
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    request.upload.onload = onVerifying;
    request.onload = () => {
      let result: UploadedFile & { error?: string };
      try {
        result = JSON.parse(request.responseText) as UploadedFile & { error?: string };
      } catch {
        reject(new Error(`No se pudo completar la subida de ${file.name}.`));
        return;
      }
      if (request.status < 200 || request.status >= 300) {
        reject(new Error(result.error || `Error ${request.status}`));
        return;
      }
      resolve(result);
    };
    request.onerror = () => reject(new Error(`Error de red al subir ${file.name}.`));
    request.onabort = () => reject(new Error(`Se canceló la subida de ${file.name}.`));
    request.send(formData);
  });
}

function requestFileDownload(
  path: string,
  onProgress: (progress: number) => void,
) {
  return new Promise<{ blob: Blob; md5: string }>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("GET", `/download/${encodeStoragePath(path)}`);
    request.responseType = "blob";
    request.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    request.onload = () => {
      if (request.status < 200 || request.status >= 300) {
        reject(new Error(`No se pudo descargar ${path} (Error ${request.status}).`));
        return;
      }
      const md5 = request.getResponseHeader("X-Content-MD5");
      if (!md5) {
        reject(new Error("Django no devolvió el MD5 del fichero descargado."));
        return;
      }
      resolve({ blob: request.response as Blob, md5 });
    };
    request.onerror = () => reject(new Error(`Error de red al descargar ${path}.`));
    request.onabort = () => reject(new Error(`Se canceló la descarga de ${path}.`));
    request.send();
  });
}

export async function loader({ request }: Route.LoaderArgs) {
  const requestedPath = new URL(request.url).searchParams.get("path") ?? "";
  const apiUrl = new URL(filesApiUrl);
  if (requestedPath) apiUrl.searchParams.set("path", requestedPath);

  const response = await fetchApi(request, apiUrl);
  if (!response.ok) {
    throw new Response("No se pudieron cargar los archivos desde Django REST.", {
      status: response.status,
    });
  }

  return {
    ...(await response.json()) as FilesResponse,
  };
}

export async function action({ request }: Route.ActionArgs): Promise<FileActionResult> {
  const formData = await request.formData();
  const intent = formData.get("intent");

  try {
    if (intent === "create-folder") {
      const folderName = formData.get("folderName");
      const path = formData.get("path");
      const folderData = new FormData();
      if (typeof folderName === "string") folderData.set("name", folderName);
      if (typeof path === "string") folderData.set("path", path);

      const response = await fetchApi(request, `${filesApiUrl}folders/`, {
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

      const response = await fetchApi(request, `${filesApiUrl}${encodeStoragePath(filename)}/`, {
        method: "DELETE",
      });
      if (!response.ok) return { intent, error: await responseError(response) };
      return { intent, message: `Se ha eliminado ${filename}.` };
    }

    return { error: "La acción solicitada no es válida." };
  } catch (error) {
    if (error instanceof Response) throw error;
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

function getPreviewKind(filename: string): FilePreview["kind"] | null {
  const extension = filename.split(".").at(-1)?.toLowerCase() ?? "";
  if (imageExtensions.has(extension)) return "image";
  if (videoExtensions.has(extension)) return "video";
  return null;
}

export function meta() {
  return [{ title: "Archivos | Phishers Monitor" }];
}

export default function FilesPage({ loaderData }: Route.ComponentProps) {
  const { path, folders, files } = loaderData;
  const fetcher = useFetcher<FileActionResult>();
  const revalidator = useRevalidator();
  const fileInput = useRef<HTMLInputElement>(null);
  const previewDialog = useRef<HTMLDialogElement>(null);
  const [search, setSearch] = useState("");
  const [dragging, setDragging] = useState(false);
  const [folderFormOpen, setFolderFormOpen] = useState(false);
  const [transfer, setTransfer] = useState<TransferProgress | null>(null);
  const [transferMessage, setTransferMessage] = useState<{ message?: string; error?: string } | null>(null);
  const [preview, setPreview] = useState<FilePreview | null>(null);
  const busy = fetcher.state !== "idle" || transfer !== null;
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

  useEffect(() => {
    const dialog = previewDialog.current;
    if (preview && dialog && !dialog.open) dialog.showModal();
    if (!preview && dialog?.open) dialog.close();
  }, [preview]);

  async function submitFiles(selectedFiles: FileList | File[]) {
    if (selectedFiles.length === 0 || busy) return;
    const uploads = Array.from(selectedFiles);
    setTransferMessage(null);
    if (fileInput.current) fileInput.current.value = "";
    let uploadAttempted = false;

    try {
      for (const [index, file] of uploads.entries()) {
        const label = `${file.name} (${index + 1}/${uploads.length})`;
        setTransfer({ phase: "Calculando MD5", filename: label, progress: 0 });
        const md5 = await calculateMd5(file, (progress) => {
          setTransfer({ phase: "Calculando MD5", filename: label, progress: Math.round(progress / 10) });
        });

        uploadAttempted = true;
        const uploaded = await sendFileUpload(
          file,
          path,
          md5,
          (progress) => setTransfer({
            phase: "Subiendo",
            filename: label,
            progress: 10 + Math.round(progress * 90),
          }),
          () => setTransfer({ phase: "Verificando en Django", filename: label, progress: 100 }),
        );
        if (uploaded.md5.toLowerCase() !== md5) {
          throw new Error(`La integridad de ${file.name} no coincide.`);
        }
      }

      setTransferMessage({
        message: uploads.length === 1
          ? `Se ha subido y verificado ${uploads[0].name}.`
          : `Se han subido y verificado ${uploads.length} archivos.`,
      });
    } catch (error) {
      setTransferMessage({
        error: error instanceof Error ? error.message : "No se pudo completar la transferencia.",
      });
    } finally {
      if (uploadAttempted) revalidator.revalidate();
      setTransfer(null);
    }
  }

  async function downloadStoredFile(file: StoredFile) {
    if (busy) return;
    setTransferMessage(null);
    setTransfer({ phase: "Descargando", filename: file.name, progress: 0 });

    try {
      const downloaded = await requestFileDownload(file.path, (progress) => {
        setTransfer({ phase: "Descargando", filename: file.name, progress: Math.round(progress * 100) });
      });
      setTransfer({ phase: "Verificando MD5", filename: file.name, progress: 100 });
      const md5 = await calculateMd5(downloaded.blob, (progress) => {
        setTransfer({ phase: "Verificando MD5", filename: file.name, progress });
      });
      if (md5 !== downloaded.md5.toLowerCase()) {
        throw new Error(`La integridad de ${file.name} no coincide; no se descargó.`);
      }

      const objectUrl = URL.createObjectURL(downloaded.blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = file.name;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      setTransferMessage({ message: `Descarga verificada: ${file.name}.` });
    } catch (error) {
      setTransferMessage({
        error: error instanceof Error ? error.message : "No se pudo completar la descarga.",
      });
    } finally {
      setTransfer(null);
    }
  }

  return (
    <main className="files-page">
      <header className="files-header">
        <SidebarNavigation />
        <Link className="files-brand" to="/" aria-label="Phishers Monitor, inicio">
          <span className="files-brand-mark" aria-hidden="true">PM</span>
          <span>Phishers Monitor</span>
        </Link>
        <span className="files-connection"><span aria-hidden="true" /> Almacenamiento local</span>
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
        {transferMessage?.error && <p className="files-message is-error" role="alert">{transferMessage.error}</p>}
        {transferMessage?.message && <p className="files-message is-success" role="status">{transferMessage.message}</p>}
        {transfer && (
          <div className="files-transfer" role="status" aria-live="polite">
            <div className="files-transfer-heading">
              <span>{transfer.phase}: {transfer.filename}</span>
              <span>{transfer.progress}%</span>
            </div>
            <progress
              max={100}
              value={transfer.progress}
              aria-label={`${transfer.phase}: ${transfer.filename}`}
            />
          </div>
        )}

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
                {getPreviewKind(file.name) && (
                  <button
                    type="button"
                    onClick={() => setPreview({ file, kind: getPreviewKind(file.name)! })}
                  >
                    Vista previa
                  </button>
                )}
                <button type="button" onClick={() => void downloadStoredFile(file)} disabled={busy}>
                  Descargar
                </button>
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

      <dialog
        ref={previewDialog}
        className="files-preview-dialog"
        aria-labelledby="preview-title"
        onClose={() => setPreview(null)}
      >
        {preview && (
          <>
            <header className="files-preview-header">
              <h2 id="preview-title" title={preview.file.name}>{preview.file.name}</h2>
              <button type="button" onClick={() => previewDialog.current?.close()} aria-label="Cerrar vista previa">
                Cerrar
              </button>
            </header>
            <div className="files-preview-content">
              {preview.kind === "image" ? (
                <img
                  src={`/download/${encodeStoragePath(preview.file.path)}?preview=1`}
                  alt={preview.file.name}
                />
              ) : (
                <video
                  src={`/download/${encodeStoragePath(preview.file.path)}?preview=1`}
                  controls
                  preload="metadata"
                  aria-label={preview.file.name}
                />
              )}
            </div>
          </>
        )}
      </dialog>
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