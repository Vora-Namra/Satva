import { randomBytes } from "crypto";

// Generates: HAS-2026-A3F9K7 — unique, human-readable confirmation number
export function generateConfirmationNo(): string {
  const year = new Date().getFullYear();
  const random = randomBytes(3).toString("hex").toUpperCase();
  return `HAS-${year}-${random}`;
}