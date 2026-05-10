import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, Package, Plus, RotateCcw, Save } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Button } from "../../../components/ui/Button";
import { SectionTitle } from "../../../components/ui/SectionTitle";
import { useCategories, useCreateProduct, useProduct, useUpdateProduct } from "../hooks/useProducts";
import { getProductUnitMeta, productUnitOptions, type Product, type ProductUnit } from "../types/product";

const inputClassName = "h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm";
const textareaClassName = "min-h-24 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm";

type ProductFormState = {
  category_id: string;
  barcode: string;
  internal_code: string;
  name: string;
  description: string;
  unit_of_measure: ProductUnit;
  sale_price: string;
  average_cost: string;
  stock_current: string;
  stock_minimum: string;
  allows_decimal: boolean;
  is_active: boolean;
};

const emptyProductForm: ProductFormState = {
  category_id: "",
  barcode: "",
  internal_code: "",
  name: "",
  description: "",
  unit_of_measure: "unit",
  sale_price: "",
  average_cost: "0",
  stock_current: "0",
  stock_minimum: "0",
  allows_decimal: false,
  is_active: true,
};

function mapProductToForm(product: Product): ProductFormState {
  return {
    category_id: product.category?.id || product.category_id || "",
    barcode: product.barcode,
    internal_code: product.internal_code || "",
    name: product.name,
    description: product.description || "",
    unit_of_measure: product.unit_of_measure,
    sale_price: product.sale_price,
    average_cost: product.average_cost,
    stock_current: product.stock_current,
    stock_minimum: product.stock_minimum,
    allows_decimal: product.allows_decimal,
    is_active: product.is_active,
  };
}

