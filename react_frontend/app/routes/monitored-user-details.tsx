import { isRouteErrorResponse, Link } from "react-router";
import type { Route } from "./+types/monitored-user-details";
import {
  ModelCrudTemplate,
  type CrudActionData,
  type ModelCrudColumn,
  type ModelCrudField,
} from "../components/model-crud-template";
import { apiBaseUrl, fetchApi } from "../auth.server";

type MonitoredUserDetails = {
  id: number;
  monitored_user: string;
  name: string;
  surname: string;
  surname_2: string | null;
  phone: string;
  is_phished: boolean;
};

type MonitoredUserDetailsResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: MonitoredUserDetails[];
};

type MonitoredUsersResponse = {
  next: string | null;
  results: { username: string }[];
};

type DetailsPayload = {
  monitored_user: string;
  name: string;
  surname: string;
  surname_2: string;
  phone: string;
  is_phished: boolean;
};

function getDetailsPayload(formData: FormData): DetailsPayload | null {
  const monitoredUser = formData.get("monitored_user");
  const name = formData.get("name");
  const surname = formData.get("surname");
  const surname2 = formData.get("surname_2");
  const phone = formData.get("phone");

  if (
    typeof monitoredUser !== "string" || !monitoredUser.trim() ||
    typeof name !== "string" || !name.trim() ||
    typeof surname !== "string" || !surname.trim() ||
    typeof surname2 !== "string" ||
    typeof phone !== "string" || !phone.trim()
  ) {
    return null;
  }

  return {
    monitored_user: monitoredUser.trim(),
    name: name.trim(),
    surname: surname.trim(),
    surname_2: surname2.trim(),
    phone: phone.trim(),
    is_phished: formData.has("is_phished"),
  };
}

async function responseError(response: Response) {
  try {
    const body = await response.json() as Record<string, unknown>;
    if (typeof body.detail === "string") return body.detail;

    const errors = Object.entries(body).flatMap(([field, value]) => {
      if (Array.isArray(value)) {
        return [`${field}: ${value.map(String).join(" ")}`];
      }
      if (typeof value === "string") return [`${field}: ${value}`];
      return [];
    });

    return errors.join(" ") || `Django REST devolvió el error ${response.status}.`;
  } catch {
    return `Django REST devolvió el error ${response.status}.`;
  }
}

async function loadMonitoredUsernames(request: Request) {
  const usernames: string[] = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const apiUrl = new URL(`${apiBaseUrl}/api/monitored_users/`);
    if (page > 1) apiUrl.searchParams.set("page", String(page));

    const response = await fetchApi(request, apiUrl);
    if (!response.ok) {
      throw new Response("No se pudieron cargar los usuarios monitorizados desde Django REST.", {
        status: response.status,
      });
    }

    const data = (await response.json()) as MonitoredUsersResponse;
    usernames.push(...data.results.map((user) => user.username));
    hasNext = Boolean(data.next);
    page += 1;
  }

  return usernames.sort((first, second) => first.localeCompare(second));
}

export async function loader({ request }: Route.LoaderArgs) {
  const requestUrl = new URL(request.url);
  const requestedPage = Number.parseInt(requestUrl.searchParams.get("page") ?? "1", 10);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const apiUrl = new URL(`${apiBaseUrl}/api/monitored_user_details/`);

  if (page > 1) apiUrl.searchParams.set("page", String(page));

  const [response, monitoredUsernames] = await Promise.all([
    fetchApi(request, apiUrl),
    loadMonitoredUsernames(request),
  ]);
  if (!response.ok) {
    throw new Response("No se pudieron cargar los detalles de usuarios desde Django REST.", {
      status: response.status,
    });
  }

  const data = (await response.json()) as MonitoredUserDetailsResponse;
  return {
    details: data.results,
    count: data.count,
    page,
    hasNext: Boolean(data.next),
    hasPrevious: Boolean(data.previous),
    monitoredUsernames,
  };
}

