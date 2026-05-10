import { FormEvent, type ReactNode, useMemo, useState } from "react";
import { ArrowRight, Banknote, History, Lock, LockOpen, RotateCcw, ShieldCheck, TrendingDown, TrendingUp } from "lucide-react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

import { Button } from "../../../components/ui/Button";
import { SectionTitle } from "../../../components/ui/SectionTitle";
import { hasPermission, PERMISSION_CASHIERS, PERMISSION_SETTINGS } from "../../auth/access";
import { useAuthStore } from "../../auth/hooks/useAuth";
import { useGeneralSettings } from "../../settings/hooks/useSettings";
import { useSettingsStore } from "../../settings/store/useSettingsStore";
import { buildCierreCajaLines, formatMoney } from "../../reports/lib/cashDailyReport";
import { printThermalReport } from "../../reports/lib/reportExport";
import { reportService } from "../../reports/services/reportService";
import {
  useCashReasonCatalog,
  useClosedCashSessions,
  useCurrentCashSession,
  useOpenCashSession,
  useCloseCashSession,
  useCashRegisters,
  useCreateCashMovement,
  useReopenCashSession,
} from "../hooks/useCash";
import type { CashSessionClosure } from "../types/cash";

const inputClassName = "h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm";
const textareaClassName = "min-h-[96px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function Modal({
  title,
  description,
  children,
  onClose,
}: {
  title: string;
  description: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
            <p className="text-sm text-slate-500">{description}</p>
          </div>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
        <div className="space-y-4 px-5 py-5">{children}</div>
      </div>
    </div>
  );

  if (typeof document === "undefined") {
    return modal;
  }

  return createPortal(modal, document.body);
}