export function ProductFormPage() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const isEditing = Boolean(productId);
  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: categories = [] } = useCategories();
  const { data: product, isLoading: loadingProduct } = useProduct(productId);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  useEffect(() => {
    if (product) {
      setProductForm(mapProductToForm(product));
    } else if (!isEditing) {
      setProductForm(emptyProductForm);
    }
  }, [product, isEditing]);

  function resetMessages() {
    setFeedback(null);
    setError(null);
  }

  function resetProductForm() {
    resetMessages();
    if (product) {
      setProductForm(mapProductToForm(product));
      return;
    }
    setProductForm(emptyProductForm);
  }

  async function handleProductSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetMessages();

    const basePayload = {
      category_id: productForm.category_id || null,
      barcode: productForm.barcode,
      internal_code: productForm.internal_code,
      name: productForm.name,
      description: productForm.description,
      unit_of_measure: productForm.unit_of_measure,
      sale_price: Number(productForm.sale_price),
      average_cost: Number(productForm.average_cost),
      stock_minimum: Number(productForm.stock_minimum),
      allows_decimal: productForm.allows_decimal,
    };

    try {
      if (isEditing && productId) {
        await updateProduct.mutateAsync({
          productId,
          payload: {
            ...basePayload,
            is_active: productForm.is_active,
          },
        });
        setFeedback("Producto actualizado.");
      } else {
        await createProduct.mutateAsync({
          ...basePayload,
          stock_current: Number(productForm.stock_current),
        });
        setFeedback("Producto creado.");
        setProductForm(emptyProductForm);
      }
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "No fue posible guardar el producto.");
    }
  }

  return (
    <section className="space-y-6">
      <SectionTitle
        title={isEditing ? "Modificar producto" : "Nuevo producto"}
        description={isEditing ? "Edita el producto seleccionado sin salir del flujo de alta." : "Alta de producto con unidad, precio y stock inicial."}
      />

      <div className="flex flex-wrap gap-3">
        <Link to="/products/list">
          <Button type="button" variant="secondary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al listado
          </Button>
        </Link>
      </div>

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

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-brand-50 p-2 text-brand-600">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-950">{isEditing ? "Formulario de edicion" : "Formulario de alta"}</h2>
              <p className="text-sm text-slate-500">
                {isEditing ? "La ficha cambia de modo alta a modificacion al entrar desde el listado." : "Pantalla enfocada solo en crear productos nuevos."}
              </p>
            </div>
          </div>

          {(isEditing || productForm.name || productForm.barcode) && (
            <Button type="button" variant="secondary" onClick={resetProductForm}>
              <RotateCcw className="mr-2 h-4 w-4" />
              {isEditing ? "Restaurar datos" : "Limpiar"}
            </Button>
          )}
        </div>

        {isEditing && loadingProduct ? <p className="mt-5 text-sm text-slate-500">Cargando producto...</p> : null}

        {!isEditing || product ? (
          <form className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3" onSubmit={handleProductSubmit}>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Nombre</span>
              <input
                className={inputClassName}
                value={productForm.name}
                onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))}
                required
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Unidad de medida</span>
              <select
                className={inputClassName}
                value={productForm.unit_of_measure}
                onChange={(event) => {
                  const nextUnit = event.target.value as ProductUnit;
                  const unitMeta = getProductUnitMeta(nextUnit);
                  setProductForm((current) => ({
                    ...current,
                    unit_of_measure: nextUnit,
                    allows_decimal: unitMeta.allowsDecimal ? true : current.allows_decimal,
                  }));
                }}
              >
                {productUnitOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Categoria</span>
              <select
                className={inputClassName}
                value={productForm.category_id}
                onChange={(event) => setProductForm((current) => ({ ...current, category_id: event.target.value }))}
              >
                <option value="">Sin categoria</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Codigo de barras</span>
              <input
                className={inputClassName}
                value={productForm.barcode}
                onChange={(event) => setProductForm((current) => ({ ...current, barcode: event.target.value }))}
                required
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Codigo interno</span>
              <input
                className={inputClassName}
                value={productForm.internal_code}
                onChange={(event) => setProductForm((current) => ({ ...current, internal_code: event.target.value }))}
                placeholder="Opcional"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>{getProductUnitMeta(productForm.unit_of_measure).priceLabel}</span>
              <input
                className={inputClassName}
                type="number"
                min="0"
                step="0.01"
                value={productForm.sale_price}
                onChange={(event) => setProductForm((current) => ({ ...current, sale_price: event.target.value }))}
                required
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Costo promedio</span>
              <input
                className={inputClassName}
                type="number"
                min="0"
                step="0.01"
                value={productForm.average_cost}
                onChange={(event) => setProductForm((current) => ({ ...current, average_cost: event.target.value }))}
                required
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Stock inicial ({getProductUnitMeta(productForm.unit_of_measure).stockLabel})</span>
              <input
                className={`${inputClassName} ${isEditing ? "bg-slate-100 text-slate-500" : ""}`}
                type="number"
                min="0"
                step={productForm.allows_decimal ? "0.01" : "1"}
                value={productForm.stock_current}
                onChange={(event) => setProductForm((current) => ({ ...current, stock_current: event.target.value }))}
                disabled={isEditing}
                required={!isEditing}
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Stock minimo ({getProductUnitMeta(productForm.unit_of_measure).stockLabel})</span>
              <input
                className={inputClassName}
                type="number"
                min="0"
                step={productForm.allows_decimal ? "0.01" : "1"}
                value={productForm.stock_minimum}
                onChange={(event) => setProductForm((current) => ({ ...current, stock_minimum: event.target.value }))}
                required
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2 xl:col-span-3">
              <span>Descripcion</span>
              <textarea
                className={textareaClassName}
                value={productForm.description}
                onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))}
              />
            </label>

            <div className="flex flex-wrap gap-5 md:col-span-2 xl:col-span-2">
              <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  checked={productForm.allows_decimal}
                  disabled={getProductUnitMeta(productForm.unit_of_measure).allowsDecimal}
                  onChange={(event) => setProductForm((current) => ({ ...current, allows_decimal: event.target.checked }))}
                  type="checkbox"
                />
                <span>Permite decimal</span>
              </label>

              {isEditing ? (
                <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    checked={productForm.is_active}
                    onChange={(event) => setProductForm((current) => ({ ...current, is_active: event.target.checked }))}
                    type="checkbox"
                  />
                  <span>Activo</span>
                </label>
              ) : null}
            </div>

            <div className="md:col-span-2 xl:col-span-1 xl:flex xl:justify-end">
              <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending}>
                {isEditing ? <Save className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                {isEditing ? "Guardar cambios" : "Crear producto"}
              </Button>
            </div>
          </form>
        ) : null}

        {isEditing && !loadingProduct && !product ? (
          <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            No fue posible cargar el producto para editar.
            <div className="mt-3">
              <Button type="button" variant="secondary" onClick={() => navigate("/products/list")}>
                Volver al listado
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
