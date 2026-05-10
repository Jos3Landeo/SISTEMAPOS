import { apiFetch } from "../../../lib/api";

import type { GeneralSettings, ScaleSettings } from "../types/settings";

type GeneralSettingsApi = {
  company_name: string;
  company_tax_id: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  ticket_footer_message: string;
};

type ScaleSettingsApi = {
  enabled: boolean;
  ean13_prefix: string;
  product_code_digits: number;
  value_digits: number;
  value_mode: ScaleSettings["valueMode"];
  value_decimals: number;
  lookup_field: ScaleSettings["lookupField"];
  lookup_format: ScaleSettings["lookupFormat"];
  lookup_prefix: string;
};

function mapGeneralFromApi(payload: GeneralSettingsApi): GeneralSettings {
  return {
    companyName: payload.company_name,
    companyTaxId: payload.company_tax_id,
    companyAddress: payload.company_address,
    companyPhone: payload.company_phone,
    companyEmail: payload.company_email,
    ticketFooterMessage: payload.ticket_footer_message,
  };
}

function mapGeneralToApi(payload: GeneralSettings): GeneralSettingsApi {
  return {
    company_name: payload.companyName,
    company_tax_id: payload.companyTaxId,
    company_address: payload.companyAddress,
    company_phone: payload.companyPhone,
    company_email: payload.companyEmail,
    ticket_footer_message: payload.ticketFooterMessage,
  };
}

function mapScaleFromApi(payload: ScaleSettingsApi): ScaleSettings {
  return {
    enabled: payload.enabled,
    ean13Prefix: payload.ean13_prefix,
    productCodeDigits: payload.product_code_digits,
    valueDigits: payload.value_digits,
    valueMode: payload.value_mode,
    valueDecimals: payload.value_decimals,
    lookupField: payload.lookup_field,
    lookupFormat: payload.lookup_format,
    lookupPrefix: payload.lookup_prefix,
  };
}

function mapScaleToApi(payload: ScaleSettings): ScaleSettingsApi {
  return {
    enabled: payload.enabled,
    ean13_prefix: payload.ean13Prefix,
    product_code_digits: payload.productCodeDigits,
    value_digits: payload.valueDigits,
    value_mode: payload.valueMode,
    value_decimals: payload.valueDecimals,
    lookup_field: payload.lookupField,
    lookup_format: payload.lookupFormat,
    lookup_prefix: payload.lookupPrefix,
  };
}

export const settingsService = {
  getGeneral: async (token: string) => mapGeneralFromApi(await apiFetch<GeneralSettingsApi>("/settings/general", { token })),
  saveGeneral: async (token: string, payload: GeneralSettings) =>
    mapGeneralFromApi(
      await apiFetch<GeneralSettingsApi>("/settings/general", {
        method: "PUT",
        token,
        body: JSON.stringify(mapGeneralToApi(payload)),
      }),
    ),
  getScale: async (token: string) => mapScaleFromApi(await apiFetch<ScaleSettingsApi>("/settings/scale", { token })),
  saveScale: async (token: string, payload: ScaleSettings) =>
    mapScaleFromApi(
      await apiFetch<ScaleSettingsApi>("/settings/scale", {
        method: "PUT",
        token,
        body: JSON.stringify(mapScaleToApi(payload)),
      }),
    ),
};
