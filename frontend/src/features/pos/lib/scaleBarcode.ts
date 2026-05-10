import type { Product } from "../../products/types/product";
import type { ScaleSettings } from "../../settings/types/settings";

type ParsedScaleBarcode = {
  lookupCode: string;
  embeddedValue: number;
};

function numericValueFromSegment(segment: string, decimals: number) {
  return Number(segment) / 10 ** decimals;
}

export function parseScaleBarcode(barcode: string, settings: ScaleSettings): ParsedScaleBarcode | null {
  if (!settings.enabled || barcode.length !== 13 || !/^\d{13}$/.test(barcode)) {
    return null;
  }

  if (!barcode.startsWith(settings.ean13Prefix)) {
    return null;
  }

  const productCodeStart = settings.ean13Prefix.length;
  const productCodeEnd = productCodeStart + settings.productCodeDigits;
  const valueEnd = productCodeEnd + settings.valueDigits;

  if (valueEnd > 12) {
    return null;
  }

  const productCode = barcode.slice(productCodeStart, productCodeEnd);
  const valueSegment = barcode.slice(productCodeEnd, valueEnd);

  return {
    lookupCode:
      settings.lookupFormat === "prefix_plus_code" ? `${settings.lookupPrefix}${productCode}` : productCode,
    embeddedValue: numericValueFromSegment(valueSegment, settings.valueDecimals),
  };
}

export function resolveScaleSale(product: Product, embeddedValue: number, settings: ScaleSettings) {
  if (settings.valueMode === "weight") {
    return {
      quantity: embeddedValue,
      unitPrice: Number(product.sale_price),
    };
  }

  const unitPrice = Number(product.sale_price);
  if (unitPrice <= 0) {
    throw new Error("El producto configurado para balanza debe tener un precio mayor a cero");
  }

  return {
    quantity: embeddedValue / unitPrice,
    unitPrice,
  };
}
