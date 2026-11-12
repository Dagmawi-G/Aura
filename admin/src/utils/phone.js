/**
 * Restrict Ethiopian phone input to 9 digits after 0, 251, or +251.
 */
export function sanitizePhoneInput(value) {
  if (!value) return "";
  let cleaned = String(value).replace(/[^\d+]/g, "");

  if (cleaned.includes("+")) {
    cleaned = (cleaned.startsWith("+") ? "+" : "") + cleaned.replace(/\+/g, "");
  }

  if (cleaned.startsWith("+251")) {
    return cleaned.slice(0, 13);
  }
  if (cleaned.startsWith("+")) {
    return cleaned.slice(0, 13);
  }
  if (cleaned.startsWith("251")) {
    return cleaned.slice(0, 12);
  }
  if (cleaned.startsWith("0")) {
    return cleaned.slice(0, 10);
  }
  if ("251".startsWith(cleaned)) {
    return cleaned;
  }
  return cleaned.slice(0, 9);
}

/**
 * Validate that the phone number has exact 9 digits after 0, 251, or +251.
 */
export function isValidEthiopianPhone(phone) {
  if (!phone) return false;
  const cleaned = String(phone).trim().replace(/[\s-]/g, "");
  return /^(?:\+251|251|0)\d{9}$/.test(cleaned);
}

