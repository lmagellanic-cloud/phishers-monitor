import { isRouteErrorResponse, Link } from "react-router";
import type { Route } from "./+types/model-list";
import { apiBaseUrl, fetchApi } from "../auth.server";
import {
  ModelCrudTemplate,
  type CrudActionData,
  type ModelCrudColumn,
  type ModelCrudField,
} from "../components/model-crud-template";

type ModelRecord = Record<string, string | number | boolean | null>;

type ModelListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: ModelRecord[];
};

type RelationOptions = Partial<
  Record<"users" | "canals" | "videos", readonly { value: string; label: string }[]>
>;

type ModelDefinition = {
  title: string;
  endpoint: string;
  description: string;
  singularLabel: string;
  pluralLabel: string;
  idField: string;
  labelField: string;
  relationOptions?: {
    key: keyof RelationOptions;
    endpoint: string;
    valueField: string;
    labelField: string;
    message: string;
  };
  fields: (options: RelationOptions) => ModelCrudField<ModelRecord>[];
  columns: ModelCrudColumn<ModelRecord>[];
};

type ModelName =
  | "user-details"
  | "user-read-books"
  | "timestamps"
  | "todos"
  | "canals"
  | "videos"
  | "video-checkpoints";

const fieldValue = (record: ModelRecord, field: string) => record[field] ?? null;

function getRecordKey(record: ModelRecord, field: string): string | number {
  const value = record[field];
  if (typeof value !== "string" && typeof value !== "number") {
    throw new Error(`El registro no contiene una clave válida en ${field}.`);
  }
  return value;
}

