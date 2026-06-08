# Venture Sense Group Buy Prototype

This version adds frontend group-buy registration.

## Run

```bash
cd customer-ordering/frontend
python3 -m http.server 8000
```

Open `http://localhost:8000`.

## What it supports

- Customer enters Group Buy Number + PIN.
- Admin can register a new group buy in the frontend.
- Admin selects which products are available for that group buy.
- App generates a WhatsApp message preview.
- New group buys are saved to browser localStorage.
- Customer orders are saved to browser localStorage.
- Export group buys as JSON.
- Export orders as JSON/CSV.

## Demo codes

- `001 / 2486`
- `002 / 7391`

## Prototype limitation

Registered group buys only exist in the current browser. For real integration, your friend's dashboard should own group-buy creation and save it to a shared backend database.
