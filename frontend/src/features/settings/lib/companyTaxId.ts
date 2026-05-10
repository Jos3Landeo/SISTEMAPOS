export function formatChileanRut(value: string): string | null {
  const sanitized = value.replace(/[^0-9kK]/g, "").toUpperCase();
  if (!sanitized) {
    return "";
  }
  if (sanitized.length < 2) {
    return null;
  }

  const body = sanitized.slice(0, -1);
  const verifier = sanitized.slice(-1);
  if (!/^\d+$/.test(body)) {
    return null;
  }

  const factors = [2, 3, 4, 5, 6, 7];
  const total = body
    .split("")
    .reverse()
    .reduce((sum, digit, index) => sum + Number(digit) * factors[index % factors.length], 0);

  const remainder = 11 - (total % 11);
  const expectedVerifier = remainder === 11 ? "0" : remainder === 10 ? "K" : String(remainder);
  if (verifier !== expectedVerifier) {
    return null;
  }

  const bodyWithSeparators = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${bodyWithSeparators}-${verifier}`;
}

export function normalizeRutInput(value: string): string {
  return value.replace(/[^0-9kK.\-]/g, "").toUpperCase();
}
