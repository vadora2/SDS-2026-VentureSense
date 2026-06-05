# Customer Ordering

This folder contains the customer-facing ordering page.

## Purpose

Customers open this page from a WhatsApp group-buy announcement link.

## MVP Screens

1. Group-buy landing page
2. Product catalogue
3. Cart summary
4. Buyer details form
5. Order confirmation page

## Customer Flow

```txt
Open WhatsApp link
        ↓
Browse products
        ↓
Add quantities
        ↓
Review cart
        ↓
Enter buyer details
        ↓
Submit order
        ↓
See confirmation
```

## Required Form Fields

| Field | Required |
|---|---|
| Name | Yes |
| Phone | Yes |
| Address/block/unit | Yes if delivery |
| Collection/delivery preference | Yes |
| Substitution preference | Yes |
| Notes | No |

## Substitution Preference Options

```txt
allow_substitute
contact_first
refund_item
```

## Submission Output

Every successful order submission should create:

- Buyer record
- Order record
- Order item records
- Initial status values

## Initial Status Values

```txt
order_status = pending
payment_status = unpaid
fulfillment_status = not_packed
```

## Frontend Folder

Use `frontend/` for the actual customer ordering app code.
