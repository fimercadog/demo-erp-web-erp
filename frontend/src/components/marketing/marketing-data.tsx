import {
  Activity,
  CalendarDays,
  FlaskConical,
  HeartPulse,
  PawPrint,
  Pill,
  Scissors,
  ShieldCheck,
  Siren,
  Sparkles,
  Stethoscope,
  Syringe,
  type LucideIcon,
} from "lucide-react";

export type Service = {
  slug: string;
  icon: LucideIcon;
  title: string;
  short: string;
  description: string;
  bullets: string[];
  featured?: boolean;
};

export const services: Service[] = [
  {
    slug: "consulta-veterinaria",
    icon: Stethoscope,
    title: "Consulta Veterinaria General",
    short: "Evaluación clínica completa de tu mascota: diagnóstico, tratamiento y seguimiento personalizado.",
    description:
      "Atención médica primaria para perros, gatos y animales exóticos. Examen físico detallado, revisión de historia clínica y formulación del plan de tratamiento adecuado para cada paciente.",
    bullets: [
      "Examen físico completo y valoración de signos vitales",
      "Historia clínica digital por paciente",
      "Formulación de tratamientos y remisión a especialistas",
      "Seguimiento post-consulta por WhatsApp",
    ],
    featured: true,
  },
  {
    slug: "vacunacion-medicina-preventiva",
    icon: Syringe,
    title: "Vacunación y Medicina Preventiva",
    short: "Esquemas de vacunación completos y planes de desparasitación para una mascota sana y protegida.",
    description:
      "Programa preventivo adaptado a la especie, raza y estilo de vida de tu mascota. Incluye vacunas esenciales y opcionales, desparasitación interna y externa, y carnet de vacunación digital.",
    bullets: [
      "Vacuna séxtuple, rabia y bordetella (perros)",
      "Vacuna triple felina y leucemia (gatos)",
      "Desparasitación interna y antiparasitario externo",
      "Carnet digital de vacunación y recordatorios",
    ],
    featured: true,
  },
  {
    slug: "cirugia-veterinaria",
    icon: Activity,
    title: "Cirugía Veterinaria",
    short: "Procedimientos quirúrgicos con anestesia monitoreada, instrumentación moderna y recuperación supervisada.",
    description:
      "Realizamos cirugías de tejidos blandos, esterilizaciones y procedimientos ortopédicos bajo los más altos estándares de asepsia y monitoreo anestésico.",
    bullets: [
      "Esterilización (ovariohisterectomía / orquiectomía)",
      "Cirugía de tejidos blandos y heridas",
      "Monitoreo anestésico completo",
      "Hospitalización y cuidados postoperatorios",
    ],
    featured: true,
  },
  {
    slug: "laboratorio-clinico-veterinario",
    icon: FlaskConical,
    title: "Laboratorio Clínico Veterinario",
    short: "Hemogramas, bioquímicas, cultivos y pruebas rápidas con resultados el mismo día.",
    description:
      "Laboratorio en sede con equipos automatizados para diagnóstico rápido y preciso. Resultados entregados digitalmente y con interpretación del médico tratante.",
    bullets: [
      "Hemograma completo y diferencial",
      "Perfil bioquímico y hepático/renal",
      "Pruebas de Ehrlichia, Parvo y Leishmania",
      "Urianálisis y copro-parasitológico",
    ],
    featured: true,
  },
  {
    slug: "urgencias-veterinarias",
    icon: Siren,
    title: "Urgencias Veterinarias",
    short: "Atención de emergencias los 7 días de la semana para situaciones que no pueden esperar.",
    description:
      "Servicio de urgencias con médico veterinario de turno, UCI veterinaria básica y coordinación de traslados especializados cuando se requiera.",
    bullets: [
      "Atención inmediata por urgencias",
      "Soporte de fluidos, oxigenoterapia y monitoreo",
      "Estabilización y manejo del dolor agudo",
      "Coordinación con clínicas especializadas",
    ],
    featured: true,
  },
  {
    slug: "imagenes-diagnosticas-veterinarias",
    icon: HeartPulse,
    title: "Imágenes Diagnósticas",
    short: "Radiografía digital y ecografía abdominal para diagnóstico no invasivo.",
    description:
      "Servicio de ayuda diagnóstica con radiografía digital de alta resolución y ecografía general. Informes interpretados por el médico veterinario tratante.",
    bullets: [
      "Radiografía digital de tórax, abdomen y huesos",
      "Ecografía abdominal y reproductiva",
      "Ecocardiografía básica",
      "Informes con imágenes adjuntas",
    ],
  },
  {
    slug: "peluqueria-estetica-veterinaria",
    icon: Scissors,
    title: "Peluquería y Estética",
    short: "Baño medicado, corte de pelo y limpieza de oídos con productos dermatológicos seguros.",
    description:
      "Servicio de estética y bienestar con personal entrenado. Utilizamos shampoos y productos dermatológicos adecuados para cada tipo de piel y pelaje.",
    bullets: [
      "Baño con shampoo medicado o neutro",
      "Corte de pelo según estándar de raza",
      "Limpieza de oídos y corte de uñas",
      "Tratamiento antiparasitario tópico",
    ],
  },
  {
    slug: "medicina-preventiva",
    icon: ShieldCheck,
    title: "Medicina Preventiva",
    short: "Chequeos anuales, control de peso, salud dental y nutrición para una vida larga y saludable.",
    description:
      "Programa de salud preventiva diseñado para detectar tempranamente enfermedades y mantener a tu mascota en óptimas condiciones a lo largo de su vida.",
    bullets: [
      "Chequeo geriátrico y control anual",
      "Profilaxis dental con ultrasonido",
      "Asesoría nutricional por etapa de vida",
      "Microchip e identificación oficial",
    ],
  },
];

