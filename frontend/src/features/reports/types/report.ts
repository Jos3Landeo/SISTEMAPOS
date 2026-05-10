import type { User } from "../../auth/types/auth";
import type { Product } from "../../products/types/product";

export type ReportPaymentMethodOption = {
  id: string;
  name: string;
  code: string;
};

export type ReportUserOption = {
  id: string;
  full_name: string;
  username: string;
};

export type ReportNamedAmount = {
  label: string;
  amount: string;
};

export type VentasDiaResumen = {
  total_vendido: string;
  cantidad_ventas: number;
  cantidad_ventas_completadas: number;
  cantidad_ventas_anuladas: number;
  ticket_promedio: string;
  total_bruto: string;
  total_anulado: string;
  total_descuentos: string;
  total_efectivo: string;
  total_tarjeta: string;
  total_transferencia: string;
  total_otros: string;
  otros_desglose: ReportNamedAmount[];
};

export type VentaDiaItem = {
  id: string;
  folio: string;
  fecha_hora: string;
  hora: string;
  cajero: string;
  metodo_pago: string;
  total: string;
  estado: string;
};

export type VentasDiaReport = {
  fecha: string;
  generado_en: string;
  periodo_desde?: string | null;
  periodo_hasta?: string | null;
  resumen: VentasDiaResumen;
  ventas: VentaDiaItem[];
  filtros_disponibles: {
    metodos_pago: ReportPaymentMethodOption[];
    cajeros: ReportUserOption[];
    estados: string[];
  };
};

export type CajaDiariaMovimiento = {
  id: string;
  fecha_hora: string;
  tipo: "income" | "withdrawal";
  monto: string;
  motivo: string;
  observacion?: string | null;
  usuario: string;
};

export type CajaDiariaVenta = {
  id: string;
  folio: string;
  fecha_hora: string;
  cajero: string;
  metodo_pago: string;
  total: string;
  estado: string;
};

export type CajaDiariaResumen = {
  ventas_registradas: number;
  ventas_completadas: number;
  ventas_anuladas: number;
  total_bruto: string;
  total_anulado: string;
  total_descuentos: string;
  total_vendido: string;
  total_efectivo: string;
  total_tarjeta: string;
  total_transferencia: string;
  total_otros: string;
  otros_desglose: ReportNamedAmount[];
  caja_inicial: string;
  ingresos_manuales: string;
  retiros_manuales: string;
  caja_esperada: string;
  caja_contada?: string | null;
  diferencia?: string | null;
};

export type CajaDiariaReport = {
  fecha: string;
  generado_en: string;
  session_id: string;
  estado: string;
  caja: string;
  ubicacion_caja?: string | null;
  usuario: string;
  apertura: string;
  cierre?: string | null;
  resumen: CajaDiariaResumen;
  ventas: CajaDiariaVenta[];
  movimientos: CajaDiariaMovimiento[];
};

export type VentasDiaFilters = {
  search?: string;
  payment_method_id?: string;
  user_id?: string;
  status?: string;
};

export type CajaDiariaFilters = {
  session_id?: string;
  user_id?: string;
  report_date?: string;
};

export type SaleDetailReport = {
  id: string;
  user_id: string;
  cash_session_id?: string | null;
  sale_number: string;
  status: string;
  subtotal: string;
  discount_amount: string;
  tax_amount: string;
  total: string;
  notes?: string | null;
  cancellation_reason?: string | null;
  cancelled_at?: string | null;
  created_at: string;
  user: User;
  payments: Array<{
    id: string;
    payment_method_id: string;
    amount: string;
    reference?: string | null;
    payment_method: {
      id: string;
      name: string;
      code: string;
    };
  }>;
  details: Array<{
    id: string;
    product_id: string;
    quantity: string;
    unit_price: string;
    line_total: string;
    discount_amount: string;
    tax_amount: string;
    product: Product;
  }>;
};
