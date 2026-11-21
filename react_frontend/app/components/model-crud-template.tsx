import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Link, useFetcher, useRevalidator } from "react-router";
import { SidebarNavigation } from "./sidebar-navigation";
import "../monitored-users.css";
import "../model-crud-template.css";

export type CrudActionIntent = "create" | "update" | "delete";

export type CrudActionData = {
  intent?: CrudActionIntent;
  recordId?: string | number;
  message?: string;
  error?: string;
};

export type ModelCrudField<T> = {
  name: string;
  label: string;
  type:
    | "text"
    | "tel"
    | "email"
    | "number"
    | "url"
    | "date"
    | "datetime-local"
    | "textarea"
    | "select"
    | "checkbox";
  required?: boolean;
  maxLength?: number;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  rows?: number;
  autoComplete?: string;
  placeholder?: string;
  options?: readonly { value: string; label: string }[];
  emptyOptionsMessage?: string;
  readOnlyOnEdit?: boolean;
  omitWhenEmpty?: boolean;
  getValue: (record: T) => string | number | boolean | null;
};

export type ModelCrudColumn<T> = {
  header: string;
  render: (record: T) => ReactNode;
  rowHeader?: boolean;
};

type ModelCrudTemplateProps<T> = {
  title: string;
  eyebrow: string;
  description: string;
  createDescription: string;
  sectionTitle: string;
  sectionDescription: string;
  singularLabel: string;
  pluralLabel: string;
  emptyMessage: string;
  sourceEndpoint: string;
  listPath: string;
  recordIdField?: string;
  fields: readonly ModelCrudField<T>[];
  columns: readonly ModelCrudColumn<T>[];
  records: readonly T[];
  getRecordId: (record: T) => string | number;
  getRecordLabel: (record: T) => string;
  count: number;
  page: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

type CrudFieldControlProps<T> = {
  field: ModelCrudField<T>;
  record?: T;
  id: string;
};

function CrudFieldControl<T>({ field, record, id }: CrudFieldControlProps<T>) {
  const value = record ? field.getValue(record) : null;
  const stringValue = typeof value === "string" || typeof value === "number"
    ? String(value)
    : "";
  const options = field.options ?? [];

  if (field.type === "checkbox") {
    return (
      <label className="crud-checkbox" htmlFor={id}>
        <input
          defaultChecked={value === true}
          id={id}
          name={field.name}
          type="checkbox"
        />
        {field.label}
      </label>
    );
  }

  const control = field.type === "select" ? (
    <select
      defaultValue={stringValue}
      disabled={options.length === 0}
      id={id}
      name={field.name}
      required={field.required}
    >
      <option value="" disabled={field.required}>
        {field.placeholder ?? "Selecciona una opción"}
      </option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  ) : field.type === "textarea" ? (
    <textarea
      defaultValue={stringValue}
      readOnly={Boolean(record && field.readOnlyOnEdit)}
      id={id}
      maxLength={field.maxLength}
      name={field.name}
      placeholder={field.placeholder}
      required={field.required}
      rows={field.rows ?? 3}
    />
  ) : (
    <input
      autoComplete={field.autoComplete}
      defaultValue={stringValue}
      readOnly={Boolean(record && field.readOnlyOnEdit)}
      id={id}
      maxLength={field.maxLength}
      min={field.min}
      max={field.max}
      name={field.name}
      placeholder={field.placeholder}
      required={field.required}
      step={field.step}
      type={field.type}
    />
  );

  return (
    <>
      <label className="crud-field-label" htmlFor={id}>
        {field.label}{field.required ? "" : " (opcional)"}
        {control}
      </label>
      {field.type === "select" && options.length === 0 && field.emptyOptionsMessage && (
        <p className="crud-no-options">{field.emptyOptionsMessage}</p>
      )}
    </>
  );
}

export function ModelCrudTemplate<T>({
  title,
  eyebrow,
  description,
  createDescription,
  sectionTitle,
  sectionDescription,
  singularLabel,
  pluralLabel,
  emptyMessage,
  sourceEndpoint,
  listPath,
  recordIdField = "record_id",
  fields,
  columns,
  records,
  getRecordId,
  getRecordLabel,
  count,
  page,
  hasNext,
  hasPrevious,
}: ModelCrudTemplateProps<T>) {
  const revalidator = useRevalidator();
  const fetcher = useFetcher<CrudActionData>();
  const createForm = useRef<HTMLFormElement>(null);
  const editDialog = useRef<HTMLDialogElement>(null);
  const [editingRecord, setEditingRecord] = useState<T | null>(null);
  const [actionNotice, setActionNotice] = useState<CrudActionData | null>(null);
  const isSubmitting = fetcher.state !== "idle";
  const hasUnavailableRequiredSelect = fields.some(
    (field) => field.type === "select" && field.required && (field.options?.length ?? 0) === 0,
  );

  useEffect(() => {
    const dialog = editDialog.current;
    if (editingRecord && dialog && !dialog.open) dialog.showModal();
    if (!editingRecord && dialog?.open) dialog.close();
  }, [editingRecord]);

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;
    setActionNotice(fetcher.data);
    if (fetcher.data.message && fetcher.data.intent === "create") {
      createForm.current?.reset();
    }
    if (fetcher.data.message && fetcher.data.intent === "update") {
      setEditingRecord(null);
    }
  }, [fetcher.data, fetcher.state]);

  function closeEditDialog() {
    setEditingRecord(null);
  }

  return (
    <main className="monitor-page">
      <header className="page-header">
        <SidebarNavigation />
        <a className="brand" href="/" aria-label="Phishers Monitor, inicio">
          <span className="brand-mark" aria-hidden="true">PM</span>
          <span>Phishers Monitor</span>
        </a>
        <span className="connection-state"><span aria-hidden="true" /> Django REST</span>
      </header>

      <section className="page-intro" aria-labelledby="model-page-title">
        <p className="eyebrow">{eyebrow}</p>
        <div className="intro-row">
          <div>
            <h1 id="model-page-title">{title}</h1>
            <p className="intro-copy">{description}</p>
          </div>
          <button
            className="refresh-button"
            type="button"
            onClick={() => revalidator.revalidate()}
            disabled={revalidator.state === "loading"}
          >
            {revalidator.state === "loading" ? "Actualizando..." : "Actualizar lista"}
          </button>
        </div>
      </section>

      <section className="crud-create" aria-labelledby="create-record-title">
        <div className="crud-section-heading">
          <h2 id="create-record-title">Crear entrada</h2>
          <p>{createDescription}</p>
        </div>
        <fetcher.Form
          className="crud-form"
          method="post"
          onSubmit={() => setActionNotice(null)}
          ref={createForm}
        >
          <input type="hidden" name="intent" value="create" />
          {fields.map((field) => (
            <CrudFieldControl
              key={field.name}
              field={field}
              id={`create-${field.name}`}
            />
          ))}
          <button
            className="crud-submit"
            type="submit"
            disabled={isSubmitting || hasUnavailableRequiredSelect}
          >
            {isSubmitting ? "Creando..." : "Crear entrada"}
          </button>
        </fetcher.Form>
      </section>

      {actionNotice?.message && (
        <p className="crud-action-message is-success" role="status">{actionNotice.message}</p>
      )}
      {actionNotice?.error && actionNotice.intent !== "update" && (
        <p className="crud-action-message is-error" role="alert">{actionNotice.error}</p>
      )}

      <section className="users-section" aria-labelledby="records-heading">
        <div className="section-heading">
          <div>
            <h2 id="records-heading">{sectionTitle}</h2>
            <p>{sectionDescription}</p>
          </div>
          <span className="count-badge">
            {count} {count === 1 ? singularLabel : pluralLabel}
          </span>
        </div>

        <div className="table-frame crud-table-frame">
          <table className="crud-table">
            <caption className="visually-hidden">{sectionTitle}</caption>
            <thead>
              <tr>
                {columns.map((column) => <th key={column.header} scope="col">{column.header}</th>)}
                <th scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => {
                const recordId = getRecordId(record);
                const recordLabel = getRecordLabel(record);
                return (
                  <tr key={recordId}>
                    {columns.map((column, index) => {
                      const cell = column.render(record);
                      return column.rowHeader && index === 0
                        ? <th key={column.header} scope="row">{cell}</th>
                        : <td key={column.header}>{cell}</td>;
                    })}
                    <td>
                      <div className="crud-row-actions">
                        <button
                          className="crud-row-action"
                          type="button"
                          aria-label={`Editar ${recordLabel}`}
                          disabled={isSubmitting}
                          onClick={() => {
                            setActionNotice(null);
                            setEditingRecord(record);
                          }}
                        >
                          Editar
                        </button>
                        <fetcher.Form
                          className="crud-delete-form"
                          method="post"
                          onSubmit={(event) => {
                            if (!window.confirm(`¿Borrar ${recordLabel}?`)) {
                              event.preventDefault();
                              return;
                            }
                            setActionNotice(null);
                          }}
                        >
                          <input type="hidden" name="intent" value="delete" />
                          <input type="hidden" name={recordIdField} value={recordId} />
                          <button
                            className="crud-row-action is-delete"
                            type="submit"
                            aria-label={`Borrar ${recordLabel}`}
                            disabled={isSubmitting}
                          >
                            Borrar
                          </button>
                        </fetcher.Form>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {records.length === 0 && (
                <tr>
                  <td className="empty-state" colSpan={columns.length + 1}>{emptyMessage}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <nav className="pagination" aria-label={`Paginación de ${pluralLabel}`}>
          <span>Página {page}</span>
          <div className="pagination-actions">
            {hasPrevious ? (
              <Link className="page-link" to={`${listPath}?page=${page - 1}`}>Anterior</Link>
            ) : (
              <span className="page-link is-disabled" aria-disabled="true">Anterior</span>
            )}
            {hasNext ? (
              <Link className="page-link page-link-next" to={`${listPath}?page=${page + 1}`}>
                Siguiente
              </Link>
            ) : (
              <span className="page-link page-link-next is-disabled" aria-disabled="true">
                Siguiente
              </span>
            )}
          </div>
        </nav>
      </section>

      <dialog
        aria-labelledby="edit-record-title"
        className="crud-edit-dialog"
        ref={editDialog}
        onClose={closeEditDialog}
      >
        {editingRecord && (
          <>
            <header className="crud-edit-header">
              <div>
                <p className="eyebrow">EDITAR {singularLabel.toLocaleUpperCase()}</p>
                <h2 id="edit-record-title">Editar {title.toLocaleLowerCase()}</h2>
              </div>
              <button
                className="crud-edit-close"
                type="button"
                aria-label="Cerrar formulario de edición"
                onClick={closeEditDialog}
              >
                ×
              </button>
            </header>
            <fetcher.Form
              key={getRecordId(editingRecord)}
              className="crud-form crud-edit-form"
              method="post"
              onSubmit={() => setActionNotice(null)}
            >
              <input type="hidden" name="intent" value="update" />
              <input
                type="hidden"
                name={recordIdField}
                value={getRecordId(editingRecord)}
              />
              {fields.map((field) => (
                <CrudFieldControl
                  key={field.name}
                  field={field}
                  id={`edit-${field.name}`}
                  record={editingRecord}
                />
              ))}
              {actionNotice?.intent === "update" && actionNotice.error && (
                <p className="crud-action-message is-error" role="alert">{actionNotice.error}</p>
              )}
              <div className="crud-form-actions">
                <button
                  className="crud-submit"
                  type="submit"
                  disabled={isSubmitting || hasUnavailableRequiredSelect}
                >
                  {isSubmitting ? "Guardando..." : "Guardar cambios"}
                </button>
                <button className="crud-cancel" type="button" onClick={closeEditDialog}>
                  Cancelar
                </button>
              </div>
            </fetcher.Form>
          </>
        )}
      </dialog>

      <footer className="page-footer">
        Fuente de datos <code>{sourceEndpoint}</code>
      </footer>
    </main>
  );
}