export function CashPage() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const generalSettings = useSettingsStore((state) => state.general);
  useGeneralSettings();

  const canSupervise = hasPermission(user, PERMISSION_CASHIERS) || hasPermission(user, PERMISSION_SETTINGS);

  const { data: registers = [], isLoading: loadingRegisters } = useCashRegisters();
  const { data: currentSession, isLoading: loadingSession } = useCurrentCashSession();
  const { data: closedSessions = [], isLoading: loadingClosures } = useClosedCashSessions();
  const { data: incomeReasons = [] } = useCashReasonCatalog("income");
  const { data: withdrawalReasons = [] } = useCashReasonCatalog("withdrawal");
  const { data: reopenReasons = [] } = useCashReasonCatalog("cash_reopen", canSupervise);

  const openSession = useOpenCashSession();
  const closeSession = useCloseCashSession();
  const createMovement = useCreateCashMovement();
  const reopenSession = useReopenCashSession();

  const [registerId, setRegisterId] = useState("");
  const [openingAmount, setOpeningAmount] = useState("0");
  const [movementType, setMovementType] = useState<"income" | "withdrawal">("income");
  const [movementAmount, setMovementAmount] = useState("");
  const [movementReasonCode, setMovementReasonCode] = useState("");
  const [movementNotes, setMovementNotes] = useState("");
  const [closingObservation, setClosingObservation] = useState("");
  const [supervisorUsername, setSupervisorUsername] = useState("");
  const [supervisorPassword, setSupervisorPassword] = useState("");
  const [countedAmountInput, setCountedAmountInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);
  const [selectedClosure, setSelectedClosure] = useState<CashSessionClosure | null>(null);
  const [reopenReasonCode, setReopenReasonCode] = useState("");
  const [reopenNotes, setReopenNotes] = useState("");
  const [reopenError, setReopenError] = useState<string | null>(null);

  const availableRegisters = useMemo(() => registers.filter((register) => register.is_active), [registers]);
  const activeMovementReasons = movementType === "income" ? incomeReasons : withdrawalReasons;
  const activeMovementReason = activeMovementReasons.find((item) => item.code === movementReasonCode) ?? null;

  const countedAmount = Number(countedAmountInput || "0");

  const closePreview = useMemo(() => {
    if (!currentSession) {
      return null;
    }
    const expected = Number(currentSession.metrics.expected_cash_amount);
    const difference = countedAmount - expected;
    return { expected, counted: countedAmount, difference };
  }, [countedAmount, currentSession]);

  async function handleOpenSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFeedback(null);

    try {
      await openSession.mutateAsync({
        cash_register_id: registerId,
        opening_amount: Number(openingAmount || "0"),
      });
      setFeedback("Caja abierta correctamente. Ya puedes empezar a operar.");
      setClosingObservation("");
      setSupervisorUsername("");
      setSupervisorPassword("");
      setCountedAmountInput("");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "No fue posible abrir la caja");
    }
  }

  function handleCloseSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentSession || !closePreview) {
      return;
    }
    if (closePreview.counted <= 0) {
      setError("Debes ingresar el monto contado antes de cerrar la caja");
      return;
    }
    if (closePreview.difference !== 0 && !closingObservation.trim()) {
      setError("Debes registrar una observacion cuando existe diferencia de caja");
      return;
    }
    setError(null);
    setFeedback(null);
    setIsCloseConfirmOpen(true);
  }

  async function confirmCloseSession() {
    if (!currentSession) {
      return;
    }

    setIsCloseConfirmOpen(false);
    setError(null);
    setFeedback(null);

    try {
      const payload = {
        counted_amount: Number(countedAmountInput || "0"),
        observation: closingObservation || undefined,
        supervisor_username: supervisorUsername || undefined,
        supervisor_password: supervisorPassword || undefined,
      };

      const closedSession = await closeSession.mutateAsync({
        sessionId: currentSession.id,
        payload,
      });
      setFeedback("Caja cerrada correctamente.");
      setClosingObservation("");
      setSupervisorUsername("");
      setSupervisorPassword("");
      setCountedAmountInput("");

      if (token) {
        try {
          const closureReport = await reportService.getCajaDiaria(token, { session_id: closedSession.id });
          printThermalReport(
            "Cierre de caja",
            buildCierreCajaLines(closureReport, {
              companyName: generalSettings.companyName,
              companyTaxId: generalSettings.companyTaxId,
              companyAddress: generalSettings.companyAddress,
              companyPhone: generalSettings.companyPhone,
              companyEmail: generalSettings.companyEmail,
            }),
          );
        } catch (printError) {
          setError(
            printError instanceof Error
              ? `Caja cerrada correctamente, pero no fue posible imprimir el cierre: ${printError.message}`
              : "Caja cerrada correctamente, pero no fue posible imprimir el cierre",
          );
        }
      }
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "No fue posible cerrar la caja");
    }
  }

  async function handleCreateMovement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentSession) {
      return;
    }

    setError(null);
    setFeedback(null);

    try {
      await createMovement.mutateAsync({
        sessionId: currentSession.id,
        payload: {
          movement_type: movementType,
          amount: Number(movementAmount || "0"),
          reason_code: movementReasonCode,
          notes: movementNotes || undefined,
        },
      });
      setFeedback(movementType === "income" ? "Ingreso registrado correctamente." : "Retiro registrado correctamente.");
      setMovementAmount("");
      setMovementReasonCode("");
      setMovementNotes("");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "No fue posible registrar el movimiento");
    }
  }

  async function handleReopenSession() {
    if (!selectedClosure) {
      return;
    }
    const selectedReason = reopenReasons.find((item) => item.code === reopenReasonCode);
    if (!selectedReason) {
      setReopenError("Selecciona un motivo de reapertura");
      return;
    }
    if (selectedReason.requires_notes && !reopenNotes.trim()) {
      setReopenError("Debes detallar el motivo de reapertura seleccionado");
      return;
    }

    try {
      setReopenError(null);
      await reopenSession.mutateAsync({
        sessionId: selectedClosure.cash_session_id,
        payload: {
          reason_code: reopenReasonCode,
          notes: reopenNotes || undefined,
        },
      });
      setFeedback(`Caja ${selectedClosure.cash_register_name} reabierta correctamente.`);
      setSelectedClosure(null);
      setReopenReasonCode("");
      setReopenNotes("");
    } catch (submissionError) {
      setReopenError(submissionError instanceof Error ? submissionError.message : "No fue posible reabrir la caja");
    }
  }

  return (
    <section className="space-y-6">
      <SectionTitle
        title="Caja"
        description="Apertura, movimientos, cierre por monto contado, cierres supervisados y reaperturas controladas."
      />

      {error ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      {feedback ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{feedback}</p> : null}
      {loadingRegisters || loadingSession ? <p className="text-sm text-slate-500">Cargando caja...</p> : null}

      {!currentSession ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_360px]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-brand-50 p-2 text-brand-600">
                <LockOpen className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Apertura de caja</h2>
                <p className="text-sm text-slate-500">Selecciona la caja fisica e ingresa la caja chica inicial.</p>
              </div>
            </div>

            {availableRegisters.length === 0 ? (
              <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                No hay cajas activas disponibles. Primero crea o habilita una caja desde la configuracion administrativa.
              </div>
            ) : (
              <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={handleOpenSession}>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Caja</span>
                  <select className={inputClassName} value={registerId} onChange={(event) => setRegisterId(event.target.value)} required>
                    <option value="">Seleccionar caja</option>
                    {availableRegisters.map((register) => (
                      <option key={register.id} value={register.id}>
                        {register.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Monto inicial</span>
                  <input
                    className={inputClassName}
                    type="number"
                    min="0"
                    step="0.01"
                    value={openingAmount}
                    onChange={(event) => setOpeningAmount(event.target.value)}
                    required
                  />
                </label>

                <div className="md:col-span-2 flex justify-end">
                  <Button type="submit" disabled={openSession.isPending}>
                    {openSession.isPending ? "Abriendo caja..." : "Abrir caja"}
                  </Button>
                </div>
              </form>
            )}
          </div>

          <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
            <h2 className="text-base font-semibold text-slate-950">Antes de vender</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p>La apertura deja trazado el monto inicial del turno.</p>
                <p>Sin caja abierta, el POS permanece bloqueado.</p>
                <p>El cierre se realiza ingresando el monto total contado en caja.</p>
              </div>
            </aside>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_360px]">
          <div className="space-y-6">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-brand-50 p-2 text-brand-600">
                    <Banknote className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-950">Caja operativa</h2>
                    <p className="text-sm text-slate-500">Sesion activa con control de efectivo y trazabilidad completa.</p>
                  </div>
                </div>

                <Button type="button" onClick={() => navigate("/pos")}>
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Ir al POS
                </Button>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Caja</p>
                  <p className="mt-2 font-semibold text-slate-950">{currentSession.cash_register.name}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Apertura</p>
                  <p className="mt-2 font-semibold text-slate-950">{formatDateTime(currentSession.created_at)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Caja inicial</p>
                  <p className="mt-2 font-semibold text-slate-950">{formatMoney(currentSession.opening_amount)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Efectivo esperado</p>
                  <p className="mt-2 font-semibold text-slate-950">{formatMoney(currentSession.metrics.expected_cash_amount)}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="text-sm text-slate-500">Ventas registradas</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">{currentSession.metrics.sales_count}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="text-sm text-slate-500">Ventas completadas</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">{currentSession.metrics.completed_sales_count}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="text-sm text-slate-500">Ventas anuladas</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">{currentSession.metrics.cancelled_sales_count}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="text-sm text-slate-500">Ventas en efectivo</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">{formatMoney(currentSession.metrics.cash_sales_amount)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
              <div className="flex items-center gap-3">
                <div className={`rounded-md p-2 ${movementType === "income" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-700"}`}>
                  {movementType === "income" ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Movimientos manuales</h2>
                  <p className="text-sm text-slate-500">Usa motivos catalogados para ingresos y retiros de caja.</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm text-emerald-700">Ingresos manuales</p>
                  <p className="mt-2 text-xl font-semibold text-emerald-900">{formatMoney(currentSession.metrics.manual_income_amount)}</p>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm text-amber-700">Retiros manuales</p>
                  <p className="mt-2 text-xl font-semibold text-amber-900">{formatMoney(currentSession.metrics.manual_withdrawal_amount)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Efectivo esperado actualizado</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">{formatMoney(currentSession.metrics.expected_cash_amount)}</p>
                </div>
              </div>

              <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={handleCreateMovement}>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Tipo de movimiento</span>
                  <select
                    className={inputClassName}
                    value={movementType}
                    onChange={(event) => {
                      setMovementType(event.target.value as "income" | "withdrawal");
                      setMovementReasonCode("");
                    }}
                  >
                    <option value="income">Ingreso manual</option>
                    <option value="withdrawal">Retiro manual</option>
                  </select>
                </label>

                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Monto</span>
                  <input
                    className={inputClassName}
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={movementAmount}
                    onChange={(event) => setMovementAmount(event.target.value)}
                    required
                  />
                </label>

                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <span>Motivo</span>
                  <select
                    className={inputClassName}
                    value={movementReasonCode}
                    onChange={(event) => setMovementReasonCode(event.target.value)}
                    required
                  >
                    <option value="">Seleccionar motivo</option>
                    {activeMovementReasons.map((reason) => (
                      <option key={reason.code} value={reason.code}>
                        {reason.label}
                      </option>
                    ))}
                  </select>
                  {activeMovementReason ? <p className="text-xs text-slate-500">{activeMovementReason.description}</p> : null}
                </label>

                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <span>Observacion</span>
                  <textarea
                    className={textareaClassName}
                    placeholder={activeMovementReason?.requires_notes ? "Este motivo requiere observacion" : "Detalle opcional del movimiento"}
                    value={movementNotes}
                    onChange={(event) => setMovementNotes(event.target.value)}
                  />
                </label>

                <div className="md:col-span-2 flex justify-end">
                  <Button type="submit" disabled={createMovement.isPending}>
                    {createMovement.isPending ? "Guardando movimiento..." : movementType === "income" ? "Registrar ingreso" : "Registrar retiro"}
                  </Button>
                </div>
              </form>

              <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Hora</th>
                      <th className="px-4 py-3 font-medium">Tipo</th>
                      <th className="px-4 py-3 font-medium">Motivo</th>
                      <th className="px-4 py-3 font-medium">Usuario</th>
                      <th className="px-4 py-3 font-medium text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentSession.movements.length === 0 ? (
                      <tr>
                        <td className="px-4 py-6 text-slate-500" colSpan={5}>
                          Aun no hay movimientos manuales en este turno.
                        </td>
                      </tr>
                    ) : (
                      currentSession.movements.map((movement) => (
                        <tr key={movement.id}>
                          <td className="px-4 py-3 text-slate-600">{formatDateTime(movement.created_at)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${movement.movement_type === "income" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                              {movement.movement_type === "income" ? "Ingreso" : "Retiro"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            <div>{movement.reason}</div>
                            {movement.notes ? <div className="text-xs text-slate-500">{movement.notes}</div> : null}
                          </td>
                          <td className="px-4 py-3 text-slate-600">{movement.created_by.full_name}</td>
                          <td className={`px-4 py-3 text-right font-medium ${movement.movement_type === "income" ? "text-emerald-700" : "text-amber-700"}`}>
                            {movement.movement_type === "income" ? "+" : "-"}
                            {formatMoney(movement.amount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-slate-100 p-2 text-slate-700">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Cierre de caja</h2>
                  <p className="text-sm text-slate-500">Ingresa el monto total contado y deja observacion si hay diferencia.</p>
                </div>
              </div>

              <form className="mt-5 space-y-5" onSubmit={handleCloseSession}>
                <label className="block space-y-2 text-sm font-medium text-slate-700">
                  <div className="flex items-center justify-between gap-3">
                    <span>Monto contado en caja</span>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setCountedAmountInput(String(Number(currentSession.metrics.expected_cash_amount)))}
                    >
                      Usar monto esperado
                    </Button>
                  </div>
                  <input
                    className={inputClassName}
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={countedAmountInput}
                    onChange={(event) => setCountedAmountInput(event.target.value)}
                    placeholder="Ej. 58500"
                    required
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Monto contado</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{formatMoney(countedAmount)}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Diferencia estimada</p>
                    <p className={`mt-2 text-2xl font-semibold ${closePreview?.difference === 0 ? "text-slate-950" : closePreview && closePreview.difference > 0 ? "text-emerald-700" : "text-rose-700"}`}>
                      {formatMoney(closePreview?.difference || 0)}
                    </p>
                  </div>
                </div>

                <label className="block space-y-2 text-sm font-medium text-slate-700">
                  <span>Observacion de cierre</span>
                  <textarea
                    className={textareaClassName}
                    value={closingObservation}
                    onChange={(event) => setClosingObservation(event.target.value)}
                    placeholder="Obligatoria si existe diferencia. Ej. faltante por vuelto, billete mal contado, ajuste pendiente..."
                  />
                </label>

                {closePreview && closePreview.difference !== 0 ? (
                  <div className="grid gap-4 rounded-lg border border-amber-200 bg-amber-50 p-4 md:grid-cols-2">
                    <div className="md:col-span-2 flex items-start gap-3 text-sm text-amber-800">
                      <ShieldCheck className="mt-0.5 h-4 w-4" />
                      <p>Como hay diferencia, el cierre requiere validacion de un supervisor con permisos administrativos.</p>
                    </div>
                    <label className="space-y-2 text-sm font-medium text-slate-700">
                      <span>Usuario supervisor</span>
                      <input className={inputClassName} value={supervisorUsername} onChange={(event) => setSupervisorUsername(event.target.value)} />
                    </label>
                    <label className="space-y-2 text-sm font-medium text-slate-700">
                      <span>Clave supervisor</span>
                      <input
                        className={inputClassName}
                        type="password"
                        value={supervisorPassword}
                        onChange={(event) => setSupervisorPassword(event.target.value)}
                      />
                    </label>
                  </div>
                ) : null}

                <div className="flex justify-end">
                  <Button type="submit" variant="danger" disabled={closeSession.isPending}>
                    {closeSession.isPending ? "Cerrando caja..." : "Revisar cierre"}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
              <h2 className="text-base font-semibold text-slate-950">Resumen rapido</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p>Total vendido del turno: {formatMoney(currentSession.metrics.total_sales_amount)}</p>
                <p>Efectivo del turno: {formatMoney(currentSession.metrics.cash_sales_amount)}</p>
                <p>Ingresos manuales: {formatMoney(currentSession.metrics.manual_income_amount)}</p>
                <p>Retiros manuales: {formatMoney(currentSession.metrics.manual_withdrawal_amount)}</p>
                <p>Esperado en caja: {formatMoney(currentSession.metrics.expected_cash_amount)}</p>
                <p>Responsable: {currentSession.opened_by.full_name}</p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
              <div className="flex items-center gap-3">
                <History className="h-5 w-5 text-slate-600" />
                <div>
                  <h2 className="text-base font-semibold text-slate-950">Historial de cierres</h2>
                  <p className="text-sm text-slate-500">Ultimos cierres registrados{canSupervise ? " del sistema" : " por tu usuario"}.</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {loadingClosures ? (
                  <p className="text-sm text-slate-500">Cargando cierres...</p>
                ) : closedSessions.length === 0 ? (
                  <p className="rounded-md border border-dashed border-slate-200 px-4 py-4 text-sm text-slate-500">
                    Aun no hay cierres registrados.
                  </p>
                ) : (
                  closedSessions.map((closure) => (
                    <div key={closure.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-slate-900">{closure.cash_register_name}</p>
                          <p className="text-sm text-slate-500">{formatDateTime(closure.created_at)} - {closure.opened_by_name}</p>
                        </div>
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${Number(closure.difference_amount) === 0 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                          {Number(closure.difference_amount) === 0 ? "Sin diferencia" : "Con diferencia"}
                        </span>
                      </div>
                      <div className="mt-3 grid gap-2 text-sm text-slate-600">
                        <p>Esperado: {formatMoney(closure.expected_amount)}</p>
                        <p>Contado: {formatMoney(closure.counted_amount)}</p>
                        <p>Diferencia: {formatMoney(closure.difference_amount)}</p>
                        {closure.observation ? <p>Observacion: {closure.observation}</p> : null}
                        {closure.reopened_at ? <p className="text-amber-700">Reabierta: {formatDateTime(closure.reopened_at)}</p> : null}
                      </div>
                      {canSupervise && !closure.reopened_at && closure.session_status === "closed" ? (
                        <div className="mt-4 flex justify-end">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                              setSelectedClosure(closure);
                              setReopenReasonCode("");
                              setReopenNotes("");
                              setReopenError(null);
                            }}
                          >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Reabrir caja
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>
      )}

      {isCloseConfirmOpen && currentSession && closePreview ? (
        <Modal
          title="Confirmar cierre de caja"
          description="Revisa los montos del arqueo antes de cerrar la caja e imprimir el cierre."
          onClose={() => setIsCloseConfirmOpen(false)}
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Esperado</p>
              <p className="mt-2 text-xl font-semibold text-slate-950">{formatMoney(closePreview.expected)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Contado</p>
              <p className="mt-2 text-xl font-semibold text-slate-950">{formatMoney(closePreview.counted)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Diferencia</p>
              <p className={`mt-2 text-xl font-semibold ${closePreview.difference === 0 ? "text-slate-950" : closePreview.difference > 0 ? "text-emerald-700" : "text-rose-700"}`}>
                {formatMoney(closePreview.difference)}
              </p>
            </div>
          </div>

          {closingObservation ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <p className="font-medium text-slate-900">Observacion</p>
              <p className="mt-1">{closingObservation}</p>
            </div>
          ) : null}

          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Esta accion cerrara la sesion actual y abrira la impresion del cierre del turno.
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setIsCloseConfirmOpen(false)} disabled={closeSession.isPending}>
              Volver
            </Button>
            <Button type="button" variant="danger" onClick={confirmCloseSession} disabled={closeSession.isPending}>
              {closeSession.isPending ? "Cerrando caja..." : "Confirmar cierre"}
            </Button>
          </div>
        </Modal>
      ) : null}

      {selectedClosure ? (
        <Modal
          title="Reabrir caja"
          description={`Se reabrira la caja ${selectedClosure.cash_register_name}. Esta accion queda auditada.`}
          onClose={() => setSelectedClosure(null)}
        >
          <label className="block space-y-2 text-sm font-medium text-slate-700">
            <span>Motivo de reapertura</span>
            <select className={inputClassName} value={reopenReasonCode} onChange={(event) => setReopenReasonCode(event.target.value)}>
              <option value="">Seleccionar motivo</option>
              {reopenReasons.map((reason) => (
                <option key={reason.code} value={reason.code}>
                  {reason.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2 text-sm font-medium text-slate-700">
            <span>Observacion</span>
            <textarea
              className={textareaClassName}
              value={reopenNotes}
              onChange={(event) => setReopenNotes(event.target.value)}
              placeholder="Detalle adicional de la reapertura"
            />
          </label>

          {reopenError ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{reopenError}</p> : null}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setSelectedClosure(null)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleReopenSession} disabled={reopenSession.isPending}>
              {reopenSession.isPending ? "Reabriendo..." : "Confirmar reapertura"}
            </Button>
          </div>
        </Modal>
      ) : null}
    </section>
  );
}
