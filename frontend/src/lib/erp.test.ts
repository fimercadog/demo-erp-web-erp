import { describe, it, expect } from "vitest";

describe("ERP Totals & Monetary Arithmetic (Frontend Unit)", () => {
  it("calculates line items with price, discount, and tax", () => {
    const items = [
      { quantity: 3, unit_price: 15000, discount: 5000, tax: 7600 },
      { quantity: 2, unit_price: 30000, discount: 0, tax: 11400 },
    ];

    let subtotal = 0;
    let discount = 0;
    let tax = 0;

    const calculated = items.map((it) => {
      const lineSubtotal = Math.round(it.quantity * it.unit_price * 100) / 100;
      const lineTotal = Math.round((lineSubtotal - it.discount + it.tax) * 100) / 100;
      subtotal += lineSubtotal;
      discount += it.discount;
      tax += it.tax;
      return { ...it, lineSubtotal, lineTotal };
    });

    const total = Math.round((subtotal - discount + tax) * 100) / 100;

    expect(subtotal).toBe(105000);
    expect(discount).toBe(5000);
    expect(tax).toBe(19000);
    expect(total).toBe(119000);
    expect(calculated[0].lineTotal).toBe(47600);
    expect(calculated[1].lineTotal).toBe(71400);
  });

  it("handles 100% discount and zero total", () => {
    const items = [{ quantity: 2, unit_price: 50000, discount: 100000, tax: 0 }];
    const lineSubtotal = items[0].quantity * items[0].unit_price;
    const lineTotal = lineSubtotal - items[0].discount + items[0].tax;

    expect(lineSubtotal).toBe(100000);
    expect(lineTotal).toBe(0);
  });

  it("handles extreme large values with decimal precision", () => {
    const quantity = 10000;
    const unitPrice = 25000000.5;
    const discount = 500000;
    const tax = 47500000000;

    const subtotal = Math.round(quantity * unitPrice * 100) / 100;
    const total = Math.round((subtotal - discount + tax) * 100) / 100;

    expect(subtotal).toBe(250000005000);
    expect(total).toBe(297500005000 - 500000);
  });
});

describe("ERP Accounts Receivable & Payable Logic (Frontend Unit)", () => {
  it("calculates account balance accurately after partial and full payments", () => {
    const originalAmount = 1000000;
    const payments = [300000, 700000];

    let paidAmount = 0;
    let balance = originalAmount;
    let status: "pending" | "partial" | "paid" = "pending";

    // First payment
    paidAmount += payments[0];
    balance = Math.round((originalAmount - paidAmount) * 100) / 100;
    status = balance <= 0 ? "paid" : paidAmount > 0 ? "partial" : "pending";

    expect(paidAmount).toBe(300000);
    expect(balance).toBe(700000);
    expect(status).toBe("partial");

    // Second payment
    paidAmount += payments[1];
    balance = Math.round((originalAmount - paidAmount) * 100) / 100;
    status = balance <= 0 ? "paid" : paidAmount > 0 ? "partial" : "pending";

    expect(paidAmount).toBe(1000000);
    expect(balance).toBe(0);
    expect(status).toBe("paid");
  });

  it("detects overpayment attempts exceeding current balance", () => {
    const currentBalance = 450000;
    const paymentValid = 450000;
    const paymentOver = 450000.01;

    const isValid1 = paymentValid > 0 && paymentValid <= currentBalance;
    const isValid2 = paymentOver > 0 && paymentOver <= currentBalance;

    expect(isValid1).toBe(true);
    expect(isValid2).toBe(false);
  });
});

describe("ERP Cash Session & Arqueo Calculations (Frontend Unit)", () => {
  it("computes cash session difference on closing with exact match", () => {
    const openingAmount = 100000;
    const movements = [
      { type: "in", amount: 50000 },
      { type: "in", amount: 30000 },
      { type: "out", amount: -20000 },
    ];

    const movementSum = movements.reduce((acc, m) => acc + m.amount, 0);
    const expectedAmount = openingAmount + movementSum;
    const actualClosingAmount = 160000;
    const difference = Math.round((actualClosingAmount - expectedAmount) * 100) / 100;

    expect(expectedAmount).toBe(160000);
    expect(difference).toBe(0);
  });

  it("computes cash session surplus (sobrante) and deficit (faltante)", () => {
    const openingAmount = 200000;
    const movements = [{ type: "in", amount: 50000 }];
    const expectedAmount = openingAmount + movements[0].amount; // 250000

    const surplusClosing = 255000;
    const surplusDiff = surplusClosing - expectedAmount;
    expect(surplusDiff).toBe(5000);

    const deficitClosing = 242000;
    const deficitDiff = deficitClosing - expectedAmount;
    expect(deficitDiff).toBe(-8000);
  });
});

describe("ERP Inventory & Purchase Logic (Frontend Unit)", () => {
  it("computes cumulative stock from various movement types including CONSUMO_CLINICO", () => {
    const initialStock = 80;
    const movements = [
      { type: "COMPRA", qty: 40 },
      { type: "VENTA", qty: -25 },
      { type: "CONSUMO_CLINICO", qty: -5 },
      { type: "DEVOLUCION_VENTA", qty: 5 },
      { type: "DEVOLUCION_COMPRA", qty: -10 },
      { type: "AJUSTE_ENTRADA", qty: 10 },
      { type: "AJUSTE_SALIDA", qty: -15 },
    ];

    const finalStock = movements.reduce((acc, m) => acc + m.qty, initialStock);
    // 80 + 40 - 25 - 5 + 5 - 10 + 10 - 15 = 80
    expect(finalStock).toBe(80);
  });

  it("calculates purchase order item pending quantity and order status", () => {
    const orderedQuantity = 100;
    const receivedQuantity = 45;
    const pending = Math.max(0, orderedQuantity - receivedQuantity);

    expect(pending).toBe(55);

    const status = pending === 0 ? "received" : receivedQuantity > 0 ? "partial" : "confirmed";
    expect(status).toBe("partial");
  });
});

describe("Veterinary Clinical & ERP Billing Logic (Frontend Unit)", () => {
  it("calculates consultation billable totals accurately separating billable vs included items", () => {
    const consultationFee = 75000;
    const clinicalItems = [
      { name: "Antibiótico inyectable", unit_price: 28000, quantity: 1, is_billable: true, is_inventoriable: true },
      { name: "Jeringa 3ml", unit_price: 0, quantity: 2, is_billable: false, is_inventoriable: true },
      { name: "Curación herida", unit_price: 30000, quantity: 1, is_billable: true, is_inventoriable: false },
      { name: "Guantes examen", unit_price: 0, quantity: 1, is_billable: false, is_inventoriable: true },
    ];

    const billableSum = clinicalItems.reduce((acc, it) => acc + (it.is_billable ? it.unit_price * it.quantity : 0), 0);
    const totalInvoice = consultationFee + billableSum;

    // 75000 + 28000 + 30000 = 133000
    expect(billableSum).toBe(58000);
    expect(totalInvoice).toBe(133000);

    // Contar cuántos ítems descuentan inventario
    const stockOutCount = clinicalItems.filter((it) => it.is_inventoriable).length;
    expect(stockOutCount).toBe(3); // Antibiótico + Jeringa + Guantes
  });
});
