import type { Route } from "./+types/download";
import { apiBaseUrl, fetchApi } from "../auth.server";

function encodeStoragePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

const previewContentTypes: Record<string, string> = {
  avif: "image/avif",
  bmp: "image/bmp",
  gif: "image/gif",
  jfif: "image/jpeg",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  mp4: "video/mp4",
  m4v: "video/mp4",
  mov: "video/quicktime",
  ogg: "video/ogg",
  ogv: "video/ogg",
  png: "image/png",
  webm: "video/webm",
  webp: "image/webp",
};

export async function loader({ request, params }: Route.LoaderArgs) {
  const storagePath = params["*"] ?? "";
  const filename = encodeStoragePath(storagePath);
  const extension = storagePath.split(".").at(-1)?.toLowerCase() ?? "";
  const previewContentType = new URL(request.url).searchParams.get("preview") === "1"
    ? previewContentTypes[extension]
    : undefined;
  const response = await fetchApi(
    request,
    `${apiBaseUrl}/phishers/files/${filename}/download/`,
  );
  const headers = new Headers();
  for (const name of [
    "content-type",
    "content-disposition",
    "content-length",
    "x-content-md5",
  ]) {
    const value = response.headers.get(name);
    if (value && !(previewContentType && name === "content-disposition")) {
      headers.set(name, value);
    }
  }
  if (previewContentType) {
    headers.set("content-type", previewContentType);
    headers.set("content-disposition", "inline");
    headers.set("x-content-type-options", "nosniff");
  }
  return new Response(response.body, { status: response.status, headers });
}