function displayValue(value: ModelRecord[string]) {
  if (value === null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  return String(value);
}

function textColumn(header: string, field: string, rowHeader = false): ModelCrudColumn<ModelRecord> {
  return {
    header,
    rowHeader,
    render: (record) => displayValue(record[field]),
  };
}

function checkboxField(name: string, label: string): ModelCrudField<ModelRecord> {
  return {
    name,
    label,
    type: "checkbox",
    getValue: (record) => record[name] === true,
  };
}

const modelDefinitions: Record<ModelName, ModelDefinition> = {
  "user-details": {
    title: "Detalles de usuarios",
    endpoint: "user_details",
    description: "Datos personales y estado de monitorización de las cuentas.",
    singularLabel: "detalle",
    pluralLabel: "detalles",
    idField: "id",
    labelField: "username",
    relationOptions: {
      key: "users",
      endpoint: "users",
      valueField: "username",
      labelField: "username",
      message: "No hay usuarios de Django para asociar a este detalle.",
    },
    fields: (options) => [
      {
        name: "username",
        label: "Usuario de Django",
        type: "select",
        required: true,
        options: options.users ?? [],
        placeholder: "Selecciona un usuario",
        emptyOptionsMessage: "No hay usuarios de Django para asociar a este detalle.",
        getValue: (record) => fieldValue(record, "username"),
      },
      {
        name: "name",
        label: "Nombre",
        type: "text",
        required: true,
        maxLength: 255,
        getValue: (record) => fieldValue(record, "name"),
      },
      {
        name: "surname",
        label: "Apellido",
        type: "text",
        required: true,
        maxLength: 255,
        getValue: (record) => fieldValue(record, "surname"),
      },
      {
        name: "surname_2",
        label: "Segundo apellido",
        type: "text",
        maxLength: 255,
        getValue: (record) => fieldValue(record, "surname_2"),
      },
      {
        name: "phone",
        label: "Teléfono",
        type: "tel",
        required: true,
        maxLength: 20,
        getValue: (record) => fieldValue(record, "phone"),
      },
      checkboxField("is_monitored", "Monitorizado"),
    ],
    columns: [
      textColumn("Usuario", "username", true),
      textColumn("Nombre", "name"),
      textColumn("Apellido", "surname"),
      textColumn("Segundo apellido", "surname_2"),
      textColumn("Teléfono", "phone"),
      textColumn("Monitorizado", "is_monitored"),
    ],
  },
  "user-read-books": {
    title: "Libros leídos",
    endpoint: "user_read_books",
    description: "Libros registrados en la base de datos.",
    singularLabel: "libro",
    pluralLabel: "libros",
    idField: "id",
    labelField: "titulo",
    fields: () => [
      {
        name: "titulo",
        label: "Título",
        type: "text",
        required: true,
        maxLength: 200,
        getValue: (record) => fieldValue(record, "titulo"),
      },
      {
        name: "autor",
        label: "Autor",
        type: "text",
        required: true,
        maxLength: 200,
        getValue: (record) => fieldValue(record, "autor"),
      },
      {
        name: "descripcion",
        label: "Descripción",
        type: "textarea",
        required: true,
        getValue: (record) => fieldValue(record, "descripcion"),
      },
    ],
    columns: [
      textColumn("Título", "titulo", true),
      textColumn("Autor", "autor"),
      textColumn("Descripción", "descripcion"),
    ],
  },
  timestamps: {
    title: "Marcas de tiempo",
    endpoint: "timestamps",
    description: "Marcas de tiempo guardadas.",
    singularLabel: "marca de tiempo",
    pluralLabel: "marcas de tiempo",
    idField: "id",
    labelField: "titulo",
    fields: () => [
      {
        name: "titulo",
        label: "Título",
        type: "text",
        required: true,
        maxLength: 200,
        getValue: (record) => fieldValue(record, "titulo"),
      },
      {
        name: "timestamp",
        label: "Marca de tiempo (ISO 8601)",
        type: "text",
        placeholder: "2026-11-21T07:00:00Z",
        omitWhenEmpty: true,
        getValue: (record) => fieldValue(record, "timestamp"),
      },
    ],
    columns: [
      textColumn("Título", "titulo", true),
      textColumn("Marca de tiempo", "timestamp"),
    ],
  },
  todos: {
    title: "Tareas",
    endpoint: "todos",
    description: "Tareas registradas y su estado.",
    singularLabel: "tarea",
    pluralLabel: "tareas",
    idField: "id",
    labelField: "title",
    fields: () => [
      {
        name: "title",
        label: "Título",
        type: "text",
        required: true,
        maxLength: 120,
        getValue: (record) => fieldValue(record, "title"),
      },
      {
        name: "description",
        label: "Descripción",
        type: "textarea",
        required: true,
        getValue: (record) => fieldValue(record, "description"),
      },
      checkboxField("completed", "Completada"),
    ],
    columns: [
      textColumn("Título", "title", true),
      textColumn("Descripción", "description"),
      textColumn("Completada", "completed"),
    ],
  },
  canals: {
    title: "Canales",
    endpoint: "canals",
    description: "Canales monitorizados y su configuración.",
    singularLabel: "canal",
    pluralLabel: "canales",
    idField: "canal_id",
    labelField: "canal_id",
    fields: () => [
      {
        name: "canal_id",
        label: "ID del canal",
        type: "text",
        required: true,
        maxLength: 200,
        readOnlyOnEdit: true,
        getValue: (record) => fieldValue(record, "canal_id"),
      },
      {
        name: "canal_url",
        label: "URL",
        type: "url",
        maxLength: 200,
        getValue: (record) => fieldValue(record, "canal_url"),
      },
      {
        name: "prioridad",
        label: "Prioridad",
        type: "number",
        required: true,
        step: 1,
        getValue: (record) => fieldValue(record, "prioridad"),
      },
      checkboxField("ignorar", "Ignorar"),
      {
        name: "updated_at",
        label: "Actualizado (ISO 8601)",
        type: "text",
        placeholder: "2026-11-21T07:00:00Z",
        omitWhenEmpty: true,
        getValue: (record) => fieldValue(record, "updated_at"),
      },
    ],
    columns: [
      textColumn("ID del canal", "canal_id", true),
      textColumn("URL", "canal_url"),
      textColumn("Prioridad", "prioridad"),
      textColumn("Ignorar", "ignorar"),
      textColumn("Actualizado", "updated_at"),
    ],
  },
  videos: {
    title: "Vídeos",
    endpoint: "videos",
    description: "Vídeos asociados a los canales monitorizados.",
    singularLabel: "vídeo",
    pluralLabel: "vídeos",
    idField: "video_id",
    labelField: "video_id",
    relationOptions: {
      key: "canals",
      endpoint: "canals",
      valueField: "canal_id",
      labelField: "canal_id",
      message: "No hay canales disponibles para asociar.",
    },
    fields: (options) => [
      {
        name: "video_id",
        label: "ID del vídeo",
        type: "text",
        required: true,
        maxLength: 30,
        readOnlyOnEdit: true,
        getValue: (record) => fieldValue(record, "video_id"),
      },
      {
        name: "canal",
        label: "Canal",
        type: "select",
        options: options.canals ?? [],
        placeholder: "Sin canal",
        getValue: (record) => fieldValue(record, "canal"),
      },
      checkboxField("video_visto", "Visto"),
    ],
    columns: [
      textColumn("ID del vídeo", "video_id", true),
      textColumn("Canal", "canal"),
      textColumn("Visto", "video_visto"),
      textColumn("Fecha de creación", "created_at"),
    ],
  },
  "video-checkpoints": {
    title: "Puntos de control de vídeo",
    endpoint: "video_checkpoints",
    description: "Progreso guardado para cada vídeo.",
    singularLabel: "punto de control",
    pluralLabel: "puntos de control",
    idField: "video",
    labelField: "video",
    relationOptions: {
      key: "videos",
      endpoint: "videos",
      valueField: "video_id",
      labelField: "video_id",
      message: "No hay vídeos disponibles para asociar.",
    },
    fields: (options) => [
      {
        name: "video",
        label: "Vídeo",
        type: "select",
        required: true,
        options: options.videos ?? [],
        placeholder: "Selecciona un vídeo",
        emptyOptionsMessage: "No hay vídeos disponibles para asociar.",
        getValue: (record) => fieldValue(record, "video"),
      },
      {
        name: "start",
        label: "Inicio",
        type: "number",
        required: true,
        min: 0,
        step: 1,
        getValue: (record) => fieldValue(record, "start"),
      },
      {
        name: "titulo",
        label: "Título",
        type: "text",
        maxLength: 200,
        getValue: (record) => fieldValue(record, "titulo"),
      },
    ],
    columns: [
      textColumn("ID del vídeo", "video", true),
      textColumn("Inicio", "start"),
      textColumn("Título", "titulo"),
    ],
  },
};

function isModelName(value: string | undefined): value is ModelName {
  return value !== undefined && Object.hasOwn(modelDefinitions, value);
}

async function responseError(response: Response) {
  try {
    const body = await response.json() as Record<string, unknown>;
    if (typeof body.detail === "string") return body.detail;

    const errors = Object.entries(body).flatMap(([field, value]) => {
      if (Array.isArray(value)) return [`${field}: ${value.map(String).join(" ")}`];
      if (typeof value === "string") return [`${field}: ${value}`];
      return [];
    });

    return errors.join(" ") || `Django REST devolvió el error ${response.status}.`;
  } catch {
    return `Django REST devolvió el error ${response.status}.`;
  }
}

async function loadAllRecords(request: Request, endpoint: string) {
  const records: ModelRecord[] = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const apiUrl = new URL(`${apiBaseUrl}/api/${endpoint}/`);
    if (page > 1) apiUrl.searchParams.set("page", String(page));

    const response = await fetchApi(request, apiUrl);
    if (!response.ok) {
      throw new Response(`No se pudieron cargar las opciones de ${endpoint}.`, {
        status: response.status,
      });
    }

    const data = (await response.json()) as ModelListResponse;
    records.push(...data.results);
    hasNext = Boolean(data.next);
    page += 1;
  }

  return records;
}

