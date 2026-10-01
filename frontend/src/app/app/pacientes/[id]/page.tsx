"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { ClinicalApplication, Consultation, Patient } from "@/lib/types";

const SEX_LABEL: Record<string, string> = { male: "Macho", female: "Hembra", unknown: "Sin dato" };

function ageFrom(birth?: string | null): string | null {
  if (!birth) return null;
  const b = new Date(birth);
  const months = (Date.now() - b.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  if (months < 12) return `${Math.max(0, Math.round(months))} meses`;
  return `${Math.floor(months / 12)} años`;
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value ?? "—"}</p>
    </div>
  );
}

function PlaceholderCard({ title, hint }: { title: string; hint: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="text-base font-medium">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [patient, setPatient] = React.useState<Patient | null>(null);
  const [consultations, setConsultations] = React.useState<Consultation[]>([]);
  const [applications, setApplications] = React.useState<ClinicalApplication[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [uploading, setUploading] = React.useState(false);

  const load = React.useCallback(() => {
    api
      .get<{ data: Patient }>(`/patients/${id}`)
      .then((r) => setPatient(r.data.data))
      .catch(() => toast.error("No se pudo cargar el paciente."))
      .finally(() => setLoading(false));
    api
      .get<{ data: Consultation[] }>("/consultations", { params: { patient_id: id, per_page: 50 } })
      .then((r) => setConsultations(r.data.data))
      .catch(() => undefined);
    api
      .get<{ data: ClinicalApplication[] }>("/clinical-applications", { params: { patient_id: id, per_page: 50 } })
      .then((r) => setApplications(r.data.data))
      .catch(() => undefined);
  }, [id]);

  React.useEffect(() => load(), [load]);

  async function uploadPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const body = new FormData();
    body.append("photo", file);
    try {
      await api.post(`/patients/${id}/photo`, body, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Foto actualizada");
      load();
    } catch (err) {
      const res = (err as { response?: { data?: { errors?: { photo?: string[] }; message?: string } } }).response;
      toast.error(res?.data?.errors?.photo?.[0] ?? res?.data?.message ?? "No se pudo subir la foto.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Cargando paciente...</p>;
  if (!patient) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{patient.name}</h1>
          <p className="text-sm text-muted-foreground">
            {[patient.species, patient.breed].filter(Boolean).join(" · ") || "Sin especie"}
            {" · "}
            Propietario:{" "}
            <Link href={`/app/clientes/${patient.client_id}`} className="text-primary hover:underline">
              {patient.client ?? "—"}
            </Link>
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => router.push("/app/pacientes")}>
          Volver
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="grid aspect-square place-items-center overflow-hidden rounded-lg border border-border bg-muted">
              {patient.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={patient.photo_url} alt={patient.name} className="size-full object-cover" />
              ) : (
                <span className="text-sm text-muted-foreground">Sin foto</span>
              )}
            </div>
            <label className="block text-sm">
              <span className="text-muted-foreground">{uploading ? "Subiendo..." : "Cambiar foto (JPG/PNG/WEBP, 2 MB)"}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={uploading}
                onChange={uploadPhoto}
                className="mt-1 w-full text-sm file:mr-3 file:rounded-md file:border file:border-border file:bg-muted file:px-3 file:py-1.5"
              />
            </label>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3">
            <Fact label="Sexo" value={SEX_LABEL[patient.sex] ?? patient.sex} />
            <Fact label="Nacimiento" value={patient.birth_date ? formatDate(patient.birth_date) : null} />
            <Fact label="Edad" value={ageFrom(patient.birth_date)} />
            <Fact label="Peso" value={patient.weight != null ? `${patient.weight} kg` : null} />
            <Fact label="Microchip" value={patient.microchip} />
            <Fact label="Esterilizado" value={patient.sterilized ? "Sí" : "No"} />
            <Fact
              label="Estado"
              value={<StatusBadge status={patient.status} />}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-medium">Historia clínica</h3>
            <Link href="/app/consultas" className="text-xs text-primary hover:underline">
              Nueva consulta
            </Link>
          </div>
          {consultations.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin consultas registradas.</p>
          ) : (
            <ol className="space-y-3">
              {consultations.map((c) => (
                <li key={c.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">
                      <Link href={`/app/consultas/${c.id}`} className="text-primary hover:underline">
                        {c.reason}
                      </Link>
                    </p>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDate(c.date)}
                      {c.vet ? ` · ${c.vet}` : ""}
                    </span>
                  </div>
                  {c.assessment ? <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.assessment}</p> : null}
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-medium">Vacunas y desparasitación</h3>
              <Link href="/app/vacunas" className="text-xs text-primary hover:underline">
                Registrar
              </Link>
            </div>
            {applications.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin aplicaciones registradas.</p>
            ) : (
              <ul className="space-y-2">
                {applications.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 border-b border-border pb-2 text-sm last:border-0 last:pb-0">
                    <span className="min-w-0 truncate">
                      {a.name}
                      <span className="text-muted-foreground"> · {a.type === "vaccine" ? "vacuna" : "desparasitación"}</span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDate(a.applied_at)}
                      {a.next_due_at ? ` → ${formatDate(a.next_due_at)}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <PlaceholderCard title="Citas" hint="Las citas del paciente aparecerán acá." />
      </div>
    </div>
  );
}
