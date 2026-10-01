import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";
import { CLINIC_NAME } from "@/components/marketing/clinic-brand";

export const metadata: Metadata = {
  title: "Terminos y Condiciones",
  description: "Condiciones de uso del sitio web y de las solicitudes de cita y contacto.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terminos y Condiciones"
      updated="30 de agosto de 2026"
      intro={`Estos terminos regulan el acceso y uso de este sitio web, operado por [Razon social] (${CLINIC_NAME}), NIT [NIT]. Al navegar el sitio o enviar un formulario aceptas estos terminos.`}
      sections={[
        {
          heading: "1. Objeto del sitio",
          body: [
            "Este sitio tiene una finalidad informativa: presentar los servicios de la clínica y su equipo, y permitir solicitar una cita o enviar una consulta.",
            "El acceso al panel privado de gestión de la clínica requiere credenciales asignadas al personal y se rige por su propia política interna; no está dirigido al público general.",
          ],
        },
        {
          heading: "2. Uso permitido",
          body: [
            "Te comprometes a usar el sitio de forma licita, a no interferir con su funcionamiento, a no intentar acceder a areas restringidas y a proporcionar informacion veraz en los formularios.",
          ],
        },
        {
          heading: "3. Propiedad intelectual",
          body: [
            "Las marcas, logotipos, textos, disenos e interfaces del sitio son propiedad de [Razon social] o de sus licenciantes. No se autoriza su reproduccion, distribucion o uso sin autorizacion previa y escrita.",
          ],
        },
        {
          heading: "4. Solicitudes de cita y contacto",
          body: [
            "El envio de un formulario no confirma automaticamente una cita: la clínica confirma disponibilidad y se pone en contacto para agendarla. Cualquier presupuesto de procedimiento se entrega por escrito antes de proceder.",
            "El tratamiento de los datos enviados a traves de los formularios se rige por la Politica de Tratamiento de Datos Personales.",
          ],
        },
        {
          heading: "5. Disponibilidad y contenido",
          body: [
            "El sitio se ofrece \"tal cual\". Procuramos que la informacion este actualizada, pero puede contener imprecisiones o estar sujeta a cambios sin previo aviso. No garantizamos disponibilidad ininterrumpida.",
          ],
        },
        {
          heading: "6. Enlaces de terceros",
          body: [
            "El sitio puede incluir enlaces a servicios de terceros (por ejemplo, WhatsApp). No somos responsables del contenido ni de las politicas de esos servicios.",
          ],
        },
        {
          heading: "7. Limitacion de responsabilidad",
          body: [
            "En la medida permitida por la ley, [Razon social] no sera responsable por danos indirectos o lucro cesante derivados del uso del sitio o de la imposibilidad de usarlo.",
          ],
        },
        {
          heading: "8. Ley aplicable y jurisdiccion",
          body: [
            "Estos terminos se rigen por las leyes de la Republica de Colombia. Cualquier controversia se sometera a los jueces competentes de [ciudad], Colombia.",
          ],
        },
        {
          heading: "Nota",
          body: [
            "Este documento es una plantilla base y debe ser revisada y completada (datos entre corchetes) por un abogado antes de su uso comercial definitivo.",
          ],
        },
      ]}
    />
  );
}