async function loadRelationOptions(request: Request, model: ModelDefinition) {
  const relation = model.relationOptions;
  if (!relation) return {} satisfies RelationOptions;

  const records = await loadAllRecords(request, relation.endpoint);
  return {
    [relation.key]: records.map((record) => {
      const value = String(record[relation.valueField] ?? "");
      return { value, label: String(record[relation.labelField] ?? value) };
    }),
  } satisfies RelationOptions;
}

function createPayload(
  formData: FormData,
  fields: readonly ModelCrudField<ModelRecord>[],
): { payload?: Record<string, string | number | boolean | null>; error?: string } {
  const payload: Record<string, string | number | boolean | null> = {};

  for (const field of fields) {
    if (field.type === "checkbox") {
      payload[field.name] = formData.has(field.name);
      continue;
    }

    const rawValue = formData.get(field.name);
    if (typeof rawValue !== "string") {
      if (field.required) {
        return { error: "Completa los campos obligatorios del formulario." };
      }
      continue;
    }

    const value = rawValue.trim();
    if (!value) {
      if (field.required) {
        return { error: "Completa los campos obligatorios del formulario." };
      }
      if (field.omitWhenEmpty) continue;
      if (field.type === "select" || field.type === "url") {
        payload[field.name] = null;
      } else if (field.type === "text" || field.type === "textarea" || field.type === "tel") {
        payload[field.name] = "";
      }
      continue;
    }

    if (field.type === "number") {
      const number = Number(value);
      if (!Number.isFinite(number)) {
        return { error: `El campo ${field.label} debe ser numérico.` };
      }
      payload[field.name] = number;
    } else {
      payload[field.name] = value;
    }
  }

  return { payload };
}

