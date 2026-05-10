import { FormEvent, useState } from "react";
import { Building2, PencilLine, Plus, RotateCcw, Save } from "lucide-react";

import { Button } from "../../../components/ui/Button";
import { SectionTitle } from "../../../components/ui/SectionTitle";
import { useCreateSupplier, useSuppliers, useUpdateSupplier } from "../hooks/useSuppliers";
import type { Supplier } from "../types/supplier";

const inputClassName = "h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm";
const textareaClassName = "min-h-24 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm";

type SupplierFormState = {
  name: string;
  tax_id: string;
  phone: string;
  email: string;
  address: string;
  is_active: boolean;
};

const emptySupplierForm: SupplierFormState = {
  name: "",
  tax_id: "",
  phone: "",
  email: "",
  address: "",
  is_active: true,
};

function mapSupplierToForm(supplier: Supplier): SupplierFormState {
  return {
    name: supplier.name,
    tax_id: supplier.tax_id || "",
    phone: supplier.phone || "",
    email: supplier.email || "",
    address: supplier.address || "",
    is_active: supplier.is_active,
  };
}

export function SuppliersPage() {
  const [supplierForm, setSupplierForm] = useState<SupplierFormState>(emptySupplierForm);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: suppliers = [], isLoading } = useSuppliers();
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();

  function resetForm() {
    setEditingSupplier(null);
    setSupplierForm(emptySupplierForm);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setError(null);

    try {
      if (editingSupplier) {
        await updateSupplier.mutateAsync({
          supplierId: editingSupplier.id,
          payload: {
            name: supplierForm.name,
            tax_id: supplierForm.tax_id,
            phone: supplierForm.phone,
            email: supplierForm.email,
            address: supplierForm.address,
            is_active: supplierForm.is_active,
          },
        });
        setFeedback("Proveedor actualizado.");
      } else {
        await createSupplier.mutateAsync({
          name: supplierForm.name,
          tax_id: supplierForm.tax_id,
          phone: supplierForm.phone,
          email: supplierForm.email,
          address: supplierForm.address,
        });
        setFeedback("Proveedor creado.");
      }
      resetForm();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "No fue posible guardar el proveedor.");
    }
  }

  return (
    <section className="space-y-6">
      <SectionTitle
        title="Proveedores"
        description="Base de proveedores para compras, reposicion y trazabilidad por documento."
      />

      {(feedback || error) && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            error
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {error || feedback}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_380px]">
        <div className="rounded-lg border border-slate-200 bg-white shadow-panel">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-950">Proveedores creados</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {isLoading ? (
              <p className="px-5 py-5 text-sm text-slate-500">Cargando proveedores...</p>
            ) : suppliers.length === 0 ? (
              <p className="px-5 py-5 text-sm text-slate-500">Aun no hay proveedores.</p>
            ) : (
              suppliers.map((supplier) => (
                <div key={supplier.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900">{supplier.name}</p>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            supplier.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {supplier.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                      <div className="mt-1 space-y-1 text-sm text-slate-500">
                        <p>RUT: {supplier.tax_id || "-"}</p>
                        <p>Telefono: {supplier.phone || "-"}</p>
                        <p>Email: {supplier.email || "-"}</p>
                        <p>Direccion: {supplier.address || "Sin direccion"}</p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setFeedback(null);
                        setError(null);
                        setEditingSupplier(supplier);
                        setSupplierForm(mapSupplierToForm(supplier));
                      }}
                    >
                      <PencilLine className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-brand-50 p-2 text-brand-600">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  {editingSupplier ? "Editar proveedor" : "Nuevo proveedor"}
                </h2>
                <p className="text-sm text-slate-500">Gestion dedicada para compras y abastecimiento.</p>
              </div>
            </div>

            {(editingSupplier || supplierForm.name) && (
              <Button type="button" variant="secondary" onClick={resetForm}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Limpiar
              </Button>
            )}
          </div>

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Nombre</span>
              <input
                className={inputClassName}
                value={supplierForm.name}
                onChange={(event) => setSupplierForm((current) => ({ ...current, name: event.target.value }))}
                required
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>RUT</span>
              <input
                className={inputClassName}
                value={supplierForm.tax_id}
                onChange={(event) => setSupplierForm((current) => ({ ...current, tax_id: event.target.value }))}
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Telefono</span>
              <input
                className={inputClassName}
                value={supplierForm.phone}
                onChange={(event) => setSupplierForm((current) => ({ ...current, phone: event.target.value }))}
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Email</span>
              <input
                className={inputClassName}
                type="email"
                value={supplierForm.email}
                onChange={(event) => setSupplierForm((current) => ({ ...current, email: event.target.value }))}
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Direccion</span>
              <textarea
                className={textareaClassName}
                value={supplierForm.address}
                onChange={(event) => setSupplierForm((current) => ({ ...current, address: event.target.value }))}
              />
            </label>

            {editingSupplier ? (
              <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  checked={supplierForm.is_active}
                  onChange={(event) => setSupplierForm((current) => ({ ...current, is_active: event.target.checked }))}
                  type="checkbox"
                />
                <span>Activo</span>
              </label>
            ) : null}

            <div className="flex justify-end">
              <Button type="submit" disabled={createSupplier.isPending || updateSupplier.isPending}>
                {editingSupplier ? <Save className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                {editingSupplier ? "Guardar cambios" : "Crear proveedor"}
              </Button>
            </div>
          </form>
        </aside>
      </div>
    </section>
  );
}
