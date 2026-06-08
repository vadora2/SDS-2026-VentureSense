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

## localStorage keys in prototype

- `ventureSenseRegisteredGroupBuys`
- `ventureSenseOrders`

For production, do not expose real PINs in frontend JavaScript. Validate PINs through a backend.