export async function loader({ request, params }: Route.LoaderArgs) {
  if (!isModelName(params.modelName)) {
    throw new Response("No se encontró el modelo solicitado.", { status: 404 });
  }

  const model = modelDefinitions[params.modelName];
  const requestUrl = new URL(request.url);
  const requestedPage = Number.parseInt(requestUrl.searchParams.get("page") ?? "1", 10);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const apiUrl = new URL(`${apiBaseUrl}/api/${model.endpoint}/`);
  if (page > 1) apiUrl.searchParams.set("page", String(page));

  const [response, options] = await Promise.all([
    fetchApi(request, apiUrl),
    loadRelationOptions(request, model),
  ]);
  if (!response.ok) {
    throw new Response(`No se pudo cargar ${model.title.toLowerCase()} desde Django REST.`, {
      status: response.status,
    });
  }

  const data = (await response.json()) as ModelListResponse;
  return {
    modelName: params.modelName,
    records: data.results,
    count: data.count,
    page,
    hasNext: Boolean(data.next),
    hasPrevious: Boolean(data.previous),
    options,
  };
}

export async function action({ request, params }: Route.ActionArgs): Promise<CrudActionData> {
  if (!isModelName(params.modelName)) {
    return { error: "No se encontró el modelo solicitado." };
  }

  const model = modelDefinitions[params.modelName];
  const formData = await request.formData();
  const submittedIntent = formData.get("intent");
  if (submittedIntent !== "create" && submittedIntent !== "update" && submittedIntent !== "delete") {
    return { error: "La acción solicitada no es válida." };
  }
  const intent = submittedIntent;

  if (intent === "delete") {
    const rawRecordId = formData.get("record_id");
    const recordId = typeof rawRecordId === "string" ? rawRecordId : "";
    if (!recordId) return { intent, error: "No se indicó una entrada válida para borrar." };

    try {
      const response = await fetchApi(
        request,
        `${apiBaseUrl}/api/${model.endpoint}/${encodeURIComponent(recordId)}/`,
        { method: "DELETE" },
      );
      if (!response.ok) return { intent, recordId, error: await responseError(response) };
    } catch (error) {
      if (error instanceof Response) throw error;
      return {
        intent,
        recordId,
        error: error instanceof Error ? error.message : "No se pudo conectar con Django REST.",
      };
    }

    return { intent, recordId, message: `Se ha borrado ${model.singularLabel}.` };
  }

  const { payload, error } = createPayload(formData, model.fields({}));
  if (!payload) return { intent, error };

  let recordId: string | undefined;
  if (intent === "update") {
    const rawRecordId = formData.get("record_id");
    recordId = typeof rawRecordId === "string" ? rawRecordId : undefined;
    if (!recordId) return { intent, error: "No se indicó una entrada válida para editar." };
  }

  try {
    const url = recordId
      ? `${apiBaseUrl}/api/${model.endpoint}/${encodeURIComponent(recordId)}/`
      : `${apiBaseUrl}/api/${model.endpoint}/`;
    const response = await fetchApi(request, url, {
      method: intent === "update" ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) return { intent, recordId, error: await responseError(response) };
  } catch (fetchError) {
    if (fetchError instanceof Response) throw fetchError;
    return {
      intent,
      recordId,
      error: fetchError instanceof Error
        ? fetchError.message
        : "No se pudo conectar con Django REST.",
    };
  }

  return {
    intent,
    recordId,
    message: intent === "update"
      ? "Se han guardado los cambios."
      : `Se ha creado ${model.singularLabel}.`,
  };
}

export function meta() {
  return [{ title: "Modelos | Phishers Monitor" }];
}

export default function ModelListPage({ loaderData }: Route.ComponentProps) {
  const model = modelDefinitions[loaderData.modelName];
  const fields = model.fields(loaderData.options);

  return (
    <ModelCrudTemplate
      title={model.title}
      eyebrow="MODELOS / PHISHERS"
      description={model.description}
      createDescription={`Añade un registro de ${model.singularLabel}.`}
      sectionTitle="Registros"
      sectionDescription="Entradas guardadas en Django"
      singularLabel={model.singularLabel}
      pluralLabel={model.pluralLabel}
      emptyMessage={`No hay ${model.pluralLabel}.`}
      sourceEndpoint={`/api/${model.endpoint}/`}
      listPath={`/models/${loaderData.modelName}`}
      recordIdField="record_id"
      fields={fields}
      columns={model.columns}
      records={loaderData.records}
      getRecordId={(record) => getRecordKey(record, model.idField)}
      getRecordLabel={(record) => displayValue(record[model.labelField])}
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
      <Link className="brand" to="/">
        <span className="brand-mark" aria-hidden="true">PM</span>
        <span>Phishers Monitor</span>
      </Link>
      <section className="error-message" role="alert">
        <p className="eyebrow">NO SE PUDO CARGAR</p>
        <h1>Los registros no están disponibles</h1>
        <p>{description}</p>
        <Link className="page-link page-link-next" to="/">Volver al inicio</Link>
      </section>
    </main>
  );
}
