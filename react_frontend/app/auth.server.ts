import { createCookieSessionStorage, redirect } from "react-router";

type SessionData = {
  token: string;
};

const sessionSecret = process.env.SESSION_SECRET ??
  (process.env.NODE_ENV === "production"
    ? undefined
    : "local-development-session-secret");

if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set in production.");
}

const sessionStorage = createCookieSessionStorage<SessionData>({
  cookie: {
    name: "__phishers_session",
    httpOnly: true,
    maxAge: 60 * 60 * 8,
    path: "/",
    sameSite: "lax",
    secrets: [sessionSecret],
    secure: process.env.NODE_ENV === "production",
  },
});

export const { getSession, commitSession, destroySession } = sessionStorage;
export const apiBaseUrl = (process.env.DJANGO_API_TARGET ?? "http://localhost:8080")
  .replace(/\/+$/, "");

function loginRedirect(request: Request) {
  const url = new URL(request.url);
  const redirectTo = `${url.pathname}${url.search}`;
  return redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
}

export async function fetchApi(
  request: Request,
  input: string | URL,
  init: RequestInit = {},
) {
  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("token");
  if (!token) throw loginRedirect(request);

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Token ${token}`);
  const response = await fetch(input, { ...init, headers });

  if (response.status === 401) {
    throw redirect("/login", {
      headers: { "Set-Cookie": await destroySession(session) },
    });
  }

  return response;
}

export async function redirectAuthenticatedUser(request: Request) {
  const session = await getSession(request.headers.get("Cookie"));
  if (session.has("token")) throw redirect("/");
}