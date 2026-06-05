# Database Schema

This file defines the shared data structure for both the customer ordering page and admin dashboard.

## Naming Rules

Use consistent field names across frontend, backend, database, and dashboard.

Preferred style:

```txt
snake_case for database fields
camelCase for JavaScript/TypeScript variables
```

Example:

```txt
Database: buyer_name
Frontend: buyerName
```

## Tables

## 1. group_buys

Represents one group-buy round.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | string | Yes | Unique group-buy ID |
| title | string | Yes | Example: Group Buy #001 |
| status | string | Yes | draft, active, closed, fulfilled, cancelled |
| cutoff_at | datetime | Yes | Order closing time |
| collection_slot | string | Yes | Example: Saturday 2pm-5pm |
| location | string | Yes | Collection/delivery area |
| order_link | string | No | Customer-facing order link |
| created_at | datetime | Yes | Created timestamp |
| updated_at | datetime | Yes | Updated timestamp |

## 2. products

Represents available grocery products.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | string | Yes | Unique product ID |
| sku | string | Yes | Product SKU |
| name | string | Yes | Product name |
| category | string | Yes | Eggs/Dairy, Fruits, Vegetables, Pantry, Frozen |
| unit | string | Yes | Example: tray, pack, bottle, kg |
| price | number | Yes | Unit price |
| image_url | string | No | Product image |
| stock_note | string | No | Example: Limited stock |
| min_qty | number | No | Minimum order quantity |
| max_qty | number | No | Maximum order quantity |
| is_active | boolean | Yes | Whether product is active |
| created_at | datetime | Yes | Created timestamp |
| updated_at | datetime | Yes | Updated timestamp |

## 3. group_buy_products

Links products to a specific group-buy round.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | string | Yes | Unique row ID |
| group_buy_id | string | Yes | References group_buys.id |
| product_id | string | Yes | References products.id |
| round_price | number | Yes | Price for this round |
| stock_status | string | Yes | available, limited, unavailable |
| display_order | number | No | Sorting order |

## 4. buyers

Represents a customer/buyer.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | string | Yes | Unique buyer ID |
| name | string | Yes | Buyer name |
| phone | string | Yes | WhatsApp/contact number |
| address | string | No | Delivery address or block/unit |
| collection_preference | string | Yes | collection or delivery |
| notes | string | No | Buyer notes |
| created_at | datetime | Yes | Created timestamp |

## 5. orders

Represents one buyer's order for one group-buy round.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | string | Yes | Unique order ID |
| group_buy_id | string | Yes | References group_buys.id |
| buyer_id | string | Yes | References buyers.id |
| order_status | string | Yes | pending, confirmed, cancelled |
| payment_status | string | Yes | unpaid, payment_sent, paid, refunded |
| fulfillment_status | string | Yes | not_packed, packed, collected, delivered |
| subtotal | number | Yes | Estimated order subtotal |
| discount | number | No | Discount amount |
| final_total | number | No | Final payable total |
| admin_notes | string | No | Internal admin note |
| created_at | datetime | Yes | Created timestamp |
| updated_at | datetime | Yes | Updated timestamp |

## 6. order_items

Represents each product line inside an order.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | string | Yes | Unique order item ID |
| order_id | string | Yes | References orders.id |
| product_id | string | Yes | References products.id |
| quantity | number | Yes | Quantity ordered |
| unit_price | number | Yes | Price at order time |
| line_total | number | Yes | quantity × unit_price |
| substitution_preference | string | Yes | allow_substitute, contact_first, refund_item |
| item_status | string | Yes | pending, confirmed, substituted, refunded, cancelled |

## 7. payments

Represents payment tracking.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | string | Yes | Unique payment ID |
| order_id | string | Yes | References orders.id |
| payment_method | string | No | paynow, shopify, cash, manual |
| payment_link | string | No | Manual/Shopify payment link |
| amount | number | Yes | Amount payable |
| paid_at | datetime | No | Payment timestamp |
| refund_status | string | No | none, partial_refund, full_refund |
| payment_notes | string | No | Admin notes |

## 8. fulfillment

Represents packing, collection, and delivery status.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | string | Yes | Unique fulfillment ID |
| order_id | string | Yes | References orders.id |
| packed_status | string | Yes | not_packed, packed |
| collected_status | string | Yes | not_collected, collected |
| delivered_status | string | Yes | not_delivered, delivered |
| delivery_batch_id | string | No | Optional batch ID |
| exception_notes | string | No | Missing item, late collection, failed delivery |
| updated_at | datetime | Yes | Updated timestamp |

## 9. audit_logs

Tracks important admin/system changes.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | string | Yes | Unique audit log ID |
| entity_type | string | Yes | order, product, payment, fulfillment |
| entity_id | string | Yes | ID of affected entity |
| action | string | Yes | created, updated, cancelled, refunded |
| old_value | json | No | Previous value |
| new_value | json | No | New value |
| changed_by | string | No | Admin/system user |
| created_at | datetime | Yes | Created timestamp |
