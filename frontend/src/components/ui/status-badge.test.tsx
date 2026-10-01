import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge, getStatusBadgeConfig, getCategoryFromText } from "./status-badge";

describe("StatusBadge Component - Veterinaria", () => {
  it("maps core status keys to correct categories", () => {
    expect(getStatusBadgeConfig("draft")).toEqual(expect.objectContaining({ label: "Borrador", category: "secondary" }));
    expect(getStatusBadgeConfig("sent")).toEqual(expect.objectContaining({ label: "Enviada", category: "info" }));
    expect(getStatusBadgeConfig("pending")).toEqual(expect.objectContaining({ label: "Pendiente", category: "warning" }));
    expect(getStatusBadgeConfig("accepted")).toEqual(expect.objectContaining({ label: "Aceptada", category: "success" }));
    expect(getStatusBadgeConfig("rejected")).toEqual(expect.objectContaining({ label: "Rechazada", category: "destructive" }));
    expect(getStatusBadgeConfig("ai")).toEqual(expect.objectContaining({ label: "IA", category: "purple" }));
  });

  it("CRITICAL: new vs contacted have distinct solid classNames with text-zinc-950", () => {
    const configNew = getStatusBadgeConfig("new");
    const configContacted = getStatusBadgeConfig("contacted");

    expect(configNew.className).toContain("bg-sky-200");
    expect(configNew.className).toContain("text-zinc-950");
    expect(configContacted.className).toContain("bg-indigo-200");
    expect(configContacted.className).toContain("text-zinc-950");
    expect(configNew.className).not.toBe(configContacted.className);
  });

  it("maps veterinary vertical specific status keys correctly", () => {
    expect(getStatusBadgeConfig("vaccinated")).toEqual(expect.objectContaining({ label: "Vacunado", category: "success" }));
    expect(getStatusBadgeConfig("vaccine_due")).toEqual(expect.objectContaining({ label: "Vacuna pendiente", category: "warning" }));
    expect(getStatusBadgeConfig("active_treatment")).toEqual(expect.objectContaining({ label: "Tratamiento activo", category: "info" }));
    expect(getStatusBadgeConfig("medical_discharge")).toEqual(expect.objectContaining({ label: "Alta médica", category: "success" }));
  });

  it("infers category from text fallback and handles dark mode classes", () => {
    expect(getCategoryFromText("Vacunación completa")).toBe("success");
    expect(getCategoryFromText("Pendiente por aplicar")).toBe("warning");
    expect(getCategoryFromText("Tratamiento en curso")).toBe("info");
    expect(getCategoryFromText("Desconocido")).toBe("secondary");
  });

  it("renders badge element with correct visible label", () => {
    render(<StatusBadge status="vaccinated" />);
    expect(screen.getByText("Vacunado")).toBeInTheDocument();
  });
});
