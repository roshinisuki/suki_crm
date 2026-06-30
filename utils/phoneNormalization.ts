/**
 * Phone number normalization utility for E.164 format.
 * Used by Manual entry, Bulk Excel upload, and Meta webhooks (WhatsApp, Facebook, Instagram).
 */

/**
 * Normalize a phone number to E.164 format.
 * 
 * Supports:
 * - Numbers with country code (e.g., +919876543210)
 * - Numbers without country code (assumes India +91 by default for this CRM)
 * - Various separators (spaces, dashes, parentheses)
 * 
 * @param phone - Phone number string to normalize
 * @param defaultCountryCode - Default country code (default: "91" for India)
 * @returns Normalized E.164 phone number or null if invalid
 */
export function normalizePhoneToE164(phone: string | null | undefined, defaultCountryCode: string = "91"): string | null {
  if (!phone) return null;

  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, "");

  // Validate: must be 10-15 digits
  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    return null;
  }

  // If already has country code (starts with country code digits)
  if (digitsOnly.length === 12 && digitsOnly.startsWith(defaultCountryCode)) {
    return `+${digitsOnly}`;
  }

  // If starts with 0 (local format like 09876543210), remove leading 0 and add country code
  if (digitsOnly.length === 11 && digitsOnly.startsWith("0")) {
    return `+${defaultCountryCode}${digitsOnly.substring(1)}`;
  }

  // If exactly 10 digits (local format like 9876543210), add country code
  if (digitsOnly.length === 10) {
    return `+${defaultCountryCode}${digitsOnly}`;
  }

  // If already in E.164 format with + prefix
  if (phone.startsWith("+")) {
    const withoutPlus = phone.substring(1).replace(/\D/g, "");
    if (withoutPlus.length >= 10 && withoutPlus.length <= 15) {
      return `+${withoutPlus}`;
    }
  }

  // If digits only and > 10, assume it already includes country code
  if (digitsOnly.length > 10) {
    return `+${digitsOnly}`;
  }

  return null;
}

/**
 * Check if two phone numbers are the same (for duplicate detection).
 * Normalizes both to E.164 before comparison.
 */
export function arePhonesEqual(phone1: string | null | undefined, phone2: string | null | undefined): boolean {
  const normalized1 = normalizePhoneToE164(phone1);
  const normalized2 = normalizePhoneToE164(phone2);
  return normalized1 === normalized2 && normalized1 !== null;
}
