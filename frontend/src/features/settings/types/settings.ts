export type ScaleValueMode = "weight" | "price";
export type ScaleLookupField = "barcode" | "internal_code";
export type ScaleLookupFormat = "code_only" | "prefix_plus_code";

export type GeneralSettings = {
  companyName: string;
  companyTaxId: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  ticketFooterMessage: string;
};

export type ScaleSettings = {
  enabled: boolean;
  ean13Prefix: string;
  productCodeDigits: number;
  valueDigits: number;
  valueMode: ScaleValueMode;
  valueDecimals: number;
  lookupField: ScaleLookupField;
  lookupFormat: ScaleLookupFormat;
  lookupPrefix: string;
};

export const defaultScaleSettings: ScaleSettings = {
  enabled: true,
  ean13Prefix: "20",
  productCodeDigits: 5,
  valueDigits: 5,
  valueMode: "weight",
  valueDecimals: 3,
  lookupField: "barcode",
  lookupFormat: "code_only",
  lookupPrefix: "",
};

export const defaultGeneralSettings: GeneralSettings = {
  companyName: "",
  companyTaxId: "",
  companyAddress: "",
  companyPhone: "",
  companyEmail: "",
  ticketFooterMessage: "",
};