export const featuredServices = services.filter((s) => s.featured);

export function serviceBySlug(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}

export type TeamMember = {
  slug: string;
  name: string;
  role: string;
  specialty: string;
  bio: string;
  longBio: string;
  isDemo?: boolean;
};

export const team: TeamMember[] = [
  {
    slug: "carlos-medina",
    name: "Dr. Carlos Medina",
    role: "Director Médico Veterinario (Demo)",
    specialty: "Medicina Interna & Cirugía de Tejidos Blandos",
    bio: "Más de 10 años de experiencia en medicina interna veterinaria y cirugía de tejidos blandos en perros y gatos.",
    longBio:
      "El Dr. Carlos Medina dirige el equipo médico de la Clínica Veterinaria Los Andes. Su enfoque combina el rigor diagnóstico de la medicina interna con un trato cercano y empático hacia las mascotas y sus familias. Especializado en casos complejos de gastroenterología y hepatología veterinaria.",
    isDemo: true,
  },
  {
    slug: "laura-pena",
    name: "Dra. Laura Peña",
    role: "Médica Veterinaria Especialista (Demo)",
    specialty: "Dermatología & Medicina Felina",
    bio: "Especialista en enfermedades dermatológicas, alergias y medicina especializada en gatos.",
    longBio:
      "La Dra. Laura Peña lidera la consulta de dermatología veterinaria y la atención de pacientes felinos. Apasionada por la medicina felina, ofrece consultas tranquilas con manejo mínimo de estrés para los gatos, y asesora a los propietarios en nutrición y enriquecimiento ambiental.",
    isDemo: true,
  },
  {
    slug: "sofia-mercado",
    name: "Dra. Sofía Mercado",
    role: "Veterinaria de Urgencias (Demo)",
    specialty: "Urgencias & Cuidados Críticos",
    bio: "Especializada en manejo de emergencias, soporte vital y estabilización de pacientes críticos.",
    longBio:
      "La Dra. Sofía Mercado coordina el servicio de urgencias de la clínica. Con formación en cuidados críticos veterinarios, garantiza que cada paciente de emergencia reciba atención inmediata y protocolar.",
    isDemo: true,
  },
  {
    slug: "marcela-duarte",
    name: "Marcela Duarte",
    role: "Coordinadora de Recepción (Demo)",
    specialty: "Atención al Cliente & Agendamiento",
    bio: "Primer punto de contacto para agendamiento, orientación a los propietarios y coordinación de citas.",
    longBio:
      "Marcela coordina la agenda, admisiones y comunicación con los propietarios. Se asegura de que cada visita sea eficiente y que los dueños de mascotas salgan con toda la información que necesitan para el cuidado en casa.",
    isDemo: true,
  },
];

