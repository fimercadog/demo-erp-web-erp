"use client";

import * as React from "react";
import {
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Download, FileText, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, PaginatedResponse } from "@/lib/api";
import { AppColumnDef } from "@/lib/table-types";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

type DataTableProps<TData extends object> = {
  columns: AppColumnDef<TData>[];
  data?: PaginatedResponse<TData>;
  loading?: boolean;
  error?: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  page: number;
  onPageChange: (page: number) => void;
  perPage?: number;
  onPerPageChange?: (perPage: number) => void;
  exportBaseUrl?: string;
};

export function DataTable<TData extends object>({
  columns,
  data,
  loading,
  error,
  search,
  onSearchChange,
  page,
  onPageChange,
  perPage = 10,
  onPerPageChange,
  exportBaseUrl,
}: DataTableProps<TData>) {
  const table = useReactTable<TData>({
    data: data?.data ?? [],
    columns: columns as Parameters<typeof useReactTable<TData>>[0]["columns"],
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  const exportQuery = new URLSearchParams({ search }).toString();
  const rows = table.getRowModel().rows;
  // Numero de fila global (posicion en el total, no dentro de la pagina):
  // `meta.from` es el indice 1-based del primer item de la pagina actual.
  const firstRowNumber = data?.meta?.from ?? 1;
  const colCount = columns.length + 1;

  async function downloadExport(format: "csv" | "pdf") {
    if (!exportBaseUrl) return;

    const response = await api.get(`${exportBaseUrl}.${format}?${exportQuery}`, { responseType: "blob" });
    const blobUrl = window.URL.createObjectURL(response.data);
    const link = document.createElement("a");

    link.href = blobUrl;
    link.download = `${exportBaseUrl.split("/").pop()}.${format}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  }

  function columnKey(column: AppColumnDef<TData>, index: number) {
    return String(column.id ?? column.accessorKey ?? index);
  }

  function renderHeader(column: AppColumnDef<TData>): React.ReactNode {
    if (typeof column.header === "function") {
      return column.header({});
    }

    return column.header ?? (column.accessorKey ? String(column.accessorKey) : "");
  }

  function renderCell(column: AppColumnDef<TData>, row: TData): React.ReactNode {
    if (column.cell) {
      return column.cell({ row: { original: row } });
    }

    if (!column.accessorKey) {
      return null;
    }

    const value = row[column.accessorKey as keyof TData];
    return value == null ? "" : String(value);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar..." value={search} onChange={(event) => onSearchChange(event.target.value)} />
        </div>
        <div className="flex gap-2">
          {exportBaseUrl ? (
            <>
              <Button variant="outline" size="sm" onClick={() => void downloadExport("csv")}>
                <Download className="h-4 w-4" /> CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => void downloadExport("pdf")}>
                <FileText className="h-4 w-4" /> PDF
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-190 text-sm">
            <thead className="bg-muted text-left text-muted-foreground">
              <tr>
                <th className="w-12 px-3 py-3 text-right font-medium tabular-nums">#</th>
                {columns.map((column, index) => (
                  <th key={columnKey(column, index)} className="px-4 py-3 font-medium">
                    {renderHeader(column)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-10 text-center text-muted-foreground" colSpan={colCount}>
                    <RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin" /> Cargando datos...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td className="px-4 py-10 text-center text-destructive" colSpan={colCount}>{error}</td>
                </tr>
              ) : rows.length ? (
                rows.map((row, rowIndex) => (
                  <tr key={row.id} className={`border-t border-border ${rowIndex % 2 === 1 ? "bg-muted/50" : ""}`}>
                    <td className="w-12 px-3 py-3 text-right align-middle tabular-nums text-muted-foreground">
                      {firstRowNumber + rowIndex}
                    </td>
                    {columns.map((column, index) => (
                      <td key={`${row.id}-${columnKey(column, index)}`} className="px-4 py-3 align-middle">
                        {renderCell(column, row.original)}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-10 text-center text-muted-foreground" colSpan={colCount}>No hay registros para mostrar.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>{data?.meta?.total ?? 0} registros</span>
        <div className="flex items-center gap-3">
          {onPerPageChange && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs">Filas:</span>
              <select
                value={perPage}
                onChange={(e) => onPerPageChange(Number(e.target.value))}
                className="h-8 rounded-md border border-border bg-card px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          )}
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Anterior</Button>
          <span>Pág. {data?.meta?.current_page ?? page} / {data?.meta?.last_page ?? 1}</span>
          <Button variant="outline" size="sm" disabled={!data?.meta || page >= data.meta.last_page} onClick={() => onPageChange(page + 1)}>Siguiente</Button>
        </div>
      </div>
    </div>
  );
}
