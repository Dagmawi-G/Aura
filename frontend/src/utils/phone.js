/**
 * Restrict Ethiopian phone input to 9 digits after 0, 251, or +251.
 */
export function sanitizePhoneInput(value) {
  if (!value) return "";
  let cleaned = String(value).replace(/[^\d+]/g, "");

  // Allow '+' only as the very first character
  if (cleaned.includes("+")) {
    cleaned = (cleaned.startsWith("+") ? "+" : "") + cleaned.replace(/\+/g, "");
  }

  if (cleaned.startsWith("+251")) {
    return cleaned.slice(0, 13); // +251 + 9 digits
  }
  if (cleaned.startsWith("+")) {
    // Allow user to type +2, +25, +251...
    return cleaned.slice(0, 13);
  }
  if (cleaned.startsWith("251")) {
    return cleaned.slice(0, 12); // 251 + 9 digits
  }
  if (cleaned.startsWith("0")) {
    return cleaned.slice(0, 10); // 0 + 9 digits
  }
  // Allow user to type 2 -> 25 -> 251 prefix
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

