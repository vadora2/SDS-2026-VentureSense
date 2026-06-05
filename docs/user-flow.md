# User Flow

## Customer Flow

```txt
1. Customer sees WhatsApp group-buy announcement.
2. Customer taps external order link.
3. Customer lands on active group-buy page.
4. Customer browses grocery catalogue.
5. Customer selects product quantities.
6. Customer reviews cart.
7. Customer enters buyer details.
8. Customer selects collection/delivery preference.
9. Customer selects substitution preference.
10. Customer submits provisional order.
11. Customer sees confirmation page.
12. Admin later sends payment instructions or payment link.
13. Customer pays.
14. Customer collects or receives order.
```

## Admin Flow

```txt
1. Admin creates group-buy round.
2. Admin selects products for the round.
3. Admin sets cutoff time, collection slot, and location.
4. Admin shares ordering link in WhatsApp.
5. Admin monitors incoming orders.
6. Dashboard consolidates total quantity by product.
7. Admin closes the order window.
8. Admin checks stock and substitutions.
9. Admin finalises payment amount.
10. Admin sends payment instructions/link.
11. Admin tracks paid/unpaid orders.
12. Admin uses packing list.
13. Admin marks orders as packed.
14. Admin marks orders as collected/delivered.
```

## Full Happy Path

| Step | Customer Action | Admin/System Action |
|---|---|---|
| 1 | Sees WhatsApp group-buy message | Admin has created an active group-buy round |
| 2 | Opens order link | System loads correct group-buy ID |
| 3 | Browses products | System displays active products |
| 4 | Adds quantities to cart | Cart calculates estimated subtotal |
| 5 | Enters buyer details | System validates required fields |
| 6 | Submits order | Database creates order and order items |
| 7 | Sees confirmation | Dashboard updates automatically |
| 8 | Waits for payment link | Admin reviews stock and totals |
| 9 | Pays after confirmation | Admin marks payment as paid |
| 10 | Collects/receives order | Admin marks order as fulfilled |

## Prototype Demo Flow

```txt
Admin shares WhatsApp link
        ↓
Buyer submits order
        ↓
Order appears in dashboard
        ↓
Dashboard shows consolidated totals
        ↓
Admin updates payment status
        ↓
Admin uses packing list
```
