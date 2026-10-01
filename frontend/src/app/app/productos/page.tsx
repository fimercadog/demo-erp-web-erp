"use client";

import { ImageOff } from "lucide-react";
import { CrudField } from "@/components/crud/crud-modal";
import { ProductImageAction } from "@/components/crud/product-image-action";
import { ModuleTablePage } from "@/components/module-table-page";
import { StatusBadge } from "@/components/ui/status-badge";
import { AppColumnDef } from "@/lib/table-types";
import { Product } from "@/lib/types";

const columns: AppColumnDef<Product>[] = [
  {
    id: "image",
    header: "",
    cell: ({ row }) =>
      row.original.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={row.original.image_url} alt="" className="size-9 rounded-md border border-border object-cover" />
      ) : (
        <span className="grid size-9 place-items-center rounded-md border border-border text-muted-foreground">
          <ImageOff className="size-4" />
        </span>
      ),
  },
  { accessorKey: "sku", header: "SKU" },
  { accessorKey: "name", header: "Nombre" },
  { header: "Categoria", cell: ({ row }) => row.original.category ?? "—" },
  { header: "Marca", cell: ({ row }) => row.original.brand ?? "—" },
  { header: "Precio", cell: ({ row }) => `$${Number(row.original.unit_price).toLocaleString("es-CO")}` },
  {
    header: "Existencia",
    cell: ({ row }) => {
      const stock = row.original.stock_on_hand ?? 0;
      const low = stock < row.original.reorder_level;
      return <StatusBadge status={low ? "low_stock" : "active"} label={`${stock}${low ? " (bajo)" : ""}`} />;
    },
  },
  { header: "Estado", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  {
    header: "Catálogo",
    cell: ({ row }) =>
      row.original.is_public ? <StatusBadge status="catalog" label="Público" /> : "—",
  },
];

const fields: CrudField[] = [
  { name: "sku", label: "SKU", required: true },
  { name: "name", label: "Nombre", required: true },
  { name: "description", label: "Descripcion (catalogo)", type: "textarea", colSpan: "full", omitWhenEmpty: true },
  // La imagen del producto se gestiona solo con la accion "Imagen" de la fila
  // (sube un archivo -> el backend guarda y controla la ruta). No hay campo de
  // URL externa: el catalogo no acepta imagenes fuera del endpoint de upload.
  {
    name: "is_public",
    label: "Visible en catalogo publico",
    type: "select",
    omitWhenEmpty: true,
    options: [
      { label: "No", value: "0" },
      { label: "Si", value: "1" },
    ],
  },
  { name: "category_id", label: "Categoria", type: "select", optionsResource: "/categories", omitWhenEmpty: true },
  { name: "brand_id", label: "Marca", type: "select", optionsResource: "/brands", omitWhenEmpty: true },
  { name: "unit_id", label: "Unidad", type: "select", optionsResource: "/units", omitWhenEmpty: true },
  { name: "unit_price", label: "Precio de venta", type: "number", required: true, min: 0, step: 100 },
  { name: "cost_price", label: "Precio de costo", type: "number", required: true, min: 0, step: 100 },
  { name: "reorder_level", label: "Punto de reorden", type: "number", required: true, min: 0 },
  {
    name: "status",
    label: "Estado",
    type: "select",
    required: true,
    options: [
      { label: "Activo", value: "active" },
      { label: "Inactivo", value: "inactive" },
    ],
  },
];

export default function ProductsPage() {
  return (
    <ModuleTablePage<Product>
      title="Productos"
      description="Catalogo de productos con precio y existencia actual."
      resource="/products"
      exportResource="products"
      columns={columns}
      fields={fields}
      actionLabel="Nuevo producto"
      modalDescription="Producto del catalogo de inventario."
      extraRowActions={(row, refresh) => <ProductImageAction product={row} onDone={refresh} />}
    />
  );
}
