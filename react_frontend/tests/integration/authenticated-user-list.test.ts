import { afterEach, describe, expect, it, vi } from "vitest";
import { action as loginAction } from "../../app/routes/login";
import { action as monitoredUserDetailsAction } from "../../app/routes/monitored-user-details";
import { loader as monitoredUsersLoader } from "../../app/routes/monitored-users";
import { loader as monitoredUserDetailsLoader } from "../../app/routes/monitored-user-details";
import { loader as usersLoader } from "../../app/routes/users";

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
      new URL("http://localhost:8080/api/monitored_users/?page=2"),
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

  it("loads Django users from the UserViewSet endpoint", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ token: "test-token" }))
      .mockResolvedValueOnce(Response.json({
        count: 1,
        next: null,
        previous: null,
        results: [{
          url: "http://localhost:8080/api/users/1/",
          username: "analyst",
          email: "analyst@example.test",
          groups: [],
        }],
      }));
    vi.stubGlobal("fetch", fetchMock);

    const loginData = new FormData();
    loginData.set("username", "analyst");
    loginData.set("password", "secret");
    const loginResponse = await loginAction({
      request: new Request("http://localhost/login", {
        method: "POST",
        body: loginData,
      }),
    } as Parameters<typeof loginAction>[0]);

    if (!(loginResponse instanceof Response)) throw new Error("Expected a redirect response");
    const cookie = loginResponse.headers.get("Set-Cookie")?.split(";")[0];
    if (!cookie) throw new Error("Expected the login action to set a session cookie");

    const result = await usersLoader({
      request: new Request("http://localhost/users", {
        headers: { Cookie: cookie },
      }),
    } as Parameters<typeof usersLoader>[0]);

    expect(result).toEqual({
      users: [{
        url: "http://localhost:8080/api/users/1/",
        username: "analyst",
        email: "analyst@example.test",
        groups: [],
      }],
      count: 1,
      page: 1,
      hasNext: false,
      hasPrevious: false,
    });
    expect(fetchMock.mock.calls[1][0]).toEqual(
      new URL("http://localhost:8080/api/users/"),
    );
    expect(new Headers(fetchMock.mock.calls[1][1]?.headers).get("Authorization")).toBe(
      "Token test-token",
    );
  });

  it("loads monitored-user details from the details API endpoint", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ token: "test-token" }))
      .mockResolvedValueOnce(Response.json({
        count: 1,
        next: null,
        previous: null,
        results: [{
          id: 12,
          monitored_user: "analyst",
          name: "Ada",
          surname: "Lovelace",
          surname_2: null,
          phone: "+441234567890",
          is_phished: true,
        }],
      }))
      .mockResolvedValueOnce(Response.json({
        count: 11,
        next: "http://localhost:8080/api/monitored_users/?page=2",
        results: [{ username: "zeta" }],
      }))
      .mockResolvedValueOnce(Response.json({
        count: 11,
        next: null,
        results: [{ username: "analyst" }],
      }));
    vi.stubGlobal("fetch", fetchMock);

    const loginData = new FormData();
    loginData.set("username", "analyst");
    loginData.set("password", "secret");
    const loginResponse = await loginAction({
      request: new Request("http://localhost/login", {
        method: "POST",
        body: loginData,
      }),
    } as Parameters<typeof loginAction>[0]);

    if (!(loginResponse instanceof Response)) throw new Error("Expected a redirect response");
    const cookie = loginResponse.headers.get("Set-Cookie")?.split(";")[0];
    if (!cookie) throw new Error("Expected the login action to set a session cookie");

    const result = await monitoredUserDetailsLoader({
      request: new Request("http://localhost/monitored-user-details?page=2", {
        headers: { Cookie: cookie },
      }),
    } as Parameters<typeof monitoredUserDetailsLoader>[0]);

    expect(result).toEqual({
      details: [{
        id: 12,
        monitored_user: "analyst",
        name: "Ada",
        surname: "Lovelace",
        surname_2: null,
        phone: "+441234567890",
        is_phished: true,
      }],
      count: 1,
      page: 2,
      hasNext: false,
      hasPrevious: false,
      monitoredUsernames: ["analyst", "zeta"],
    });
    expect(fetchMock.mock.calls[1][0]).toEqual(
      new URL("http://localhost:8080/api/monitored_user_details/?page=2"),
    );
    expect(fetchMock.mock.calls[2][0]).toEqual(
      new URL("http://localhost:8080/api/monitored_users/"),
    );
    expect(fetchMock.mock.calls[3][0]).toEqual(
      new URL("http://localhost:8080/api/monitored_users/?page=2"),
    );
    expect(new Headers(fetchMock.mock.calls[2][1]?.headers).get("Authorization")).toBe(
      "Token test-token",
    );
  });

  it("creates monitored-user details through the authenticated API", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ token: "test-token" }))
      .mockResolvedValueOnce(Response.json({ id: 12 }, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    const loginData = new FormData();
    loginData.set("username", "analyst");
    loginData.set("password", "secret");
    const loginResponse = await loginAction({
      request: new Request("http://localhost/login", {
        method: "POST",
        body: loginData,
      }),
    } as Parameters<typeof loginAction>[0]);

    if (!(loginResponse instanceof Response)) throw new Error("Expected a redirect response");
    const cookie = loginResponse.headers.get("Set-Cookie")?.split(";")[0];
    if (!cookie) throw new Error("Expected the login action to set a session cookie");

    const formData = new FormData();
    formData.set("intent", "create");
    formData.set("monitored_user", "analyst");
    formData.set("name", "Ada");
    formData.set("surname", "Lovelace");
    formData.set("surname_2", "");
    formData.set("phone", "+441234567890");
    formData.set("is_phished", "on");
    const result = await monitoredUserDetailsAction({
      request: new Request("http://localhost/monitored-user-details", {
        method: "POST",
        body: formData,
        headers: { Cookie: cookie },
      }),
    } as Parameters<typeof monitoredUserDetailsAction>[0]);

    expect(result).toEqual({
      intent: "create",
      message: "Se ha creado la entrada de analyst.",
    });
    expect(fetchMock.mock.calls[1][0]).toBe(
      "http://localhost:8080/api/monitored_user_details/",
    );
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      method: "POST",
      body: JSON.stringify({
        monitored_user: "analyst",
        name: "Ada",
        surname: "Lovelace",
        surname_2: "",
        phone: "+441234567890",
        is_phished: true,
      }),
    });
    expect(new Headers(fetchMock.mock.calls[1][1]?.headers).get("Authorization")).toBe(
      "Token test-token",
    );
  });

  it("updates and deletes monitored-user details through the API", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ token: "test-token" }))
      .mockResolvedValueOnce(Response.json({ id: 12 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    const loginData = new FormData();
    loginData.set("username", "analyst");
    loginData.set("password", "secret");
    const loginResponse = await loginAction({
      request: new Request("http://localhost/login", {
        method: "POST",
        body: loginData,
      }),
    } as Parameters<typeof loginAction>[0]);

    if (!(loginResponse instanceof Response)) throw new Error("Expected a redirect response");
    const cookie = loginResponse.headers.get("Set-Cookie")?.split(";")[0];
    if (!cookie) throw new Error("Expected the login action to set a session cookie");

    const updateData = new FormData();
    updateData.set("intent", "update");
    updateData.set("record_id", "12");
    updateData.set("monitored_user", "analyst");
    updateData.set("name", "Ada Byron");
    updateData.set("surname", "Lovelace");
    updateData.set("surname_2", "");
    updateData.set("phone", "+441234567890");
    const updateResult = await monitoredUserDetailsAction({
      request: new Request("http://localhost/monitored-user-details", {
        method: "POST",
        body: updateData,
        headers: { Cookie: cookie },
      }),
    } as Parameters<typeof monitoredUserDetailsAction>[0]);

    expect(updateResult).toEqual({
      intent: "update",
      recordId: 12,
      message: "Se han guardado los cambios.",
    });
    expect(fetchMock.mock.calls[1][0]).toBe(
      "http://localhost:8080/api/monitored_user_details/12/",
    );
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      method: "PATCH",
      body: JSON.stringify({
        monitored_user: "analyst",
        name: "Ada Byron",
        surname: "Lovelace",
        surname_2: "",
        phone: "+441234567890",
        is_phished: false,
      }),
    });

    const deleteData = new FormData();
    deleteData.set("intent", "delete");
    deleteData.set("record_id", "12");
    const deleteResult = await monitoredUserDetailsAction({
      request: new Request("http://localhost/monitored-user-details", {
        method: "POST",
        body: deleteData,
        headers: { Cookie: cookie },
      }),
    } as Parameters<typeof monitoredUserDetailsAction>[0]);

    expect(deleteResult).toEqual({
      intent: "delete",
      recordId: 12,
      message: "Se ha borrado la entrada.",
    });
    expect(fetchMock.mock.calls[2][0]).toBe(
      "http://localhost:8080/api/monitored_user_details/12/",
    );
    expect(fetchMock.mock.calls[2][1]).toMatchObject({ method: "DELETE" });
  });
});