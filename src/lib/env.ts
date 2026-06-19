export function appUrl() {
  return process.env.APP_URL || "http://localhost:3000";
}

export function appName() {
  return process.env.APP_NAME || "qrpropina";
}

export function isDemoCheckoutEnabled() {
  return process.env.MP_ENABLE_DEMO_CHECKOUT !== "false";
}

export function platformCommissionPercent() {
  const value = Number(process.env.PLATFORM_COMMISSION_PERCENT || "5");

  if (!Number.isFinite(value) || value < 0 || value > 40) {
    return 5;
  }

  return value;
}

export function mercadoPagoApiBaseUrl() {
  return process.env.MERCADOPAGO_API_BASE_URL || "https://api.mercadopago.com";
}

export function mercadoPagoAuthBaseUrl() {
  return process.env.MERCADOPAGO_AUTH_BASE_URL || "https://auth.mercadopago.com.ar";
}

export function mercadoLibreApiBaseUrl() {
  return process.env.MERCADOLIBRE_API_BASE_URL || "https://api.mercadolibre.com";
}

export function useSandboxLink() {
  return process.env.MERCADOPAGO_USE_SANDBOX_LINK !== "false";
}
