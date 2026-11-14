import { isRouteErrorResponse, Link } from "react-router";
import { useState } from "react";
import type { Route } from "./+types/videos";
import { apiBaseUrl, fetchApi } from "../auth.server";
import { SidebarNavigation } from "../components/sidebar-navigation";
import "../monitored-users.css";
import "../videos.css";

type VideoFile = {
  name: string;
  path: string;
};

type MediaListing = {
  folders: Array<{ path: string }>;
  files: VideoFile[];
};

const videoExtensions = new Set(["m4v", "mov", "mp4", "ogg", "ogv", "webm"]);

function encodeStoragePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

export async function loader({ request }: Route.LoaderArgs) {
  const pendingFolders = [""];
  const videos: VideoFile[] = [];

  while (pendingFolders.length > 0) {
    const path = pendingFolders.shift()!;
    const apiUrl = new URL(`${apiBaseUrl}/api/files/`);
    if (path) apiUrl.searchParams.set("path", path);

    const response = await fetchApi(request, apiUrl);
    if (!response.ok) {
      throw new Response("No se pudieron cargar los vídeos desde Django REST.", {
        status: response.status,
      });
    }

    const listing = (await response.json()) as MediaListing;
    pendingFolders.push(...listing.folders.map((folder) => folder.path));
    videos.push(...listing.files.filter((file) => {
      const extension = file.name.split(".").at(-1)?.toLowerCase() ?? "";
      return videoExtensions.has(extension);
    }));
  }

  videos.sort((left, right) => left.path.localeCompare(right.path, "es", { sensitivity: "base" }));
  return { videos };
}

export function meta() {
  return [{ title: "Reproductor de vídeos | Phishers Monitor" }];
}

export default function VideosPage({ loaderData }: Route.ComponentProps) {
  const { videos } = loaderData;
  const [selectedPath, setSelectedPath] = useState("");
  const selectedVideo = videos.find((video) => video.path === selectedPath);

  return (
    <main className="monitor-page video-page">
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
            <h1 id="page-title">Reproductor de vídeos</h1>
            <p className="intro-copy">Selecciona un vídeo almacenado para reproducirlo.</p>
          </div>
        </div>
      </section>

      <section className="video-player-section" aria-label="Reproductor de vídeo">
        <label htmlFor="video-select">Vídeo</label>
        <select
          id="video-select"
          value={selectedPath}
          onChange={(event) => setSelectedPath(event.currentTarget.value)}
          disabled={videos.length === 0}
        >
          <option value="">{videos.length === 0 ? "No hay vídeos en media" : "Selecciona un vídeo"}</option>
          {videos.map((video) => (
            <option key={video.path} value={video.path}>{video.path}</option>
          ))}
        </select>

        <div className="video-player-frame">
          {selectedVideo && <p className="video-now-playing">{selectedVideo.path}</p>}
          <video
            key={selectedVideo?.path ?? "empty-player"}
            controls
            preload="metadata"
            src={selectedVideo
              ? `/download/${encodeStoragePath(selectedVideo.path)}?preview=1`
              : undefined}
            aria-label={selectedVideo ? `Reproduciendo ${selectedVideo.name}` : "Reproductor de vídeo"}
          />
        </div>
      </section>
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
        <h1>Los vídeos no están disponibles</h1>
        <p>{description}</p>
        <Link className="page-link page-link-next" to="/videos">Volver a intentar</Link>
      </section>
    </main>
  );
}