export async function action({ request }: Route.ActionArgs): Promise<CrudActionData> {
  const formData = await request.formData();
  const submittedIntent = formData.get("intent");
  if (
    submittedIntent !== "create" &&
    submittedIntent !== "update" &&
    submittedIntent !== "delete"
  ) {
    return { error: "La acción solicitada no es válida." };
  }
  const intent = submittedIntent;

  if (intent === "delete") {
    const rawRecordId = formData.get("record_id");
    const recordId = typeof rawRecordId === "string" ? Number(rawRecordId) : NaN;
    if (!Number.isSafeInteger(recordId) || recordId <= 0) {
      return { intent, error: "No se indicó una entrada válida para borrar." };
    }

    let response: Response;
    try {
      response = await fetchApi(
        request,
        `${apiBaseUrl}/api/monitored_user_details/${recordId}/`,
        { method: "DELETE" },
      );
    } catch (error) {
      if (error instanceof Response) throw error;
      return {
        intent,
        recordId,
        error: error instanceof Error ? error.message : "No se pudo conectar con Django REST.",
      };
    }

    if (!response.ok) return { intent, recordId, error: await responseError(response) };
    return { intent, recordId, message: "Se ha borrado la entrada." };
  }

  const payload = getDetailsPayload(formData);
  if (!payload) {
    return { intent, error: "Completa los campos obligatorios del formulario." };
  }

  let recordId: number | undefined;
  if (intent === "update") {
    const rawRecordId = formData.get("record_id");
    const parsedRecordId = typeof rawRecordId === "string" ? Number(rawRecordId) : NaN;
    if (!Number.isSafeInteger(parsedRecordId) || parsedRecordId <= 0) {
      return { intent, error: "No se indicó una entrada válida para editar." };
    }
    recordId = parsedRecordId;
  }

  let response: Response;
  try {
    const url = recordId
      ? `${apiBaseUrl}/api/monitored_user_details/${recordId}/`
      : `${apiBaseUrl}/api/monitored_user_details/`;
    response = await fetchApi(request, url, {
      method: intent === "update" ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    return {
      intent,
      recordId,
      error: error instanceof Error ? error.message : "No se pudo conectar con Django REST.",
    };
  }

  if (!response.ok) return { intent, recordId, error: await responseError(response) };
  return {
    intent,
    recordId,
    message: intent === "update"
      ? "Se han guardado los cambios."
      : `Se ha creado la entrada de ${payload.monitored_user}.`,
  };
}

function createFields(monitoredUsernames: string[]): ModelCrudField<MonitoredUserDetails>[] {
  const userOptions = monitoredUsernames.map((username) => ({
    value: username,
    label: username,
  }));
  return [
    {
      name: "monitored_user",
      label: "Usuario monitorizado",
      type: "select",
      required: true,
      options: userOptions,
      placeholder: "Selecciona un usuario",
      emptyOptionsMessage: "No hay usuarios monitorizados para asociar a esta entrada.",
      getValue: (record) => record.monitored_user,
    },
    {
      name: "name",
      label: "Nombre",
      type: "text",
      required: true,
      maxLength: 255,
      getValue: (record) => record.name,
    },
    {
      name: "surname",
      label: "Apellido",
      type: "text",
      required: true,
      maxLength: 255,
      getValue: (record) => record.surname,
    },
    {
      name: "surname_2",
      label: "Segundo apellido",
      type: "text",
      maxLength: 255,
      getValue: (record) => record.surname_2,
    },
    {
      name: "phone",
      label: "Teléfono",
      type: "tel",
      required: true,
      maxLength: 20,
      autoComplete: "tel",
      getValue: (record) => record.phone,
    },
    {
      name: "is_phished",
      label: "El usuario ha sido phished",
      type: "checkbox",
      getValue: (record) => record.is_phished,
    },
  ];
}

const columns: ModelCrudColumn<MonitoredUserDetails>[] = [
  {
    header: "Usuario monitorizado",
    rowHeader: true,
    render: (detail) => (
      <>
        <span className="user-dot" aria-hidden="true" />
        {detail.monitored_user}
      </>
    ),
  },
  { header: "Nombre", render: (detail) => detail.name },
  {
    header: "Apellidos",
    render: (detail) => [detail.surname, detail.surname_2].filter(Boolean).join(" "),
  },
  { header: "Teléfono", render: (detail) => detail.phone },
  {
    header: "¿Phished?",
    render: (detail) => (
      <span className={`crud-status-badge ${detail.is_phished ? "is-warning" : "is-positive"}`}>
        {detail.is_phished ? "Sí" : "No"}
      </span>
    ),
  },
];

export function meta() {
  return [{ title: "Detalles de usuarios | Phishers Monitor" }];
}

export default function MonitoredUserDetailsPage({ loaderData }: Route.ComponentProps) {
  return (
    <ModelCrudTemplate
      title="Detalles de usuarios"
      eyebrow="VISTA GENERAL / DETALLES"
      description="Información personal y estado de phishing de cada registro."
      createDescription="Asocia datos personales a un usuario monitorizado existente."
      sectionTitle="Registros"
      sectionDescription="Detalles devueltos por la API"
      singularLabel="registro"
      pluralLabel="registros"
      emptyMessage="No hay detalles de usuarios."
      sourceEndpoint="/api/monitored_user_details/"
      listPath="/monitored-user-details"
      recordIdField="record_id"
      fields={createFields(loaderData.monitoredUsernames)}
      columns={columns}
      records={loaderData.details}
      getRecordId={(detail) => detail.id}
      getRecordLabel={(detail) => `${detail.name} ${detail.surname}`}
      count={loaderData.count}
      page={loaderData.page}
      hasNext={loaderData.hasNext}
      hasPrevious={loaderData.hasPrevious}
    />
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
      <a className="brand" href="/">
        <span className="brand-mark" aria-hidden="true">PM</span>
        <span>Phishers Monitor</span>
      </a>
      <section className="error-message" role="alert">
        <p className="eyebrow">NO SE PUDO CARGAR</p>
        <h1>Los detalles no están disponibles</h1>
        <p>{description}</p>
        <Link className="page-link page-link-next" to="/monitored-user-details">
          Volver a intentar
        </Link>
      </section>
    </main>
  );
}
