# Backend

This folder contains backend/API/database logic.

For a fast prototype, this may be replaced by Google Sheets, Airtable, Supabase, Firebase, AppSheet, Glide, or Retool.

## Responsibilities

- Store group-buy rounds
- Store product catalogue
- Store buyer details
- Store orders and order items
- Calculate consolidated totals
- Track payment status
- Track fulfillment status
- Provide data to admin dashboard

## Suggested MVP Backend Options

### Fastest

```txt
Google Sheets / Airtable as database
Glide / AppSheet / Retool as dashboard
Simple form or frontend writing to database
```

### More technical

```txt
Supabase database
Next.js / React frontend
API routes for order creation and dashboard reads
```

## Backend Folder Structure

```txt
backend/
├── api/
│   └── README.md
├── database/
│   └── README.md
└── README.md
```
