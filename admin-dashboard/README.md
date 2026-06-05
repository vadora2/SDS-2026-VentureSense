# Admin Dashboard

This folder contains the admin-facing dashboard for Venture Sense.

## Purpose

Help Venture Sense admins centralise orders, reduce manual consolidation, track payment, and prepare packing lists.

## MVP Dashboard Tabs

1. Overview
2. Buyer Orders
3. Consolidated Totals
4. Payment Tracking
5. Packing List
6. Fulfillment Status

## Dashboard Features

### Overview

Show:

- Total orders
- Total buyers
- Estimated revenue
- Unpaid orders
- Packed orders
- Collected/delivered orders

### Buyer Orders

Admin should be able to view:

- Buyer name
- Phone
- Order items
- Subtotal
- Payment status
- Fulfillment status
- Notes

### Consolidated Totals

Admin should be able to view:

- Product name
- SKU
- Total quantity ordered
- Buyer breakdown
- Total product value

### Payment Tracking

Admin should be able to update:

```txt
unpaid
payment_sent
paid
refunded
```

### Packing List

Two useful views:

```txt
By buyer: what each customer should receive
By product: total stock needed for fulfillment
```

### Fulfillment Tracking

Admin should be able to update:

```txt
not_packed
packed
collected
delivered
```

## Frontend Folder

Use `frontend/` for the actual admin dashboard app code.