export function teamBySlug(slug: string): TeamMember | undefined {
  return team.find((t) => t.slug === slug);
}

export type Testimonial = {
  name: string;
  pet: string;
  text: string;
  rating: number;
};

export const testimonials: Testimonial[] = [
  {
    name: "Valentina Rodríguez",
    pet: "Propietaria de Max, Golden Retriever (Demo)",
    text: "El Dr. Medina operó a Max de una hernia y el seguimiento fue impecable. Nos explicaron todo el proceso con mucha calma y Max se recuperó en tiempo récord.",
    rating: 5,
  },
  {
    name: "Andrés Castillo",
    pet: "Propietario de Luna y Mochi, gatos (Demo)",
    text: "La Dra. Peña es increíble con los gatos. Maneja a Luna con mucha suavidad y por fin logramos un diagnóstico correcto para su alergia crónica.",
    rating: 5,
  },
  {
    name: "Carolina Mejía",
    pet: "Propietaria de Teo, Bulldog Francés (Demo)",
    text: "Llevé a Teo a urgencias un domingo a las 10 pm. La atención fue inmediata, lo estabilizaron esa noche y al día siguiente ya estaba en casa recuperándose.",
    rating: 5,
  },
  {
    name: "Felipe Vargas",
    pet: "Propietario de Cleo, Beagle (Demo)",
    text: "Gracias al programa preventivo detectamos a tiempo que Cleo tenía una infección renal leve. El seguimiento online por WhatsApp es muy conveniente.",
    rating: 5,
  },
];

export type Faq = { question: string; answer: string };

export const faqs: Faq[] = [
  {
    question: "¿Cómo puedo agendar una cita en la Clínica Veterinaria Los Andes?",
    answer:
      "Puedes agendar directamente desde nuestro sitio web en 'Agendar Cita', por WhatsApp al +57 305 814 8918 o llamando al +57 601 555 0188 en horario de atención.",
  },
  {
    question: "¿Atienden urgencias veterinarias fuera del horario normal?",
    answer:
      "Sí. Contamos con servicio de urgencias los 7 días de la semana. Para urgencias nocturnas comunícate al +57 305 814 8918 antes de venir para coordinar la atención.",
  },
  {
    question: "¿Qué necesito llevar a la primera consulta?",
    answer:
      "Lleva el carnet de vacunación de tu mascota (si lo tiene), cualquier medicamento que esté tomando actualmente y, si es posible, una muestra de orina o heces cuando lo solicitemos previamente.",
  },
  {
    question: "¿Cuánto tiempo tarda en estar disponible el resultado de laboratorio?",
    answer:
      "Los exámenes de rutina (hemograma, bioquímica) están disponibles el mismo día, generalmente en 2-4 horas. Los cultivos y pruebas especiales pueden tardar 24-72 horas.",
  },
  {
    question: "¿Realizan esterilizaciones y cuál es el proceso?",
    answer:
      "Sí. Realizamos esterilizaciones en perros y gatos a partir de los 6 meses. El proceso incluye examen prequirúrgico, análisis de sangre previo, cirugía y hospitalización de observación. Consúltanos por el protocolo completo.",
  },
];

export type Stat = { value: string; label: string };

export const stats: Stat[] = [
  { value: "+8.000", label: "mascotas atendidas" },
  { value: "+12", label: "veterinarios y especialistas" },
  { value: "7 días", label: "servicio de urgencias" },
  { value: "98%", label: "satisfacción de propietarios" },
];

export type BlogPost = {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  image: string;
  authorSlug: string;
  date: string;
  readMinutes: number;
  body: string[];
};

export const blogCategories = ["Medicina Preventiva", "Nutrición", "Cirugía", "Dermatología", "Urgencias"];

