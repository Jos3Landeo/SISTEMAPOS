import { FormEvent, useEffect, useMemo, useState } from "react";
import { Building2, Scale, Settings2 } from "lucide-react";

import { Button } from "../../../components/ui/Button";
import { SectionTitle } from "../../../components/ui/SectionTitle";
import { formatChileanRut, normalizeRutInput } from "../lib/companyTaxId";
import {
  useGeneralSettings,
  useSaveGeneralSettings,
  useSaveScaleSettings,
  useScaleSettings,
} from "../hooks/useSettings";
import {
  defaultGeneralSettings,
  defaultScaleSettings,
  type GeneralSettings,
  type ScaleSettings,
} from "../types/settings";

const inputClassName = "h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm";
const textareaClassName = "min-h-24 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm";

type SettingsTab = "general" | "scale";

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  const { data: savedGeneral, isLoading: generalLoading } = useGeneralSettings();
  const { data: savedScale, isLoading: scaleLoading } = useScaleSettings();
  const saveGeneralSettings = useSaveGeneralSettings();
  const saveScaleSettings = useSaveScaleSettings();

  const [generalForm, setGeneralForm] = useState<GeneralSettings>(defaultGeneralSettings);
  const [scaleForm, setScaleForm] = useState<ScaleSettings>(defaultScaleSettings);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (savedGeneral) {
      setGeneralForm(savedGeneral);
    }
  }, [savedGeneral]);

  useEffect(() => {
    if (savedScale) {
      setScaleForm(savedScale);
    }
  }, [savedScale]);

  const isLoading = generalLoading || scaleLoading;

  const exampleBarcode = useMemo(() => {
    const productCode = "00001".slice(0, scaleForm.productCodeDigits).padStart(scaleForm.productCodeDigits, "0");
    const valueSeed = scaleForm.valueMode === "weight" ? "01250" : "02750";
    const valueSegment = valueSeed.padStart(scaleForm.valueDigits, "0").slice(0, scaleForm.valueDigits);
    return `${scaleForm.ean13Prefix}${productCode}${valueSegment}`.padEnd(12, "0") + "5";
  }, [scaleForm]);

  function handleGeneralSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveGeneralSettings.mutate(generalForm, {
      onSuccess: () => setFeedback("Configuracion general guardada en base de datos."),
    });
  }

  function handleScaleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveScaleSettings.mutate(scaleForm, {
      onSuccess: () => setFeedback("Configuracion de balanza guardada en base de datos."),
    });
  }

  return (
    <section className="space-y-6">
      <SectionTitle title="Configuracion" description="Datos del negocio y preferencias operativas del puesto de caja." />

      {isLoading ? <p className="text-sm text-slate-500">Cargando configuracion...</p> : null}

      <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)_360px]">
        <aside className="rounded-lg border border-slate-200 bg-white p-3 shadow-panel">
          <div className="space-y-2">
            <button
              type="button"
              className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm transition ${
                activeTab === "general"
                  ? "bg-brand-500 text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
              onClick={() => {
                setActiveTab("general");
                setFeedback(null);
              }}
            >
              <Building2 className="h-4 w-4" />
              <span>General</span>
            </button>
            <button
              type="button"
              className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm transition ${
                activeTab === "scale"
                  ? "bg-brand-500 text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
              onClick={() => {
                setActiveTab("scale");
                setFeedback(null);
              }}
            >
              <Scale className="h-4 w-4" />
              <span>Balanza</span>
            </button>
          </div>
        </aside>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
          {activeTab === "general" ? (
            <>
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-brand-50 p-2 text-brand-600">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">General</h2>
                  <p className="text-sm text-slate-500">Datos que apareceran impresos en el ticket de venta.</p>
                </div>
              </div>

              <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={handleGeneralSubmit}>
                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <span>Nombre empresa</span>
                  <input
                    className={inputClassName}
                    value={generalForm.companyName}
                    onChange={(event) => setGeneralForm((current) => ({ ...current, companyName: event.target.value }))}
                    required
                  />
                </label>

                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>RUT empresa</span>
                  <input
                    className={inputClassName}
                    value={generalForm.companyTaxId}
                    onChange={(event) =>
                      setGeneralForm((current) => ({
                        ...current,
                        companyTaxId: normalizeRutInput(event.target.value),
                      }))
                    }
                    onBlur={(event) => {
                      const formatted = formatChileanRut(event.target.value);
                      if (formatted !== null) {
                        setGeneralForm((current) => ({
                          ...current,
                          companyTaxId: formatted,
                        }));
                      }
                    }}
                    placeholder="Opcional"
                  />
                </label>

                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <span>Direccion</span>
                  <input
                    className={inputClassName}
                    value={generalForm.companyAddress}
                    onChange={(event) => setGeneralForm((current) => ({ ...current, companyAddress: event.target.value }))}
                  />
                </label>

                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Telefono</span>
                  <input
                    className={inputClassName}
                    value={generalForm.companyPhone}
                    onChange={(event) => setGeneralForm((current) => ({ ...current, companyPhone: event.target.value }))}
                  />
                </label>

                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Email</span>
                  <input
                    className={inputClassName}
                    type="email"
                    value={generalForm.companyEmail}
                    onChange={(event) => setGeneralForm((current) => ({ ...current, companyEmail: event.target.value }))}
                  />
                </label>

                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <span>Mensaje de despedida</span>
                  <textarea
                    className={textareaClassName}
                    value={generalForm.ticketFooterMessage}
                    onChange={(event) =>
                      setGeneralForm((current) => ({ ...current, ticketFooterMessage: event.target.value }))
                    }
                    placeholder="Gracias por su compra"
                  />
                </label>

                {feedback ? (
                  <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 md:col-span-2">
                    {feedback}
                  </div>
                ) : null}

                <div className="md:col-span-2 flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setGeneralForm(savedGeneral ?? defaultGeneralSettings);
                      setFeedback(null);
                    }}
                  >
                    Restaurar
                  </Button>
                  <Button type="submit">Guardar configuracion</Button>
                </div>
              </form>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-brand-50 p-2 text-brand-600">
                  <Scale className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Balanza</h2>
                  <p className="text-sm text-slate-500">Lectura de etiquetas EAN-13 con peso o precio embebido.</p>
                </div>
              </div>

              <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={handleScaleSubmit}>
                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <span>Habilitar balanza</span>
                  <div className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-3">
                    <input
                      checked={scaleForm.enabled}
                      onChange={(event) => setScaleForm((current) => ({ ...current, enabled: event.target.checked }))}
                      type="checkbox"
                    />
                    <span className="text-sm text-slate-700">Permitir interpretar codigos EAN-13 de balanza en POS</span>
                  </div>
                </label>

                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Prefijo EAN-13</span>
                  <input
                    className={inputClassName}
                    maxLength={3}
                    value={scaleForm.ean13Prefix}
                    onChange={(event) =>
                      setScaleForm((current) => ({ ...current, ean13Prefix: event.target.value.replace(/\D/g, "") }))
                    }
                  />
                </label>

                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Digitos codigo producto</span>
                  <input
                    className={inputClassName}
                    type="number"
                    min="4"
                    max="6"
                    value={scaleForm.productCodeDigits}
                    onChange={(event) =>
                      setScaleForm((current) => ({ ...current, productCodeDigits: Number(event.target.value) }))
                    }
                  />
                </label>

                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Digitos valor embebido</span>
                  <input
                    className={inputClassName}
                    type="number"
                    min="4"
                    max="6"
                    value={scaleForm.valueDigits}
                    onChange={(event) =>
                      setScaleForm((current) => ({ ...current, valueDigits: Number(event.target.value) }))
                    }
                  />
                </label>

                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Decimales del valor</span>
                  <input
                    className={inputClassName}
                    type="number"
                    min="0"
                    max="4"
                    value={scaleForm.valueDecimals}
                    onChange={(event) =>
                      setScaleForm((current) => ({ ...current, valueDecimals: Number(event.target.value) }))
                    }
                  />
                </label>

                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>El valor representa</span>
                  <select
                    className={inputClassName}
                    value={scaleForm.valueMode}
                    onChange={(event) =>
                      setScaleForm((current) => ({
                        ...current,
                        valueMode: event.target.value as ScaleSettings["valueMode"],
                        valueDecimals: event.target.value === "weight" ? 3 : 2,
                      }))
                    }
                  >
                    <option value="weight">Peso</option>
                    <option value="price">Precio</option>
                  </select>
                </label>

                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Buscar producto por</span>
                  <select
                    className={inputClassName}
                    value={scaleForm.lookupField}
                    onChange={(event) =>
                      setScaleForm((current) => ({
                        ...current,
                        lookupField: event.target.value as ScaleSettings["lookupField"],
                      }))
                    }
                  >
                    <option value="barcode">Codigo de barras</option>
                    <option value="internal_code">Codigo interno</option>
                  </select>
                </label>

                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Formato del codigo producto</span>
                  <select
                    className={inputClassName}
                    value={scaleForm.lookupFormat}
                    onChange={(event) =>
                      setScaleForm((current) => ({
                        ...current,
                        lookupFormat: event.target.value as ScaleSettings["lookupFormat"],
                      }))
                    }
                  >
                    <option value="code_only">Solo codigo extraido</option>
                    <option value="prefix_plus_code">Prefijo + codigo extraido</option>
                  </select>
                </label>

                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Prefijo para buscar producto</span>
                  <input
                    className={inputClassName}
                    value={scaleForm.lookupPrefix}
                    onChange={(event) => setScaleForm((current) => ({ ...current, lookupPrefix: event.target.value }))}
                    placeholder="Opcional"
                  />
                </label>

                {feedback ? (
                  <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 md:col-span-2">
                    {feedback}
                  </div>
                ) : null}

                <div className="md:col-span-2 flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setScaleForm(savedScale ?? defaultScaleSettings);
                      setFeedback(null);
                    }}
                  >
                    Restaurar
                  </Button>
                  <Button type="submit">Guardar configuracion</Button>
                </div>
              </form>
            </>
          )}
        </div>

        <aside className="space-y-6">
          {activeTab === "general" ? (
            <>
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-slate-100 p-2 text-slate-700">
                    <Settings2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-950">Vista previa ticket</h2>
                    <p className="text-sm text-slate-500">Asi apareceran los datos superiores del comprobante.</p>
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 font-mono text-[12px] leading-5 text-slate-700">
                  <p className="text-center font-semibold">{generalForm.companyName || "Nombre empresa"}</p>
                  {generalForm.companyTaxId ? <p className="text-center">RUT: {generalForm.companyTaxId}</p> : null}
                  {generalForm.companyAddress ? <p className="text-center">{generalForm.companyAddress}</p> : null}
                  {generalForm.companyPhone ? <p className="text-center">Tel: {generalForm.companyPhone}</p> : null}
                  {generalForm.companyEmail ? <p className="text-center">{generalForm.companyEmail}</p> : null}
                  <p className="mt-3 border-t border-dashed border-slate-300 pt-3 text-center">TICKET DE VENTA</p>
                  {generalForm.ticketFooterMessage ? (
                    <p className="mt-3 border-t border-dashed border-slate-300 pt-3 text-center">
                      {generalForm.ticketFooterMessage}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
                <h2 className="text-base font-semibold text-slate-950">Sugerencia operativa</h2>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <p>El nombre de empresa es obligatorio porque es la cabecera minima del ticket.</p>
                  <p>Direccion, telefono y correo son opcionales y se imprimen solo si tienen valor.</p>
                  <p>Un mensaje corto de despedida ayuda bastante en tickets termicos y no recarga el comprobante.</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-slate-100 p-2 text-slate-700">
                    <Settings2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-950">Vista previa</h2>
                    <p className="text-sm text-slate-500">Ejemplo de etiqueta segun la configuracion actual.</p>
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-normal text-slate-500">Codigo de ejemplo</p>
                  <p className="mt-2 break-all font-mono text-lg font-semibold text-slate-950">{exampleBarcode}</p>
                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    <p>Prefijo: {scaleForm.ean13Prefix}</p>
                    <p>Modo: {scaleForm.valueMode === "weight" ? "Peso embebido" : "Precio embebido"}</p>
                    <p>Busqueda: {scaleForm.lookupField === "barcode" ? "Codigo de barras" : "Codigo interno"}</p>
                    <p>Formato lookup: {scaleForm.lookupFormat === "code_only" ? "Solo codigo" : "Prefijo + codigo"}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
                <h2 className="text-base font-semibold text-slate-950">Sugerencia operativa</h2>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <p>Para balanzas de frescos suele funcionar bien prefijo `20`, producto de 5 digitos y valor de 5 digitos.</p>
                  <p>Si la etiqueta trae peso, el POS calcula el total usando el precio por kilo o por unidad configurada en el producto.</p>
                  <p>Si la etiqueta trae precio, el POS estima la cantidad a partir del precio del producto.</p>
                </div>
              </div>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}
