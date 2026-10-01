export type Segment = {
  id: number;
  name: string;
  status: string;
  clients_count?: number;
};

export type Client = {
  id: number;
  name: string;
  company_name?: string | null;
  segment_id?: number | null;
  segment?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  status: string;
  notes?: string | null;
};

export type Contact = {
  id: number;
  name: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  status: string;
  client_id?: number | null;
  client?: string | null;
  created_at: string;
};

export type ClientNote = {
  id: number;
  client_id: number;
  client?: string | null;
  body: string;
  author?: string | null;
  created_at: string;
};

export type Deal = {
  id: number;
  client_id: number;
  client?: Client;
  title: string;
  amount: number;
  stage: string;
  expected_close_date?: string | null;
};

export type ActivityRow = {
  id: number;
  client_id?: number | null;
  client?: Client;
  deal_id?: number | null;
  type: string;
  subject: string;
  notes?: string | null;
  due_date?: string | null;
  completed: boolean;
};

export type Warehouse = {
  id: number;
  name: string;
  location?: string | null;
  status: string;
};

export type Category = {
  id: number;
  name: string;
  status: string;
  products_count?: number;
};

export type Brand = {
  id: number;
  name: string;
  status: string;
  products_count?: number;
};

export type Unit = {
  id: number;
  name: string;
  abbreviation?: string | null;
  status: string;
  products_count?: number;
};

export type Product = {
  id: number;
  sku: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  is_public?: boolean;
  category?: string | null;
  brand?: string | null;
  unit?: string | null;
  category_id?: number | null;
  brand_id?: number | null;
  unit_id?: number | null;
  unit_price: number;
  cost_price: number;
  reorder_level: number;
  stock_on_hand?: number;
  status: string;
};

export type Supplier = {
  id: number;
  name: string;
  contact_name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  status: string;
};

export type StockTransfer = {
  id: number;
  product_id: number;
  product?: string | null;
  from_warehouse_id: number;
  from_warehouse?: string | null;
  to_warehouse_id: number;
  to_warehouse?: string | null;
  quantity: number;
  reference?: string | null;
  notes?: string | null;
  status: string;
  created_at: string;
};

export type StockMovement = {
  id: number;
  product_id: number;
  product?: Product;
  warehouse_id: number;
  warehouse?: Warehouse;
  type: "in" | "out" | "adjustment" | "COMPRA" | "VENTA" | "DEVOLUCION_COMPRA" | "DEVOLUCION_VENTA" | "AJUSTE_ENTRADA" | "AJUSTE_SALIDA" | "TRASLADO";
  quantity: number;
  reason?: string | null;
  reference?: string | null;
  created_at: string;
};

export type QuoteLineItem = {
  id: number;
  product_id?: number | null;
  product?: string | null;
  description?: string | null;
  quantity: number;
  unit_price: number;
};

export type Quote = {
  id: number;
  title: string;
  client_id: number;
  client?: string | null;
  deal_id?: number | null;
  deal?: string | null;
  status: "draft" | "sent" | "accepted" | "rejected";
  source?: "internal" | "catalog";
  valid_until?: string | null;
  notes?: string | null;
  total: number;
  converted_order_id?: number | null;
  items?: QuoteLineItem[];
  created_at: string;
};

export type OrderLineItem = {
  id: number;
  product_id: number;
  /** Snapshot: el nombre del producto al momento de la venta. */
  product?: string | null;
  sku?: string | null;
  quantity: number;
  unit_price: number;
};

export type Order = {
  id: number;
  client_id: number;
  client?: Client;
  deal_id?: number | null;
  warehouse_id: number;
  warehouse?: Warehouse;
  status: "draft" | "confirmed" | "cancelled";
  total: number;
  items?: OrderLineItem[];
};

export type PurchaseOrderLineItem = {
  id: number;
  product_id: number;
  product?: string | null;
  sku?: string | null;
  quantity: number;
  received_quantity?: number;
  pending_quantity?: number;
  unit_cost: number;
  discount?: number;
  tax?: number;
  line_total?: number;
};

export type PurchaseOrder = {
  id: number;
  supplier_id: number;
  supplier?: Supplier;
  warehouse_id: number;
  warehouse?: Warehouse;
  status: "draft" | "ordered" | "partial" | "received" | "cancelled";
  order_date?: string | null;
  expected_date?: string | null;
  subtotal?: number;
  discount?: number;
  tax?: number;
  total: number;
  notes?: string | null;
  items?: PurchaseOrderLineItem[];
};

export type PurchaseReceipt = {
  id: number;
  purchase_order_id: number;
  warehouse_id: number;
  warehouse?: Warehouse;
  received_at?: string | null;
  status: "draft" | "confirmed" | "void";
  notes?: string | null;
  created_at: string;
};

export type Invoice = {
  id: number;
  number: string;
  client_id: number;
  client?: Client;
  order_id?: number | null;
  warehouse_id?: number | null;
  warehouse?: Warehouse;
  issue_date?: string | null;
  due_date?: string | null;
  status: "draft" | "issued" | "partially_paid" | "paid" | "void";
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  notes?: string | null;
  receivable?: AccountReceivable;
  created_at: string;
};

export type AccountReceivable = {
  id: number;
  client_id: number;
  client?: Client;
  invoice_id: number;
  invoice?: string | null;
  original_amount: number;
  paid_amount: number;
  balance: number;
  due_date?: string | null;
  status: "pending" | "partial" | "paid" | "overdue";
  created_at: string;
};

