# Venture Sense Group Buy Prototype

A 7-day prototype for Venture Sense grocery group-buy ordering software.

## Goal

Build a working MVP where customers order through an external mobile ordering link shared in WhatsApp, while Venture Sense admins view structured orders, consolidated product totals, payment status, and packing/collection status in an admin dashboard.

## MVP Flow

```txt
WhatsApp announcement
        ↓
Customer ordering page
        ↓
Central database
        ↓
Admin dashboard
        ↓
Manual payment / Shopify payment link
        ↓
Packing and collection/delivery
```

## Prototype Scope

### Must-have

- Customer can browse active group-buy products.
- Customer can add product quantities to cart.
- Customer can submit name, phone, address/unit, collection/delivery preference, and substitution preference.
- Order is saved as structured data.
- Admin can view all buyer orders.
- Admin can view consolidated totals by product/SKU.
- Admin can update payment and fulfillment status.
- Admin can generate or view packing list.

### Nice-to-have

- Product images.
- Group discount progress.
- CSV export.
- Manual Shopify payment link field.
- WhatsApp message templates.

### Not in 7-day MVP

- Full WhatsApp bot.
- Fully automated Shopify API integration.
- Delivery partner API.
- Advanced analytics.
- Multi-role login system.
- Automated refunds.

## Folder Structure

```txt
venture-sense-group-buy/
│
├── README.md
├── docs/
│   ├── project-brief.md
│   ├── user-flow.md
│   ├── database-schema.md
│   └── api-contract.md
│
├── customer-ordering/
│   ├── frontend/
│   └── README.md
│
├── admin-dashboard/
│   ├── frontend/
│   └── README.md
│
├── backend/
│   ├── api/
│   ├── database/
│   └── README.md
│
└── shared/
    ├── types/
    └── constants/
```

## Suggested Team Split

### Customer Ordering

Responsible for:

- Product catalogue page
- Cart
- Buyer details form
- Submit order flow
- Confirmation page

### Admin Dashboard

Responsible for:

- Buyer order table
- Consolidated SKU totals
- Payment status tracking
- Packing list
- Fulfillment status updates

### Backend / Database

Responsible for:

- Database schema
- API endpoints
- Data validation
- Shared order/product/status rules

## Demo Script

1. Admin creates or selects an active group-buy round.
2. Admin shares WhatsApp announcement with ordering link.
3. Customer opens ordering page.
4. Customer adds groceries to cart.
5. Customer submits buyer details and order.
6. Admin sees order appear in dashboard.
7. Dashboard auto-consolidates total product quantities.
8. Admin finalises stock and payment.
9. Admin marks order as paid, packed, collected, or delivered.
