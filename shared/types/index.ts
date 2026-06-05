// Shared TypeScript types for Venture Sense Group Buy Prototype

export type GroupBuyStatus =
  | "draft"
  | "active"
  | "closed"
  | "fulfilled"
  | "cancelled";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "cancelled";

export type PaymentStatus =
  | "unpaid"
  | "payment_sent"
  | "paid"
  | "refunded";

export type FulfillmentStatus =
  | "not_packed"
  | "packed"
  | "collected"
  | "delivered";

export type SubstitutionPreference =
  | "allow_substitute"
  | "contact_first"
  | "refund_item";

export interface GroupBuy {
  id: string;
  title: string;
  status: GroupBuyStatus;
  cutoffAt: string;
  collectionSlot: string;
  location: string;
  orderLink?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  imageUrl?: string;
  stockNote?: string;
  minQty?: number;
  maxQty?: number;
  isActive: boolean;
}

export interface Buyer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  collectionPreference: "collection" | "delivery";
  notes?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  substitutionPreference: SubstitutionPreference;
  itemStatus: "pending" | "confirmed" | "substituted" | "refunded" | "cancelled";
}

export interface Order {
  id: string;
  groupBuyId: string;
  buyerId: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  subtotal: number;
  discount?: number;
  finalTotal?: number;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}