export type AccountPayable = {
  id: number;
  supplier_id: number;
  supplier?: Supplier;
  purchase_order_id?: number | null;
  purchase_receipt_id?: number | null;
  original_amount: number;
  paid_amount: number;
  balance: number;
  due_date?: string | null;
  status: "pending" | "partial" | "paid" | "overdue";
  created_at: string;
};

export type Payment = {
  id: number;
  direction: "in" | "out";
  paid_at: string;
  amount: number;
  method: string;
  reference?: string | null;
  notes?: string | null;
  target_type: "receivable" | "payable";
  target_id: number;
  cash_session_id?: number | null;
  created_at: string;
};

export type CashRegister = {
  id: number;
  name: string;
  status: string;
  created_at: string;
};

export type CashSession = {
  id: number;
  cash_register_id: number;
  register?: CashRegister;
  opened_at?: string | null;
  closed_at?: string | null;
  opening_amount: number;
  expected_amount: number;
  closing_amount?: number | null;
  difference?: number | null;
  status: "open" | "closed";
  notes?: string | null;
  created_at: string;
};

export type CashMovement = {
  id: number;
  cash_session_id: number;
  type: "in" | "out";
  amount: number;
  method: string;
  reference?: string | null;
  notes?: string | null;
  created_at: string;
};

export type Role = {
  id: number;
  name: string;
  guard_name: string;
  status: string;
  permissions_count?: number;
  permissions?: string[];
};

export type AppUser = {
  id: number;
  name: string;
  email: string;
  status: string;
  role?: string;
  roles: string[];
};

/* ---- Vertical veterinaria ---- */

export type Species = {
  id: number;
  name: string;
  status: string;
  breeds_count?: number;
};

export type Breed = {
  id: number;
  name: string;
  status: string;
  species_id: number;
  species?: string | null;
};

export type Service = {
  id: number;
  name: string;
  description?: string | null;
  type?: string | null;
  estimated_duration_minutes?: number | null;
  price: number | string;
  status: string;
};

export type AppointmentStatus = "scheduled" | "confirmed" | "attended" | "no_show" | "cancelled";

export type Appointment = {
  id: number;
  patient_id: number;
  patient?: string | null;
  species?: string | null;
  client_id?: number | null;
  client?: string | null;
  service_id?: number | null;
  service?: string | null;
  practitioner_id?: number | null;
  practitioner?: string | null;
  starts_at: string;
  ends_at: string;
  duration_minutes: number;
  resource?: string | null;
  reason?: string | null;
  status: AppointmentStatus;
  notes?: string | null;
};

export type Diagnosis = {
  id: number;
  code?: string | null;
  name: string;
  status: string;
};

export type PrescriptionItem = {
  id?: number;
  product_id?: number | null;
  medication_name: string;
  sku?: string | null;
  dosage?: string | null;
  frequency?: string | null;
  duration?: string | null;
};

export type Prescription = {
  id: number;
  consultation_id: number;
  patient_id: number;
  patient?: string | null;
  vet_id?: number | null;
  vet?: string | null;
  notes?: string | null;
  created_at?: string;
  items?: PrescriptionItem[];
};

export type Procedure = {
  id: number;
  patient_id: number;
  patient?: string | null;
  consultation_id?: number | null;
  service_id?: number | null;
  service?: string | null;
  vet_id?: number | null;
  vet?: string | null;
  type: string;
  price?: number;
  status?: string;
  performed_at: string;
  notes?: string | null;
  consent_document_url?: string | null;
};

export type ClinicalApplication = {
  id: number;
  type: "vaccine" | "deworming";
  patient_id: number;
  patient?: string | null;
  product_id?: number | null;
  product?: string | null;
  consultation_id?: number | null;
  vet_id?: number | null;
  vet?: string | null;
  stock_movement_id?: number | null;
  name: string;
  applied_at: string;
  lot?: string | null;
  expires_at?: string | null;
  next_due_at?: string | null;
};

export type ConsultationItem = {
  id: number;
  consultation_id: number;
  item_type: "service" | "procedure" | "medication" | "supply" | "product";
  product_id?: number | null;
  product?: string | null;
  service_id?: number | null;
  service?: string | null;
  procedure_id?: number | null;
  name: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  is_billable: boolean;
  is_inventoriable: boolean;
  line_total?: number;
  stock_movement_id?: number | null;
  notes?: string | null;
  created_at?: string;
};

export type Consultation = {
  id: number;
  patient_id: number;
  patient?: any;
  appointment_id?: number | null;
  vet_id?: number | null;
  vet?: string | null;
  service_id?: number | null;
  service?: string | null;
  price?: number;
  status: "open" | "completed" | "cancelled";
  invoice_id?: number | null;
  invoice?: {
    id: number;
    number: string;
    status: string;
    total: number;
    account_receivable?: {
      id: number;
      balance: number;
      status: string;
    } | null;
  } | null;
  warehouse_id?: number | null;
  warehouse?: string | null;
  finalized_at?: string | null;
  date: string;
  reason: string;
  weight?: number | string | null;
  temperature?: number | string | null;
  subjective?: string | null;
  objective?: string | null;
  assessment?: string | null;
  plan?: string | null;
  diagnoses?: { id: number; name: string; code?: string }[];
  items?: ConsultationItem[];
  created_at?: string;
};

export type Patient = {
  id: number;
  name: string;
  sex: "male" | "female" | "unknown";
  birth_date?: string | null;
  weight?: number | string | null;
  microchip?: string | null;
  sterilized: boolean;
  photo_url?: string | null;
  status: string;
  client_id: number;
  client?: string | null;
  species_id: number;
  species?: string | null;
  breed_id?: number | null;
  breed?: string | null;
  deleted_at?: string | null;
};
