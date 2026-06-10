# Database Notes

## group_buys

- id
- group_buy_number
- pin
- title
- status
- cutoff_at
- collection_slot
- location
- minimum_order_note
- payment_note
- product_ids
- created_at
- updated_at
- seeded_from_catalogue
- synced_from_local_storage

## products

- id
- sku
- name
- category
- unit
- price
- image_url
- stock_note
- min_qty
- max_qty
- is_active
- created_at
- updated_at
- seeded_from_catalogue

## localStorage keys in prototype

- `ventureSenseRegisteredGroupBuys`
- `ventureSenseOrders`

## Firestore prototype collections

Firestore is the main prototype source for `products`, `group_buys`, `promos`, and `orders`.
`customer-ordering/frontend/catalogue.json` is used as a seed/fallback when Firestore is empty or unavailable.
Known seed docs from `catalogue.json` are repaired on startup so malformed demo data, such as stringified `product_ids`, is normalized back to the seed shape. Admin-created group buys with different ids are preserved.

### orders

Customer checkout writes one flattened document per order to the `orders` collection.
Order items stay embedded in the order document for the prototype.

- `order_id`
- `group_buy_id`
- `group_buy_number`
- `buyer_name`
- `phone`
- `address`
- `collection_preference`
- `buyer_notes`
- `items[]`
  - `product_id`
  - `product_name`
  - `sku`
  - `quantity`
  - `unit`
  - `unit_price`
  - `line_total`
  - `substitution_preference`
- `subtotal`
- `discount`
- `final_total`
- `order_status`
- `payment_status`
- `payment_method`
- `payment_submitted_at`
- `fulfillment_status`
- `promo_snapshot[]`
- `created_at`
- `local_created_at`

Valid prototype statuses:

- `order_status`: `pending`, `confirmed`, `cancelled`
- `payment_status`: `unpaid`, `payment_sent`, `paid`, `refunded`
- `fulfillment_status`: `not_packed`, `packed`, `collected`, `delivered`

### promos

Admin dashboard writes group-buy promo rules to the `promos` collection. Customer ordering reads active promos for the current `group_buy_id` and shows live progress using orders in the same group.

- `group_buy_id`
- `title`
- `promo_type`: `group_spend` or `item_quantity`
- `threshold_amount`
- `product_id`
- `product_name`
- `threshold_quantity`
- `benefit_label`
- `status`: `active` or `inactive`
- `created_at`
- `updated_at`

For production, do not expose real PINs in frontend JavaScript. Validate PINs through a backend.

Temporary local/demo Firestore rules can allow create/read/update on `orders` and read/write on `products`, `group_buys`, and `promos`, but do not use open rules in production.
