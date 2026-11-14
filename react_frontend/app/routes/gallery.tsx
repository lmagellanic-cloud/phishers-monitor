import { useEffect, useRef, useState } from "react";
import type { WheelEvent } from "react";
import { isRouteErrorResponse, Link } from "react-router";
import type { Route } from "./+types/gallery";
import { apiBaseUrl, fetchApi } from "../auth.server";
import { SidebarNavigation } from "../components/sidebar-navigation";
import "../monitored-users.css";
import "../gallery.css";

type ImageFile = {
  name: string;
  path: string;
};

type MediaListing = {
  folders: Array<{ path: string }>;
  files: ImageFile[];
};

const imageExtensions = new Set(["avif", "bmp", "gif", "jfif", "jpeg", "jpg", "png", "webp"]);

function encodeStoragePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

export async function loader({ request }: Route.LoaderArgs) {
  const pendingFolders = [""];
  const images: ImageFile[] = [];

  while (pendingFolders.length > 0) {
    const path = pendingFolders.shift()!;
    const apiUrl = new URL(`${apiBaseUrl}/api/files/`);
    if (path) apiUrl.searchParams.set("path", path);

    const response = await fetchApi(request, apiUrl);
    if (!response.ok) {
      throw new Response("No se pudieron cargar las fotos desde Django REST.", {
        status: response.status,
      });
    }

    const listing = (await response.json()) as MediaListing;
    pendingFolders.push(...listing.folders.map((folder) => folder.path));
    images.push(...listing.files.filter((file) => {
      const extension = file.name.split(".").at(-1)?.toLowerCase() ?? "";
      return imageExtensions.has(extension);
    }));
  }

  images.sort((left, right) => left.path.localeCompare(right.path, "es", { sensitivity: "base" }));
  return { images };
}

export function meta() {
  return [{ title: "Galería | Phishers Monitor" }];
}

export default function GalleryPage({ loaderData }: Route.ComponentProps) {
  const { images } = loaderData;
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);
  const [zoom, setZoom] = useState(1);
  const [zoomOrigin, setZoomOrigin] = useState("50% 50%");
  const previewDialog = useRef<HTMLDialogElement>(null);
  const selectedIndex = selectedImage
    ? images.findIndex((image) => image.path === selectedImage.path)
    : -1;

  useEffect(() => {
    const dialog = previewDialog.current;
    if (selectedImage && dialog && !dialog.open) dialog.showModal();
    if (!selectedImage && dialog?.open) dialog.close();
  }, [selectedImage]);

  useEffect(() => {
    setZoom(1);
    setZoomOrigin("50% 50%");
  }, [selectedImage?.path]);

  useEffect(() => {
    if (selectedIndex < 0) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const nextIndex = (selectedIndex + direction + images.length) % images.length;
      setSelectedImage(images[nextIndex]);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [images, selectedIndex]);

  function navigateImage(direction: number) {
    if (selectedIndex < 0) return;
    const nextIndex = (selectedIndex + direction + images.length) % images.length;
    setSelectedImage(images[nextIndex]);
  }

  function handleImageWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    const image = event.currentTarget.querySelector("img");
    if (image) {
      const bounds = image.getBoundingClientRect();
      const horizontalOrigin = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
      const verticalOrigin = Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height));
      setZoomOrigin(`${horizontalOrigin * 100}% ${verticalOrigin * 100}%`);
    }

    const factor = event.deltaY < 0 ? 1.2 : 1 / 1.2;
    setZoom((currentZoom) => Math.min(5, Math.max(1, currentZoom * factor)));
  }

  return (
    <main className="monitor-page gallery-page">
      <header className="page-header">
        <SidebarNavigation />
        <Link className="brand" to="/" aria-label="Phishers Monitor, inicio">
          <span className="brand-mark" aria-hidden="true">PM</span>
          <span>Phishers Monitor</span>
        </Link>
        <span className="connection-state"><span aria-hidden="true" /> Django REST</span>
      </header>

      <section className="page-intro" aria-labelledby="page-title">
        <p className="eyebrow">BIBLIOTECA <span> / </span> MEDIA</p>
        <div className="intro-row">
          <div>
            <h1 id="page-title">Galería</h1>
            <p className="intro-copy">{images.length} {images.length === 1 ? "foto disponible" : "fotos disponibles"}</p>
          </div>
        </div>
      </section>

      {images.length > 0 ? (
        <section className="gallery-grid" aria-label="Fotos de media">
          {images.map((image) => (
            <button
              className="gallery-item"
              key={image.path}
              type="button"
              onClick={() => setSelectedImage(image)}
              aria-label={`Ampliar ${image.path}`}
            >
              <img
                src={`/download/${encodeStoragePath(image.path)}?preview=1`}
                alt=""
                loading="lazy"
              />
              <span>{image.path}</span>
            </button>
          ))}
        </section>
      ) : (
        <p className="gallery-empty">No hay fotos compatibles en la carpeta media.</p>
      )}

      <dialog
        ref={previewDialog}
        className="gallery-dialog"
        aria-labelledby="gallery-preview-title"
        onClose={() => setSelectedImage(null)}
      >
        {selectedImage && (
          <>
            <header className="gallery-dialog-header">
              <h2 id="gallery-preview-title" title={selectedImage.path}>{selectedImage.path}</h2>
              <div className="gallery-dialog-tools">
                <output aria-label="Nivel de zoom">{Math.round(zoom * 100)}%</output>
                <button type="button" onClick={() => previewDialog.current?.close()} aria-label="Cerrar foto">
                  Cerrar
                </button>
              </div>
            </header>
            <div className="gallery-dialog-image" onWheel={handleImageWheel}>
              <img
                src={`/download/${encodeStoragePath(selectedImage.path)}?preview=1`}
                alt={selectedImage.name}
                style={{ transform: `scale(${zoom})`, transformOrigin: zoomOrigin }}
              />
              {images.length > 1 && (
                <>
                  <button
                    className="gallery-image-nav is-previous"
                    type="button"
                    onClick={() => navigateImage(-1)}
                    aria-label="Foto anterior"
                  >
                    ‹
                  </button>
                  <button
                    className="gallery-image-nav is-next"
                    type="button"
                    onClick={() => navigateImage(1)}
                    aria-label="Foto siguiente"
                  >
                    ›
                  </button>
                </>
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
    <main className="monitor-page error-page">
      <Link className="brand" to="/">
        <span className="brand-mark" aria-hidden="true">PM</span>
        <span>Phishers Monitor</span>
      </Link>
      <section className="error-message" role="alert">
        <p className="eyebrow">NO SE PUDIERON CARGAR</p>
        <h1>La galería no está disponible</h1>
        <p>{description}</p>
        <Link className="page-link page-link-next" to="/gallery">Volver a intentar</Link>
      </section>
    </main>
  );
}