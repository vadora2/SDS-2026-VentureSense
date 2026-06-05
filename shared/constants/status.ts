// Shared status constants.
// Use these exact values across customer ordering, admin dashboard, backend, and database.

export const GROUP_BUY_STATUS = {
  DRAFT: "draft",
  ACTIVE: "active",
  CLOSED: "closed",
  FULFILLED: "fulfilled",
  CANCELLED: "cancelled",
} as const;

export const ORDER_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
} as const;

export const PAYMENT_STATUS = {
  UNPAID: "unpaid",
  PAYMENT_SENT: "payment_sent",
  PAID: "paid",
  REFUNDED: "refunded",
} as const;

export const FULFILLMENT_STATUS = {
  NOT_PACKED: "not_packed",
  PACKED: "packed",
  COLLECTED: "collected",
  DELIVERED: "delivered",
} as const;

export const SUBSTITUTION_PREFERENCE = {
  ALLOW_SUBSTITUTE: "allow_substitute",
  CONTACT_FIRST: "contact_first",
  REFUND_ITEM: "refund_item",
} as const;
