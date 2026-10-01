/**
 * Reglas de negocio y validaciones del módulo de Consultas Veterinarias (Frontend ERP).
 */

export function isConsultationEditable(status?: string | null): boolean {
  return status === "open";
}

export function isConsultationFinalizable(status?: string | null): boolean {
  return status === "open";
}

export function isConsultationItemModifiable(status?: string | null): boolean {
  return status === "open";
}

export function validateClinicalQuantity(value: string | number): { valid: boolean; quantity: number; error?: string } {
  const qty = typeof value === "number" ? value : parseFloat(String(value));
  if (isNaN(qty) || qty <= 0) {
    return { valid: false, quantity: 0, error: "La cantidad debe ser mayor a 0." };
  }
  return { valid: true, quantity: qty };
}

export function validateClinicalUnitPrice(value: string | number): { valid: boolean; price: number; error?: string } {
  const price = typeof value === "number" ? value : parseFloat(String(value));
  if (isNaN(price) || price < 0) {
    return { valid: false, price: 0, error: "El precio unitario debe ser mayor o igual a 0." };
  }
  return { valid: true, price };
}

export function validatePaymentPayload(params: {
  withPayment: boolean;
  canManagePayments: boolean;
  paymentMethod: string;
  paymentSessionId?: string | number | null;
  hasOpenSessions: boolean;
}): { valid: boolean; error?: string } {
  if (!params.withPayment) return { valid: true };

  if (!params.canManagePayments) {
    return { valid: false, error: "No cuenta con permisos de caja o pagos para registrar el cobro." };
  }

  if (params.paymentMethod === "cash") {
    if (!params.paymentSessionId || !params.hasOpenSessions) {
      return { valid: false, error: "Para cobro en efectivo se requiere una sesión de caja abierta." };
    }
  }

  return { valid: true };
}
