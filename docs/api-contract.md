# API Contract

This file defines the shared API expectations between the customer ordering page, admin dashboard, and backend.

For a no-code prototype, these can map to Airtable/Google Sheets/AppSheet/Glide actions instead of real HTTP endpoints.

## Base URL

```txt
/api
```

## Status Constants

Use these exact values.

### Group Buy Status

```txt
draft
active
closed
fulfilled
cancelled
```

### Order Status

```txt
pending
confirmed
cancelled
```

### Payment Status

```txt
unpaid
payment_sent
paid
refunded
```

### Fulfillment Status

```txt
not_packed
packed
collected
delivered
```

### Substitution Preference

```txt
allow_substitute
contact_first
refund_item
```

## Customer Ordering APIs

## GET /group-buys/active

Returns the active group-buy round.

### Response

```json
{
  "id": "gb_001",
  "title": "Group Buy #001 - Tampines Grocery Round",
  "status": "active",
  "cutoff_at": "2026-06-12T20:00:00+08:00",
  "collection_slot": "Saturday 2pm-5pm",
  "location": "Tampines",
  "order_link": "https://example.com/order/gb_001"
}
```

## GET /group-buys/:groupBuyId/products

Returns products available for a group-buy round.

### Response

```json
[
  {
    "id": "prod_001",
    "sku": "EGGS-TRAY-30",
    "name": "Fresh Eggs",
    "category": "Eggs/Dairy",
    "unit": "tray",
    "price": 7.50,
    "image_url": "",
    "stock_note": "Limited stock",
    "min_qty": 1,
    "max_qty": 5,
    "stock_status": "available"
  }
]
```

## POST /orders

Creates a new customer order.

### Request

```json
{
  "group_buy_id": "gb_001",
  "buyer": {
    "name": "Vadora Tang",
    "phone": "91234567",
    "address": "Blk 123 #04-56",
    "collection_preference": "collection",
    "notes": "Can collect after 3pm"
  },
  "items": [
    {
      "product_id": "prod_001",
      "quantity": 2,
      "unit_price": 7.50,
      "substitution_preference": "contact_first"
    }
  ]
}
```

### Response

```json
{
  "order_id": "ord_001",
  "order_status": "pending",
  "payment_status": "unpaid",
  "fulfillment_status": "not_packed",
  "subtotal": 15.00,
  "message": "Order received. Admin will confirm final payment after cutoff."
}
```

## Admin Dashboard APIs

## GET /admin/orders

Returns all orders for a group-buy round.

### Query Parameters

```txt
group_buy_id=gb_001
```

### Response

```json
[
  {
    "order_id": "ord_001",
    "buyer_name": "Vadora Tang",
    "phone": "91234567",
    "subtotal": 15.00,
    "final_total": 15.00,
    "order_status": "pending",
    "payment_status": "unpaid",
    "fulfillment_status": "not_packed",
    "created_at": "2026-06-05T10:00:00+08:00"
  }
]
```

## GET /admin/consolidated-totals

Returns total quantities by product.

### Query Parameters

```txt
group_buy_id=gb_001
```

### Response

```json
[
  {
    "product_id": "prod_001",
    "sku": "EGGS-TRAY-30",
    "name": "Fresh Eggs",
    "total_quantity": 42,
    "total_value": 315.00,
    "buyer_breakdown": [
      {
        "buyer_name": "Vadora Tang",
        "quantity": 2,
        "order_id": "ord_001"
      }
    ]
  }
]
```

## PATCH /admin/orders/:orderId/status

Updates order/payment/fulfillment status.

### Request

```json
{
  "order_status": "confirmed",
  "payment_status": "paid",
  "fulfillment_status": "packed",
  "admin_notes": "Payment confirmed manually."
}
```

### Response

```json
{
  "order_id": "ord_001",
  "updated": true
}
```

## GET /admin/packing-list

Returns packing list by buyer.

### Query Parameters

```txt
group_buy_id=gb_001
```

### Response

```json
[
  {
    "order_id": "ord_001",
    "buyer_name": "Vadora Tang",
    "phone": "91234567",
    "items": [
      {
        "name": "Fresh Eggs",
        "quantity": 2,
        "unit": "tray"
      }
    ],
    "fulfillment_status": "not_packed"
  }
]
```

## Manual Payment Flow

For the 7-day MVP:

```txt
1. Customer submits provisional order.
2. Admin reviews stock and total.
3. Admin sends PayNow/Shopify/manual payment link.
4. Admin updates payment_status to payment_sent.
5. After payment, admin updates payment_status to paid.
```

## Future Shopify Flow

Later:

```txt
1. Dashboard finalises order.
2. Backend creates Shopify draft order.
3. Shopify returns checkout/payment link.
4. Buyer pays through Shopify.
5. Shopify webhook updates dashboard payment status.
```
