import { redirect } from "react-router";
import type { Route } from "./+types/logout";
import { apiBaseUrl, destroySession, fetchApi, getSession } from "../auth.server";

export async function action({ request }: Route.ActionArgs) {
  await Promise.allSettled([
    fetchApi(request, `${apiBaseUrl}/api/auth/logout/`, { method: "POST" }),
  ]);
  const session = await getSession(request.headers.get("Cookie"));
  return redirect("/login", {
    headers: { "Set-Cookie": await destroySession(session) },
  });
}