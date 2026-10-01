import { ImageResponse } from "next/og";
import { CLINIC_NAME } from "@/components/marketing/clinic-brand";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(160deg, #fbf8f3 0%, #ecf7f6 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 96,
            height: 96,
            borderRadius: 48,
            background: "#0e7490",
            color: "#ffffff",
            fontSize: 44,
            fontWeight: 700,
            marginBottom: 40,
          }}
        >
          LA
        </div>
        <div style={{ display: "flex", fontSize: 60, fontWeight: 900, color: "#241f19" }}>
          {CLINIC_NAME}
        </div>
        <div style={{ display: "flex", marginTop: 20, fontSize: 32, color: "#6b6355", maxWidth: 860 }}>
          Consulta, vacunación, cirugía y urgencias para tu mascota, con un equipo que la conoce desde la primera visita.
        </div>
      </div>
    ),
    size,
  );
}