export const blogPosts: BlogPost[] = [
  {
    slug: "chequeo-anual-mascotas",
    title: "Por qué el chequeo anual puede salvarle la vida a tu mascota",
    category: "Medicina Preventiva",
    excerpt:
      "Muchas enfermedades en perros y gatos no muestran síntomas hasta etapas avanzadas. Conoce qué incluye un chequeo preventivo completo y por qué hacerlo cada año.",
    image: "/gallery/veterinarian-3.jpg",
    authorSlug: "carlos-medina",
    date: "2026-09-10",
    readMinutes: 4,
    body: [
      "Enfermedades como la insuficiencia renal, el hipotiroidismo o las cardiopatías en mascotas suelen ser silenciosas durante meses. Un chequeo preventivo anual permite detectarlas a tiempo con un examen físico completo y análisis de laboratorio.",
      "En un chequeo anual revisamos peso e índice corporal, salud dental, estado de la piel y pelaje, función cardíaca y pulmonar, y realizamos hemograma y bioquímica básica. En mascotas mayores de 7 años recomendamos un perfil geriátrico más completo.",
      "La medicina preventiva es la inversión más inteligente que puedes hacer por tu mascota. Detectar una alteración renal leve hoy cuesta mucho menos —en dinero y en sufrimiento— que tratar una insuficiencia avanzada mañana.",
    ],
  },
  {
    slug: "vacunacion-perros-gatos-colombia",
    title: "Guía completa de vacunación para perros y gatos en Colombia",
    category: "Medicina Preventiva",
    excerpt:
      "¿Cuáles vacunas son obligatorias? ¿Cada cuánto se refuerzan? Todo lo que debes saber para mantener el esquema de tu mascota al día.",
    image: "/gallery/pet-1.jpg",
    authorSlug: "laura-pena",
    date: "2026-08-20",
    readMinutes: 5,
    body: [
      "En Colombia la vacuna antirrábica es de carácter obligatorio para perros y gatos por ley. Sin embargo, un esquema completo protege contra muchas más enfermedades graves.",
      "Para perros recomendamos: vacuna séxtuple (Distemper, Hepatitis, Parvovirus, Parainfluenza, Leptospirosis y Coronavirus) desde las 6-8 semanas con refuerzos cada 3-4 semanas hasta las 16 semanas, y luego anual. La rabia se aplica a partir de los 3 meses y se refuerza anualmente.",
      "Para gatos: vacuna triple felina (Rinotraqueitis, Calicivirus, Panleucopenia) desde las 8 semanas con refuerzo a las 12 y 16 semanas, y luego anual. La vacuna de leucemia felina es especialmente importante en gatos con acceso al exterior.",
    ],
  },
  {
    slug: "cuidados-postoperatorios-mascotas",
    title: "Cuidados esenciales en casa después de una cirugía veterinaria",
    category: "Cirugía",
    excerpt:
      "Una buena recuperación en casa es tan importante como la cirugía misma. Aquí está todo lo que debes hacer —y evitar— en los primeros 10 días.",
    image: "/gallery/paw-procedure.jpg",
    authorSlug: "sofia-mercado",
    date: "2026-07-15",
    readMinutes: 4,
    body: [
      "Las primeras 24 horas después de una cirugía son críticas. Tu mascota puede estar desorientada por la anestesia residual, con somnolencia y poco apetito. Esto es completamente normal.",
      "Lo más importante: mantener la herida limpia y seca, usar el collar isabelino sin excepción, administrar los medicamentos exactamente como te los indicamos y evitar que tu mascota salte o haga ejercicio intenso durante al menos 10 días.",
      "Señales de alarma que requieren consulta inmediata: enrojecimiento o secreción en la herida, fiebre, decaimiento profundo después de las primeras 24 horas, o que el animal no coma nada después de 48 horas.",
    ],
  },
];

export function blogPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

export function relatedPosts(post: BlogPost, limit = 3): BlogPost[] {
  return blogPosts
    .filter((p) => p.slug !== post.slug)
    .sort((a, b) => (a.category === post.category ? -1 : 0) - (b.category === post.category ? -1 : 0))
    .slice(0, limit);
}

export function adjacentPosts(post: BlogPost): { prev: BlogPost | null; next: BlogPost | null } {
  const i = blogPosts.findIndex((p) => p.slug === post.slug);
  return {
    prev: i > 0 ? blogPosts[i - 1] : null,
    next: i < blogPosts.length - 1 ? blogPosts[i + 1] : null,
  };
}
