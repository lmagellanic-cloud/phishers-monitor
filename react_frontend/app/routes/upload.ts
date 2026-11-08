import type { Route } from "./+types/upload";
import { apiBaseUrl, fetchApi } from "../auth.server";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const file = formData.get("file");
  const path = formData.get("path");
  const clientMd5 = formData.get("md5");

  if (!file || typeof file === "string") {
    return Response.json({ error: "No se ha recibido ningún fichero." }, { status: 400 });
  }
  if (typeof clientMd5 !== "string" || !/^[a-f\d]{32}$/i.test(clientMd5)) {
    return Response.json({ error: "El MD5 del fichero no es válido." }, { status: 400 });
  }

  const uploadData = new FormData();
  uploadData.append("file", file, file.name);
  if (typeof path === "string") uploadData.append("path", path);

  const response = await fetchApi(request, `${apiBaseUrl}/phishers/files/`, {
    method: "POST",
    body: uploadData,
  });
  if (!response.ok) {
    let message = `Error ${response.status}`;
    try {
      const body = (await response.json()) as { detail?: string };
      message = body.detail || message;
    } catch {
      message = `Error ${response.status}`;
    }
    return Response.json({ error: message }, { status: response.status });
  }

  const storedFile = (await response.json()) as { name: string; md5: string };
  if (storedFile.md5.toLowerCase() !== clientMd5.toLowerCase()) {
    return Response.json(
      { error: `La integridad de ${file.name} no coincide después de subirlo.` },
      { status: 502 },
    );
  }

  return Response.json({ name: storedFile.name, md5: storedFile.md5, verified: true });
}