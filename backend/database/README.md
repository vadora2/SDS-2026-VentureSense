# Database Prototype

This folder contains the prototype database files.

| File | Purpose |
|---|---|
| `seed-database.json` | Full JSON seed database with group buy, products, and empty order tables |
| `schema.sql` | PostgreSQL/Supabase-style schema |
| `group_buys.csv` | Sample group-buy round |
| `products.csv` | Sample grocery catalogue |
| `buyers.csv` | Empty buyer table template |
| `orders.csv` | Empty order table template |
| `order_items.csv` | Empty order item table template |
| `payments.csv` | Empty payment table template |
| `fulfillment.csv` | Empty fulfillment table template |

## MVP Data Flow

```txt
Customer order page → Buyer record → Order record → Order items → Payment placeholder → Fulfillment placeholder → Dashboard consolidation
```
