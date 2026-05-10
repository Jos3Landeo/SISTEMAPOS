export type CashRegister = {
  id: string;
  name: string;
  location?: string | null;
  is_active: boolean;
};

export type CashReasonCatalogItem = {
  reason_type: "income" | "withdrawal" | "sale_cancellation" | "cash_reopen";
  code: string;
  label: string;
  description: string;
  requires_notes: boolean;
};

export type CashClosureDenomination = {
  id: string;
  cash_session_closure_id: string;
  denomination_value: string;
  quantity: number;
  subtotal: string;
  created_at: string;
  updated_at: string;
};

export type CashSessionClosure = {
  id: string;
  cash_session_id: string;
  closed_by_user_id: string;
  supervised_by_user_id?: string | null;
  expected_amount: string;
  counted_amount: string;
  difference_amount: string;
  observation?: string | null;
  reopened_at?: string | null;
  reopened_by_user_id?: string | null;
  reopen_reason?: string | null;
  created_at: string;
  updated_at: string;
  closed_by: {
    id: string;
    full_name: string;
    username: string;
    role: {
      id: string;
      name: string;
      permissions: string[];
    };
  };
  supervised_by?: {
    id: string;
    full_name: string;
    username: string;
    role: {
      id: string;
      name: string;
      permissions: string[];
    };
  } | null;
  reopened_by?: {
    id: string;
    full_name: string;
    username: string;
    role: {
      id: string;
      name: string;
      permissions: string[];
    };
  } | null;
  denominations: CashClosureDenomination[];
  cash_register_name: string;
  opened_by_name: string;
  opened_at: string;
  session_status: string;
};

export type CashSessionMetrics = {
  sales_count: number;
  completed_sales_count: number;
  cancelled_sales_count: number;
  total_sales_amount: string;
  cash_sales_amount: string;
  manual_income_amount: string;
  manual_withdrawal_amount: string;
  expected_cash_amount: string;
};

export type CashMovement = {
  id: string;
  cash_session_id: string;
  created_by_user_id: string;
  movement_type: "income" | "withdrawal";
  amount: string;
  reason: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  created_by: {
    id: string;
    full_name: string;
    username: string;
    role: {
      id: string;
      name: string;
      permissions: string[];
    };
  };
};

export type CashSession = {
  id: string;
  cash_register_id: string;
  opened_by_user_id: string;
  opening_amount: string;
  closing_amount?: string | null;
  counted_amount?: string | null;
  difference_amount?: string | null;
  closing_observation?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  cash_register: CashRegister;
  opened_by: {
    id: string;
    full_name: string;
    username: string;
    role: {
      id: string;
      name: string;
      permissions: string[];
    };
  };
  closed_by?: {
    id: string;
    full_name: string;
    username: string;
    role: {
      id: string;
      name: string;
      permissions: string[];
    };
  } | null;
  supervised_by?: {
    id: string;
    full_name: string;
    username: string;
    role: {
      id: string;
      name: string;
      permissions: string[];
    };
  } | null;
  movements: CashMovement[];
  metrics: CashSessionMetrics;
};

export type OpenCashSessionPayload = {
  cash_register_id: string;
  opening_amount: number;
};

export type CloseCashSessionPayload = {
  counted_amount: number;
  denominations?: Array<{
    denomination_value: number;
    quantity: number;
  }>;
  observation?: string;
  supervisor_username?: string;
  supervisor_password?: string;
};

export type CreateCashMovementPayload = {
  movement_type: "income" | "withdrawal";
  amount: number;
  reason_code: string;
  notes?: string;
};

export type ReopenCashSessionPayload = {
  reason_code: string;
  notes?: string;
};
