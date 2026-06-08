# API Contract for Future Dashboard Integration

The frontend prototype stores new group buys in localStorage. Later, replace that with these backend endpoints.

## POST /admin/group-buys

Creates a new group buy.

```json
{
  "group_buy_number": "003",
  "pin": "5821",
  "title": "Group Buy #003 - Yishun Grocery Round",
  "status": "active",
  "cutoff_at": "2026-06-14T20:00:00+08:00",
  "collection_slot": "Monday, 15 June 2026, 6pm-8pm",
  "location": "Yishun / North Region",
  "minimum_order_note": "No minimum order for prototype.",
  "payment_note": "Payment confirmed after stock review.",
  "product_ids": ["prod_001", "prod_002", "prod_004"]
}
```

## POST /verify-group-buy

Validates group buy access.

```json
{
  "group_buy_number": "003",
  "pin": "5821"
}
```

## POST /orders

Creates a provisional order. Each order must include `group_buy_id` and `group_buy_number`.
