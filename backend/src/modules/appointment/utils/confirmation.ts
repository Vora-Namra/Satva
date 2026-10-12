import crypto from "crypto";

export function generateConfirmationNo(): string {
  const prefix = "APT-";
  const randomStr = crypto.randomBytes(4).toString("hex").toUpperCase();
  const timestampStr = Date.now().toString().slice(-4);
  return `${prefix}${timestampStr}-${randomStr}`;
}