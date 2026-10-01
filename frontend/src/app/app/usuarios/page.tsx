"use client";

import * as React from "react";
import { CrudField } from "@/components/crud/crud-modal";
import { ToggleStatusAction } from "@/components/crud/toggle-status-action";
import { ModuleTablePage } from "@/components/module-table-page";
import { StatusBadge } from "@/components/ui/status-badge";
import { api, PaginatedResponse } from "@/lib/api";
import { AppColumnDef } from "@/lib/table-types";
import { AppUser, Role } from "@/lib/types";

const columns: AppColumnDef<AppUser>[] = [
  { accessorKey: "name", header: "Nombre" },
  { accessorKey: "email", header: "Correo" },
  { header: "Roles", cell: ({ row }) => row.original.roles?.join(", ") || "Sin rol" },
  { header: "Estado", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
];

const baseFields: CrudField[] = [
  { name: "name", label: "Nombre", required: true },
  { name: "email", label: "Correo", type: "email", required: true },
  { name: "password", label: "Contrasena", type: "password", placeholder: "Dejar en blanco para generar una automatica", omitWhenEmpty: true },
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

export default function AppUsersPage() {
  const [roles, setRoles] = React.useState<Role[]>([]);

  React.useEffect(() => {
    api
      .get<PaginatedResponse<Role>>("/roles", { params: { per_page: 100 } })
      .then((response) => setRoles(response.data.data))
      .catch(() => {});
  }, []);

  const fields = React.useMemo<CrudField[]>(() => {
    const roleField: CrudField = {
      name: "role",
      label: "Rol",
      type: "select",
      omitWhenEmpty: true,
      options: roles.map((role) => ({ label: role.name, value: role.name })),
    };

    return [...baseFields.slice(0, 3), roleField, ...baseFields.slice(3)];
  }, [roles]);

  return (
    <ModuleTablePage
      title="Usuarios"
      description="Cuentas de acceso al panel, con su rol asignado."
      resource="/users"
      columns={columns}
      fields={fields}
      actionLabel="Nuevo usuario"
      modalDescription="Si dejas la contrasena en blanco se genera una temporal y se muestra al crear."
      extraRowActions={(row, refresh) => (
        <ToggleStatusAction resource="/users" id={row.id} active={row.status === "active"} refresh={refresh} />
      )}
    />
  );
}
