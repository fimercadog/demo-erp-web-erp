/**
 * Configuración Centralizada de la Empresa (Marca, Contacto, Sedes, Habilitación).
 * Permite cambiar la marca, líneas de atención y datos institucionales dinámicamente
 * consumiendo la información provista por la API o configuración del tenant.
 */

export interface CompanyBrandInfo {
  name?: string;
  slug?: string;
  nit?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  logo?: string;
  currency?: string;
  locale?: string;
}

export interface SedeInfo {
  id: string;
  isDemo?: boolean;
  name: string;
  address: string;
  phone: string;
  services: string;
  badge: string;
}

export const IPS_CONFIG = {
  // Configuración por defecto (Datos institucionales configurables)
  isDemoMode: false,
  demoNoticeText: "Información institucional configurable desde el panel de administración",

  brand: {
    name: "FidelOS",
    shortName: "FidelOS",
    tagline: "Atención Integral y Gestión Profesional",
    descriptor: "Prestador de Servicios",
    accreditation: "Información institucional y servicios disponibles según la configuración y habilitación aplicable",
  },

  // Estructura para datos de habilitación
  reps: {
    isDemo: false,
    notice: "Información de prestador y habilitación configurable en el ERP",
    codigoPrestador: "Configurable en ERP",
    codigoSedePrincipal: "Configurable por Sede",
    entidadTerritorial: "Dirección Territorial de Salud",
    estadoHabilitacion: "Activo",
    serviciosHabilitados: [
      "Consulta Externa",
      "Atención Especializada",
      "Procedimientos & Diagnóstico",
    ],
  },

  contact: {
    address: "Dirección principal configurable",
    city: "Ciudad configurable",
    phoneDisplay: "Teléfono configurable",
    phoneRaw: "",
    emergencyPhoneDisplay: "",
    emergencyPhoneRaw: "",
    whatsappDisplay: "",
    whatsappRaw: "",
    email: "contacto@empresa.com",
    schedule: "Horario de atención según configuración de sede",
    scheduleEmergency: "Servicios disponibles según la configuración institucional",
  },

  sedes: [] as SedeInfo[],

  social: {
    linkedin: "",
    facebook: "",
    whatsapp: "",
  },

  stats: [] as { value: string; label: string; isDemo?: boolean }[],
};

/**
 * Resuelve dinámicamente la configuración de marca a partir de los datos recibidos de la API.
 */
export function getCompanyBrandConfig(companyData?: CompanyBrandInfo | null) {
  if (!companyData) return IPS_CONFIG;

  return {
    ...IPS_CONFIG,
    brand: {
      ...IPS_CONFIG.brand,
      name: companyData.name || IPS_CONFIG.brand.name,
      shortName: companyData.name || IPS_CONFIG.brand.shortName,
    },
    contact: {
      ...IPS_CONFIG.contact,
      address: companyData.address || IPS_CONFIG.contact.address,
      city: companyData.city || IPS_CONFIG.contact.city,
      phoneDisplay: companyData.phone || IPS_CONFIG.contact.phoneDisplay,
      email: companyData.email || IPS_CONFIG.contact.email,
    },
  };
}
