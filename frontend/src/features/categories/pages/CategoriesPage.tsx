import { FormEvent, useState } from "react";
import { PencilLine, Plus, RotateCcw, Save, Tags } from "lucide-react";

import { Button } from "../../../components/ui/Button";
import { SectionTitle } from "../../../components/ui/SectionTitle";
import { useCategories, useCreateCategory, useUpdateCategory } from "../../products/hooks/useProducts";
import type { Category } from "../../products/types/product";

const inputClassName = "h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm";
const textareaClassName = "min-h-24 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm";

type CategoryFormState = {
  name: string;
  description: string;
  is_active: boolean;
};

const emptyCategoryForm: CategoryFormState = {
  name: "",
  description: "",
  is_active: true,
};

function mapCategoryToForm(category: Category): CategoryFormState {
  return {
    name: category.name,
    description: category.description || "",
    is_active: category.is_active ?? true,
  };
}

export function CategoriesPage() {
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(emptyCategoryForm);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: categories = [], isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  function resetForm() {
    setEditingCategory(null);
    setCategoryForm(emptyCategoryForm);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setError(null);

    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({
          categoryId: editingCategory.id,
          payload: {
            name: categoryForm.name,
            description: categoryForm.description,
            is_active: categoryForm.is_active,
          },
        });
        setFeedback("Categoria actualizada.");
      } else {
        await createCategory.mutateAsync({
          name: categoryForm.name,
          description: categoryForm.description,
        });
        setFeedback("Categoria creada.");
      }
      resetForm();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "No fue posible guardar la categoria.");
    }
  }

  return (
    <section className="space-y-6">
      <SectionTitle
        title="Categorias"
        description="Clasificacion comercial del catalogo de productos."
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <div className="rounded-lg border border-slate-200 bg-white shadow-panel">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-950">Categorias creadas</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {isLoading ? (
              <p className="px-5 py-5 text-sm text-slate-500">Cargando categorias...</p>
            ) : categories.length === 0 ? (
              <p className="px-5 py-5 text-sm text-slate-500">Aun no hay categorias.</p>
            ) : (
              categories.map((category) => (
                <div key={category.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900">{category.name}</p>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            category.is_active ?? true
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {(category.is_active ?? true) ? "Activa" : "Inactiva"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{category.description || "Sin descripcion"}</p>
                    </div>

                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setFeedback(null);
                        setError(null);
                        setEditingCategory(category);
                        setCategoryForm(mapCategoryToForm(category));
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
                <Tags className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  {editingCategory ? "Editar categoria" : "Nueva categoria"}
                </h2>
                <p className="text-sm text-slate-500">Gestion dedicada para el arbol comercial base.</p>
              </div>
            </div>

            {(editingCategory || categoryForm.name) && (
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
                value={categoryForm.name}
                onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))}
                required
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Descripcion</span>
              <textarea
                className={textareaClassName}
                value={categoryForm.description}
                onChange={(event) => setCategoryForm((current) => ({ ...current, description: event.target.value }))}
              />
            </label>

            {editingCategory && (
              <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  checked={categoryForm.is_active}
                  onChange={(event) => setCategoryForm((current) => ({ ...current, is_active: event.target.checked }))}
                  type="checkbox"
                />
                <span>Activa</span>
              </label>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={createCategory.isPending || updateCategory.isPending}>
                {editingCategory ? <Save className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                {editingCategory ? "Guardar cambios" : "Crear categoria"}
              </Button>
            </div>
          </form>
        </aside>
      </div>
    </section>
  );
}
