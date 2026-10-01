"use client";

import * as React from "react";
import { Pencil, Plus, WifiOff } from "lucide-react";
import { CrudField, CrudModal } from "@/components/crud/crud-modal";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { AppColumnDef } from "@/lib/table-types";
import { useApiTable } from "@/lib/use-api-table";
import { useContingency } from "@/lib/contingency/context";

type RowWithId = { id?: number | string };

type ModuleTablePageProps<T extends object & RowWithId> = {
  title: string;
  description: string;
  resource: string;
  exportResource?: string;
  columns: AppColumnDef<T>[];
  actionLabel?: string;
  fields?: CrudField[];
  modalDescription?: string;
  extraRowActions?: (row: T, refresh: () => void) => React.ReactNode;
  /** false para un recurso solo de alta (p.ej. una bitacora): oculta "Editar" sin afectar el boton de creacion. */
  editable?: boolean;
  /** Prop Opcional: funcion para determinar si una fila especifica es editable (p.ej. status === 'open'). */
  isRowEditable?: (row: T) => boolean;
  /** query params fijos que se anexan a cada peticion (p.ej. { completed: 0 }). */
  params?: Record<string, string | number | boolean>;
};

export function ModuleTablePage<T extends object & RowWithId>({
  title,
  description,
  resource,
  exportResource,
  columns,
  actionLabel,
  fields,
  modalDescription,
  extraRowActions,
  editable = true,
  isRowEditable,
  params,
}: ModuleTablePageProps<T>) {
  const table = useApiTable<T>(resource, params);
  const { isActive: contingencyActive, moduleEnabled, enqueue } = useContingency();
  const moduleKey = resource.replace(/^\//, "");
  // Modulo habilitado en contingencia: crear y editar se encolan en local.
  const queueWrites = contingencyActive && moduleEnabled(resource);
  // Contingencia activa pero este modulo NO habilitado: solo lectura.
  const readOnly = contingencyActive && !moduleEnabled(resource);
  const [modalMode, setModalMode] = React.useState<"create" | "edit">("create");
  const [selectedRow, setSelectedRow] = React.useState<T | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);

  const openCreateModal = React.useCallback(() => {
    setModalMode("create");
    setSelectedRow(null);
    setModalOpen(true);
  }, []);

  const openEditModal = React.useCallback((row: T) => {
    setModalMode("edit");
    setSelectedRow(row);
    setModalOpen(true);
  }, []);

  const tableColumns = React.useMemo(() => {
    // En solo-lectura no se muestran acciones de escritura (editar / extras).
    const showEdit = editable && !!fields?.length;
    if (readOnly || (!showEdit && !extraRowActions)) return columns;

    return [
      ...columns,
      {
        id: "actions",
        header: "",
        cell: ({ row }: { row: { original: T } }) => {
          const canEditRow = showEdit && (isRowEditable ? isRowEditable(row.original) : true);
          return (
            <div className="flex justify-end gap-1">
              {extraRowActions?.(row.original, table.refresh)}
              {canEditRow ? (
                <Button variant="ghost" size="sm" onClick={() => openEditModal(row.original)}>
                  <Pencil className="h-4 w-4" /> Editar
                </Button>
              ) : null}
            </div>
          );
        },
      } satisfies AppColumnDef<T>,
    ];
  }, [columns, editable, extraRowActions, fields, isRowEditable, openEditModal, readOnly, table.refresh]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {readOnly ? null : actionLabel && fields?.length ? (
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4" /> {actionLabel}
          </Button>
        ) : actionLabel ? (
          <Button>{actionLabel}</Button>
        ) : null}
      </div>

      {readOnly ? (
        <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
          <WifiOff className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Modo contingencia activo. Este modulo esta en solo lectura hasta que se restablezca la operacion normal.</span>
        </div>
      ) : null}
      {queueWrites ? (
        <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
          <WifiOff className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Modo contingencia activo. Los nuevos registros se guardan localmente y se sincronizan desde &ldquo;Modo contingencia&rdquo;.</span>
        </div>
      ) : null}

      <DataTable
        columns={tableColumns}
        exportBaseUrl={exportResource ? `${process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8001/api"}/exports/${exportResource}` : undefined}
        data={table.data}
        search={table.search}
        onSearchChange={table.setSearch}
        page={table.page}
        onPageChange={table.setPage}
        perPage={table.perPage}
        onPerPageChange={table.setPerPage}
        loading={table.loading}
        error={table.error}
      />
      {fields?.length ? (
        <CrudModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          mode={modalMode}
          title={modalMode === "edit" ? `Editar ${title.toLowerCase()}` : actionLabel ?? `Crear ${title.toLowerCase()}`}
          description={modalDescription}
          resource={resource}
          fields={fields}
          row={selectedRow}
          onSaved={table.refresh}
          queueSubmit={queueWrites ? (payload, opts) => enqueue(moduleKey, payload, opts) : undefined}
        />
      ) : null}
    </div>
  );
}
