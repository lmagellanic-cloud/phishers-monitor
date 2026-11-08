import { afterEach, describe, expect, it, vi } from "vitest";
import { action as loginAction } from "../../app/routes/login";
import { loader as monitoredUsersLoader } from "../../app/routes/monitored-users";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("authenticated monitored-user flow", () => {
  it("uses the login session to load the requested API page", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ token: "test-token" }))
      .mockResolvedValueOnce(Response.json({
        count: 2,
        next: null,
        previous: "http://django.test/users/?page=1",
        results: [{ username: "analyst", user_data: "/media/analyst.json" }],
      }));
    vi.stubGlobal("fetch", fetchMock);

    const loginData = new FormData();
    loginData.set("username", " analyst ");
    loginData.set("password", "secret");
    loginData.set("redirectTo", "/?page=2");
    const loginResponse = await loginAction({
      request: new Request("http://localhost/login", {
        method: "POST",
        body: loginData,
      }),
    } as Parameters<typeof loginAction>[0]);

    expect(loginResponse).toBeInstanceOf(Response);
    if (!(loginResponse instanceof Response)) throw new Error("Expected a redirect response");
    expect(loginResponse.status).toBe(302);
    expect(loginResponse.headers.get("Location")).toBe("/?page=2");

    const cookie = loginResponse.headers.get("Set-Cookie")?.split(";")[0];
    if (!cookie) throw new Error("Expected the login action to set a session cookie");
    const result = await monitoredUsersLoader({
      request: new Request("http://localhost/?page=2", {
        headers: { Cookie: cookie },
      }),
    } as Parameters<typeof monitoredUsersLoader>[0]);

    expect(result).toEqual({
      users: [{ username: "analyst", user_data: "/media/analyst.json" }],
      count: 2,
      page: 2,
      hasNext: false,
      hasPrevious: true,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: "POST",
      body: JSON.stringify({ username: "analyst", password: "secret" }),
    });
    expect(fetchMock.mock.calls[1][0]).toEqual(
      new URL("http://localhost:8080/phishers/monitored_users/?page=2"),
    );
    expect(new Headers(fetchMock.mock.calls[1][1]?.headers).get("Authorization")).toBe(
      "Token test-token",
    );
  });

  it("rejects an empty login without contacting the API", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const loginData = new FormData();
    loginData.set("username", " ");
    loginData.set("password", "secret");

    const result = await loginAction({
      request: new Request("http://localhost/login", {
        method: "POST",
        body: loginData,
      }),
    } as Parameters<typeof loginAction>[0]);

    expect(result).toEqual({ error: "Introduce tu usuario y contraseña." });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});