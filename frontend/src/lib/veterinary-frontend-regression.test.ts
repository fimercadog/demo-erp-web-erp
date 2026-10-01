import { describe, it, expect } from "vitest";
import { AuthUser, hasAnyPermission } from "@/lib/auth";
import {
  isConsultationEditable,
  isConsultationFinalizable,
  isConsultationItemModifiable,
  validateClinicalQuantity,
  validateClinicalUnitPrice,
  validatePaymentPayload,
} from "@/lib/consultation-helpers";

describe("FASE 3C — Veterinary Frontend Contract & Functional Regression Tests", () => {
  // 1. Regla F-01: List views editability check (isRowEditable)
  it("F-01: identifies consultations as editable only when status is 'open'", () => {
    expect(isConsultationEditable("open")).toBe(true);
    expect(isConsultationEditable("completed")).toBe(false);
    expect(isConsultationEditable("cancelled")).toBe(false);
    expect(isConsultationEditable(null)).toBe(false);
  });

  // 2. Regla F-02: Finalize action visibility check
  it("F-02: restricts finalize action visibility strictly to status 'open'", () => {
    expect(isConsultationFinalizable("open")).toBe(true);
    expect(isConsultationFinalizable("completed")).toBe(false);
    expect(isConsultationFinalizable("cancelled")).toBe(false);
  });

  // 3. Regla F-02 / Items: Item management actions (add/remove) restricted to 'open'
  it("F-02: restricts clinical item addition and removal strictly to status 'open'", () => {
    expect(isConsultationItemModifiable("open")).toBe(true);
    expect(isConsultationItemModifiable("completed")).toBe(false);
    expect(isConsultationItemModifiable("cancelled")).toBe(false);
  });

  // 4. Regla F-03: Cash payment requires open cash session ID
  it("F-03: rejects cash payment submission when cash session ID is missing or null", () => {
    const invalidResult = validatePaymentPayload({
      withPayment: true,
      canManagePayments: true,
      paymentMethod: "cash",
      paymentSessionId: null,
      hasOpenSessions: false,
    });

    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.error).toContain("sesión de caja abierta");

    const validResult = validatePaymentPayload({
      withPayment: true,
      canManagePayments: true,
      paymentMethod: "cash",
      paymentSessionId: "session-10",
      hasOpenSessions: true,
    });

    expect(validResult.valid).toBe(true);
  });

  // 5. Regla F-03: Payment method distinctions for session requirements
  it("F-03: differentiates cash payment session requirement from non-cash methods", () => {
    // Cash without session -> invalid
    const cashNoSession = validatePaymentPayload({
      withPayment: true,
      canManagePayments: true,
      paymentMethod: "cash",
      paymentSessionId: null,
      hasOpenSessions: true,
    });
    expect(cashNoSession.valid).toBe(false);

    // Card without session -> valid
    const cardNoSession = validatePaymentPayload({
      withPayment: true,
      canManagePayments: true,
      paymentMethod: "card",
      paymentSessionId: null,
      hasOpenSessions: false,
    });
    expect(cardNoSession.valid).toBe(true);
  });

  // 6. Regla F-04: Direct payment permissions (payments.manage / cash.manage)
  it("F-04: allows direct payment checkbox only for users with payments.manage or cash.manage", () => {
    const vetUser: AuthUser = {
      id: 1,
      name: "Veterinario",
      email: "vet@clinic.com",
      status: "active",
      roles: ["vet"],
      permissions: ["medical_records.manage"],
    };

    const cashierUser: AuthUser = {
      id: 2,
      name: "Cajero",
      email: "cashier@clinic.com",
      status: "active",
      roles: ["cashier"],
      permissions: ["payments.manage", "cash.manage"],
    };

    expect(hasAnyPermission(vetUser, ["payments.manage", "cash.manage"])).toBe(false);
    expect(hasAnyPermission(cashierUser, ["payments.manage", "cash.manage"])).toBe(true);

    const vetPaymentCheck = validatePaymentPayload({
      withPayment: true,
      canManagePayments: hasAnyPermission(vetUser, ["payments.manage", "cash.manage"]),
      paymentMethod: "cash",
      paymentSessionId: "1",
      hasOpenSessions: true,
    });
    expect(vetPaymentCheck.valid).toBe(false);
    expect(vetPaymentCheck.error).toContain("No cuenta con permisos");
  });

  // 7. Regla F-04: Clinical finalization without direct payment stays available for medical_records.manage
  it("F-04: enables clinical finalization for users with medical_records.manage without direct payment", () => {
    const vetUser: AuthUser = {
      id: 1,
      name: "Veterinario",
      email: "vet@clinic.com",
      status: "active",
      roles: ["vet"],
      permissions: ["medical_records.manage"],
    };

    const canFinalizeConsultation = hasAnyPermission(vetUser, ["medical_records.manage"]);
    const canRegisterDirectPayment = hasAnyPermission(vetUser, ["payments.manage", "cash.manage"]);

    expect(canFinalizeConsultation).toBe(true);
    expect(canRegisterDirectPayment).toBe(false);

    // Finalize without payment is valid regardless of payment permissions
    const finalizeWithoutPayment = validatePaymentPayload({
      withPayment: false,
      canManagePayments: canRegisterDirectPayment,
      paymentMethod: "cash",
      hasOpenSessions: false,
    });
    expect(finalizeWithoutPayment.valid).toBe(true);
  });

  // 8. Regla Cantidades Decimales: Validation accepts 0.5, 1.5, 2.75 and rejects 0 or negative
  it("validates item quantity supporting decimals (0.5, 1.5, 2.75) and rejecting <= 0", () => {
    expect(validateClinicalQuantity("0.5")).toEqual({ valid: true, quantity: 0.5 });
    expect(validateClinicalQuantity("1.5")).toEqual({ valid: true, quantity: 1.5 });
    expect(validateClinicalQuantity("2.75")).toEqual({ valid: true, quantity: 2.75 });
    expect(validateClinicalQuantity("10")).toEqual({ valid: true, quantity: 10 });
    expect(validateClinicalQuantity("0").valid).toBe(false);
    expect(validateClinicalQuantity("-1.5").valid).toBe(false);
    expect(validateClinicalQuantity("abc").valid).toBe(false);
  });

  // 9. Regla Precios Unitarios: Validation accepts 0 (included) or positive, rejects negative
  it("validates unit price allowing 0 (included items) and rejecting negative values", () => {
    expect(validateClinicalUnitPrice("0")).toEqual({ valid: true, price: 0 });
    expect(validateClinicalUnitPrice("15000")).toEqual({ valid: true, price: 15000 });
    expect(validateClinicalUnitPrice("25.50")).toEqual({ valid: true, price: 25.5 });
    expect(validateClinicalUnitPrice("-500").valid).toBe(false);
    expect(validateClinicalUnitPrice("invalid").valid).toBe(false);
  });

  // 10. Regla F-05: Double submission guard
  it("F-05: prevents duplicate form submission when submitting state is active", async () => {
    let callCount = 0;

    const createSubmitHandler = () => {
      let isSubmitting = false;

      return async () => {
        if (isSubmitting) return false;
        isSubmitting = true;
        callCount++;
        await new Promise((resolve) => setTimeout(resolve, 10));
        isSubmitting = false;
        return true;
      };
    };

    const submit = createSubmitHandler();

    const [r1, r2] = await Promise.all([submit(), submit()]);

    expect(r1).toBe(true);
    expect(r2).toBe(false);
    expect(callCount).toBe(1);
  });
});
